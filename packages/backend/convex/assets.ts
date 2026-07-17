import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import {
  ASSET_LIFECYCLE_OPTIONS,
  assetRecordSchema,
  assetUpdateSchema,
  normalizeAssetName,
  normalizeRegistrationNumber,
  type CanonicalAssetRecordInput,
} from "../src/domain/asset-record.js";
import { mutation, query } from "./_generated/server.js";
import { recordActivity } from "./activityWriter.js";
import { assetLifecycleCounts } from "./assetAggregates.js";
import { activeRunForOrganization } from "./demo.js";
import { enforceAuth, enforceBoundary } from "./helpers.js";

import type { DataModel, Id } from "./_generated/dataModel.js";
import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function canonicalFingerprint(input: CanonicalAssetRecordInput): string {
  return JSON.stringify(input);
}

function toPublicAsset(asset: Record<string, unknown>) {
  const {
    _id: _internalId,
    _creationTime: _internalCreationTime,
    organizationId: _organizationId,
    createdBy: _createdBy,
    normalizedName: _normalizedName,
    normalizedRegistrationNumber: _normalizedRegistrationNumber,
    createRequestId: _createRequestId,
    createFingerprint: _createFingerprint,
    ...publicAsset
  } = asset;
  return publicAsset;
}

async function findAsset(
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
  organizationId: Id<"organizations">,
  assetId: string,
) {
  return await ctx.db
    .query("assets")
    .withIndex("by_organizationId_assetId", (q) =>
      q.eq("organizationId", organizationId).eq("assetId", assetId),
    )
    .first();
}

export const create = mutation({
  args: {
    boundaryKey: v.string(),
    sessionTokenHash: v.string(),
    createRequestId: v.string(),
    correlationId: v.string(),
    input: v.any(),
  },
  handler: async (ctx, args) => {
    const session = await enforceAuth(ctx, args.sessionTokenHash, args.boundaryKey);
    if (!UUID_PATTERN.test(args.createRequestId)) throw new Error("INVALID_CREATE_REQUEST_ID");
    const input = assetRecordSchema.parse(args.input);
    const fingerprint = canonicalFingerprint(input);
    const replay = await ctx.db
      .query("assets")
      .withIndex("by_organizationId_requestId", (q) =>
        q.eq("organizationId", session.organizationId).eq("createRequestId", args.createRequestId),
      )
      .first();
    if (replay) {
      if (replay.createFingerprint !== fingerprint) throw new Error("CREATE_REQUEST_CONFLICT");
      return { asset: toPublicAsset(replay), replayed: true };
    }
    const normalizedRegistrationNumber = normalizeRegistrationNumber(input.registrationNumber);
    const registration = await ctx.db
      .query("assets")
      .withIndex("by_organizationId_registration", (q) =>
        q
          .eq("organizationId", session.organizationId)
          .eq("normalizedRegistrationNumber", normalizedRegistrationNumber),
      )
      .first();
    if (registration) throw new Error("REGISTRATION_NUMBER_CONFLICT");
    const now = Date.now();
    const assetId = crypto.randomUUID();
    const demoRun = await activeRunForOrganization(ctx, session.organizationId);
    if (demoRun) {
      const existingRunAsset = await ctx.db
        .query("assets")
        .withIndex("by_organizationId_runId", (q) =>
          q.eq("organizationId", session.organizationId).eq("runId", demoRun.runId),
        )
        .first();
      if (existingRunAsset) throw new Error("DEMO_RUN_ASSET_ALREADY_EXISTS");
    }
    const id = await ctx.db.insert("assets", {
      ...input,
      assetId,
      organizationId: session.organizationId,
      createdBy: session.userId,
      normalizedName: normalizeAssetName(input.name),
      normalizedRegistrationNumber,
      lifecycle: "Draft",
      createdAt: now,
      updatedAt: now,
      version: 1,
      createRequestId: args.createRequestId,
      createFingerprint: fingerprint,
      runId: demoRun?.runId,
    });
    await recordActivity(ctx, {
      organizationId: session.organizationId,
      userId: session.userId,
      actorKind: "user",
      eventType: "asset.created",
      subjectId: assetId,
      outcome: "success",
      correlationId: args.correlationId,
      eventId: args.correlationId,
      assetId,
      runId: demoRun?.runId,
      metadata: { lifecycle: "Draft" },
      timestamp: now,
    });
    const asset = (await ctx.db.get(id))!;
    await assetLifecycleCounts.insertIfDoesNotExist(ctx, asset);
    return { asset: toPublicAsset(asset), replayed: false };
  },
});

