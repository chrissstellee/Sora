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
import { enforceAuth } from "./helpers.js";

import type { DataModel, Id } from "./_generated/dataModel.js";
import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";

const MAX_ACTIVITY_METADATA_BYTES = 2_048;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function canonicalFingerprint(input: CanonicalAssetRecordInput): string {
  return JSON.stringify(input);
}

function activityMetadata(value: { status?: string; changedFields?: string[] }): string {
  const metadata = JSON.stringify(value);
  if (new TextEncoder().encode(metadata).byteLength > MAX_ACTIVITY_METADATA_BYTES) {
    throw new Error("ACTIVITY_METADATA_TOO_LARGE");
  }
  return metadata;
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
    });
    await ctx.db.insert("activityEvents", {
      organizationId: session.organizationId,
      userId: session.userId,
      eventType: "asset.created",
      timestamp: now,
      outcome: "success",
      correlationId: args.correlationId,
      eventId: args.correlationId,
      assetId,
      metadata: activityMetadata({ status: "Draft" }),
    });
    return { asset: toPublicAsset((await ctx.db.get(id))!), replayed: false };
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
    await ctx.db.patch(asset._id, {
      ...input,
      normalizedName: normalizeAssetName(input.name),
      normalizedRegistrationNumber,
      updatedAt: now,
      version: asset.version + 1,
    });
    await ctx.db.insert("activityEvents", {
      organizationId: session.organizationId,
      userId: session.userId,
      eventType: "asset.updated",
      timestamp: now,
      outcome: "success",
      correlationId: args.correlationId,
      eventId: args.correlationId,
      assetId: asset.assetId,
      metadata: activityMetadata({ changedFields }),
    });
    return { asset: toPublicAsset((await ctx.db.get(asset._id))!), outcome: "updated" as const };
  },
});

export const list = query({
  args: {
    boundaryKey: v.string(),
    sessionTokenHash: v.string(),
    cursor: v.optional(v.string()),
    limit: v.number(),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await enforceAuth(ctx, args.sessionTokenHash, args.boundaryKey);
    const limit = Math.max(1, Math.min(args.search ? 50 : 100, Math.trunc(args.limit)));
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
    const assets = await ctx.db
      .query("assets")
      .withIndex("by_organizationId_updatedAt", (q) =>
        q.eq("organizationId", session.organizationId),
      )
      .collect();
    const ordered = assets.sort(
      (a, b) => b.updatedAt - a.updatedAt || a.assetId.localeCompare(b.assetId),
    );
    const cursorIndex = args.cursor
      ? ordered.findIndex((item) => item.assetId === args.cursor)
      : -1;
    if (args.cursor && cursorIndex < 0) throw new Error("INVALID_CURSOR");
    const start = cursorIndex + 1;
    const page = ordered.slice(start, start + limit);
    const hasMore = start + limit < ordered.length;
    return {
      items: page.map((asset) => toPublicAsset(asset)),
      nextCursor: hasMore ? (page[page.length - 1]?.assetId ?? null) : null,
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
      .take(10);
    const lifecycleRows = await Promise.all(
      ASSET_LIFECYCLE_OPTIONS.map((status) =>
        ctx.db
          .query("assets")
          .withIndex("by_organizationId_lifecycle", (q) =>
            q.eq("organizationId", session.organizationId).eq("lifecycle", status),
          )
          .collect(),
      ),
    );
    const counts = Object.fromEntries(
      ASSET_LIFECYCLE_OPTIONS.map((status, index) => [status, lifecycleRows[index]!.length]),
    ) as Record<string, number>;
    const total = lifecycleRows.reduce((sum, rows) => sum + rows.length, 0);
    const recentAssets = recent
      .sort((a, b) => b.updatedAt - a.updatedAt || a.assetId.localeCompare(b.assetId))
      .slice(0, 5)
      .map((asset) => toPublicAsset(asset));
    return { counts: { ...counts, total }, recentAssets };
  },
});