export const get = query({
  args: { boundaryKey: v.string(), sessionTokenHash: v.string(), assetId: v.string() },
  handler: async (ctx, args) => {
    const session = await enforceAuth(ctx, args.sessionTokenHash, args.boundaryKey);
    const asset = await findAsset(ctx, session.organizationId, args.assetId);
    if (!asset) throw new Error("ASSET_NOT_FOUND");
    return toPublicAsset(asset);
  },
});

export const update = mutation({
  args: {
    boundaryKey: v.string(),
    sessionTokenHash: v.string(),
    assetId: v.string(),
    correlationId: v.string(),
    input: v.any(),
  },
  handler: async (ctx, args) => {
    const session = await enforceAuth(ctx, args.sessionTokenHash, args.boundaryKey);
    const parsed = assetUpdateSchema.parse(args.input);
    const asset = await findAsset(ctx, session.organizationId, args.assetId);
    if (!asset) throw new Error("ASSET_NOT_FOUND");
    if (asset.lifecycle !== "Draft") throw new Error("ASSET_NOT_EDITABLE");
    if (asset.version !== parsed.expectedVersion) throw new Error("ASSET_VERSION_CONFLICT");
    const { expectedVersion: _expectedVersion, ...input } = parsed;
    const normalizedRegistrationNumber = normalizeRegistrationNumber(input.registrationNumber);
    if (normalizedRegistrationNumber !== asset.normalizedRegistrationNumber) {
      const registration = await ctx.db
        .query("assets")
        .withIndex("by_organizationId_registration", (q) =>
          q
            .eq("organizationId", session.organizationId)
            .eq("normalizedRegistrationNumber", normalizedRegistrationNumber),
        )
        .first();
      if (registration && registration._id !== asset._id) {
        throw new Error("REGISTRATION_NUMBER_CONFLICT");
      }
    }
    const changedFields = Object.keys(input).filter(
      (key) => input[key as keyof typeof input] !== asset[key as keyof typeof asset],
    );
    if (changedFields.length === 0)
      return { asset: toPublicAsset(asset), outcome: "unchanged" as const };
    const now = Date.now();
    const updateFields = {
      ...input,
      normalizedName: normalizeAssetName(input.name),
      normalizedRegistrationNumber,
      updatedAt: now,
      version: asset.version + 1,
    };
    await ctx.db.patch(asset._id, updateFields);
    await recordActivity(ctx, {
      organizationId: session.organizationId,
      userId: session.userId,
      actorKind: "user",
      eventType: "asset.updated",
      subjectId: asset.assetId,
      outcome: "success",
      correlationId: args.correlationId,
      eventId: args.correlationId,
      assetId: asset.assetId,
      runId: asset.runId,
      metadata: { changedFields, lifecycle: asset.lifecycle },
      timestamp: now,
    });
    return {
      asset: toPublicAsset({ ...asset, ...updateFields }),
      outcome: "updated" as const,
    };
  },
});

export const list = query({
  args: {
    boundaryKey: v.string(),
    sessionTokenHash: v.string(),
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await enforceAuth(ctx, args.sessionTokenHash, args.boundaryKey);
    const maximumLimit = args.search ? 50 : 100;
    if (
      !Number.isInteger(args.paginationOpts.numItems) ||
      args.paginationOpts.numItems < 1 ||
      args.paginationOpts.numItems > maximumLimit
    ) {
      throw new Error("INVALID_LIMIT");
    }
    const limit = args.paginationOpts.numItems;
    const search = args.search?.normalize("NFKC").trim();
    if (search) {
      const namePrefix = normalizeAssetName(search);
      const registrationPrefix = normalizeRegistrationNumber(search);
      const [nameMatches, registrationMatches] = await Promise.all([
        ctx.db
          .query("assets")
          .withIndex("by_organizationId_name", (q) =>
            q
              .eq("organizationId", session.organizationId)
              .gte("normalizedName", namePrefix)
              .lt("normalizedName", `${namePrefix}\uffff`),
          )
          .take(50),
        ctx.db
          .query("assets")
          .withIndex("by_organizationId_registration", (q) =>
            q
              .eq("organizationId", session.organizationId)
              .gte("normalizedRegistrationNumber", registrationPrefix)
              .lt("normalizedRegistrationNumber", `${registrationPrefix}\uffff`),
          )
          .take(50),
      ]);
      const deduplicated = new Map(
        [...nameMatches, ...registrationMatches].map((asset) => [asset.assetId, asset]),
      );
      const items = [...deduplicated.values()]
        .sort(
          (a, b) =>
            a.normalizedName.localeCompare(b.normalizedName) || a.assetId.localeCompare(b.assetId),
        )
        .slice(0, limit)
        .map((asset) => toPublicAsset(asset));
      return { items, nextCursor: null, mode: "search" as const };
    }
    const result = await ctx.db
      .query("assets")
      .withIndex("by_organizationId_updatedAt", (q) =>
        q.eq("organizationId", session.organizationId),
      )
      .order("desc")
      .paginate(args.paginationOpts);
    return {
      items: result.page.map((asset) => toPublicAsset(asset)),
      nextCursor: result.isDone ? null : result.continueCursor,
      mode: "list" as const,
    };
  },
});

export const workspaceSummary = query({
  args: { boundaryKey: v.string(), sessionTokenHash: v.string() },
  handler: async (ctx, args) => {
    const session = await enforceAuth(ctx, args.sessionTokenHash, args.boundaryKey);
    const recent = await ctx.db
      .query("assets")
      .withIndex("by_organizationId_updatedAt", (q) =>
        q.eq("organizationId", session.organizationId),
      )
      .order("desc")
      .take(5);
    const lifecycleCounts = await Promise.all(
      ASSET_LIFECYCLE_OPTIONS.map((status) =>
        assetLifecycleCounts.count(ctx, {
          namespace: session.organizationId,
          bounds: {
            lower: { key: status, inclusive: true },
            upper: { key: status, inclusive: true },
          },
        }),
      ),
    );
    const counts = Object.fromEntries(
      ASSET_LIFECYCLE_OPTIONS.map((status, index) => [status, lifecycleCounts[index]!]),
    ) as Record<string, number>;
    const total = await assetLifecycleCounts.count(ctx, { namespace: session.organizationId });
    const recentAssets = recent.map((asset) => toPublicAsset(asset));
    return { counts: { ...counts, total }, recentAssets };
  },
});

export const backfillLifecycleCounts = mutation({
  args: {
    boundaryKey: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    enforceBoundary(args.boundaryKey);
    if (
      !Number.isInteger(args.paginationOpts.numItems) ||
      args.paginationOpts.numItems < 1 ||
      args.paginationOpts.numItems > 50
    ) {
      throw new Error("INVALID_LIMIT");
    }
    const result = await ctx.db.query("assets").paginate(args.paginationOpts);
    for (const asset of result.page) {
      await assetLifecycleCounts.insertIfDoesNotExist(ctx, asset);
    }
    return {
      continueCursor: result.continueCursor,
      isDone: result.isDone,
      processed: result.page.length,
    };
  },
});
