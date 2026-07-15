import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import { transitionAssetLifecycle } from "../src/domain/asset-lifecycle.js";
import {
  MAX_ACTIVE_DOCUMENTS,
  REVIEW_CHECKLIST_VERSION,
  canonicalReviewManifest,
  canonicalizeTokenizationProfile,
  sha256Hex,
} from "../src/domain/tokenization.js";
import { mutation, query } from "./_generated/server.js";
import { assetLifecycleCounts } from "./assetAggregates.js";
import { enforceAuth } from "./helpers.js";

import type { DataModel, Id } from "./_generated/dataModel.js";
import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";

const MAX_ACTIVITY_METADATA_BYTES = 2_048;

function safeMetadata(value: Record<string, string | number | boolean>): string {
  const encoded = JSON.stringify(value);
  if (new TextEncoder().encode(encoded).byteLength > MAX_ACTIVITY_METADATA_BYTES) {
    throw new Error("ACTIVITY_METADATA_TOO_LARGE");
  }
  return encoded;
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
    .unique();
}

async function findProfile(
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
  organizationId: Id<"organizations">,
  assetId: string,
) {
  return await ctx.db
    .query("tokenizationProfiles")
    .withIndex("by_organizationId_assetId", (q) =>
      q.eq("organizationId", organizationId).eq("assetId", assetId),
    )
    .unique();
}

function publicProfile(profile: NonNullable<Awaited<ReturnType<typeof findProfile>>>) {
  const {
    _id,
    _creationTime,
    organizationId: _organizationId,
    updatedBy: _updatedBy,
    ...safe
  } = profile;
  return safe;
}

async function transitionAsset(
  ctx: GenericMutationCtx<DataModel>,
  asset: NonNullable<Awaited<ReturnType<typeof findAsset>>>,
  lifecycle: "Draft" | "Review" | "Ready" | "Archived",
  additional: Record<string, unknown> = {},
) {
  transitionAssetLifecycle(
    asset.lifecycle as Parameters<typeof transitionAssetLifecycle>[0],
    lifecycle,
  );
  const updated = {
    ...asset,
    ...additional,
    lifecycle,
    version: asset.version + 1,
    updatedAt: Date.now(),
  };
  await ctx.db.patch(asset._id, {
    ...additional,
    lifecycle,
    version: updated.version,
    updatedAt: updated.updatedAt,
  });
  await assetLifecycleCounts.replace(ctx, asset, updated);
  return updated;
}

async function addEvent(
  ctx: GenericMutationCtx<DataModel>,
  input: {
    organizationId: Id<"organizations">;
    userId: Id<"users">;
    assetId: string;
    eventType: string;
    correlationId: string;
    metadata: Record<string, string | number | boolean>;
  },
) {
  await ctx.db.insert("activityEvents", {
    organizationId: input.organizationId,
    userId: input.userId,
    eventType: input.eventType,
    timestamp: Date.now(),
    outcome: "success",
    correlationId: input.correlationId,
    eventId: input.correlationId,
    assetId: input.assetId,
    metadata: safeMetadata(input.metadata),
  });
}

export const updateProfile = mutation({
  args: {
    boundaryKey: v.string(),
    sessionTokenHash: v.string(),
    assetId: v.string(),
    expectedAssetVersion: v.number(),
    expectedProfileVersion: v.optional(v.number()),
    correlationId: v.string(),
    profile: v.object({
      assetCode: v.string(),
      proposedSupply: v.string(),
      internalReference: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const session = await enforceAuth(ctx, args.sessionTokenHash, args.boundaryKey);
    const asset = await findAsset(ctx, session.organizationId, args.assetId);
    if (!asset) throw new Error("ASSET_NOT_FOUND");
    if (asset.lifecycle !== "Draft") throw new Error("ASSET_NOT_EDITABLE");
    if (asset.version !== args.expectedAssetVersion) throw new Error("ASSET_VERSION_CONFLICT");
    const canonical = canonicalizeTokenizationProfile(args.profile);
    const existing = await findProfile(ctx, session.organizationId, args.assetId);
    if (existing && existing.version !== args.expectedProfileVersion) {
      throw new Error("PROFILE_VERSION_CONFLICT");
    }
    if (!existing && args.expectedProfileVersion !== undefined) {
      throw new Error("PROFILE_VERSION_CONFLICT");
    }
    const unchanged =
      existing &&
      existing.assetCode === canonical.assetCode &&
      existing.supplyUnits === canonical.supplyUnits &&
      existing.internalReference === canonical.internalReference;
    if (unchanged) return { profile: publicProfile(existing), assetVersion: asset.version };
    const now = Date.now();
    let profile;
    if (existing) {
      const next = {
        ...canonical,
        version: existing.version + 1,
        updatedAt: now,
        updatedBy: session.userId,
      };
      await ctx.db.patch(existing._id, next);
      profile = { ...existing, ...next };
    } else {
      const profileId = crypto.randomUUID();
      const id = await ctx.db.insert("tokenizationProfiles", {
        ...canonical,
        profileId,
        organizationId: session.organizationId,
        assetId: asset.assetId,
        version: 1,
        createdAt: now,
        updatedAt: now,
        updatedBy: session.userId,
      });
      profile = (await ctx.db.get(id))!;
    }
    await ctx.db.patch(asset._id, { version: asset.version + 1, updatedAt: now });
    await addEvent(ctx, {
      ...session,
      assetId: asset.assetId,
      eventType: "asset.token_proposal_updated",
      correlationId: args.correlationId,
      metadata: { profileId: profile.profileId, profileVersion: profile.version },
    });
    return { profile: publicProfile(profile), assetVersion: asset.version + 1 };
  },
});

export const getReviewSnapshot = query({
  args: { boundaryKey: v.string(), sessionTokenHash: v.string(), assetId: v.string() },
  handler: async (ctx, args) => {
    const session = await enforceAuth(ctx, args.sessionTokenHash, args.boundaryKey);
    const asset = await findAsset(ctx, session.organizationId, args.assetId);
    if (!asset) throw new Error("ASSET_NOT_FOUND");
    const [profile, documents] = await Promise.all([
      findProfile(ctx, session.organizationId, asset.assetId),
      ctx.db
        .query("supportingDocuments")
        .withIndex("by_organizationId_assetId_state", (q) =>
          q
            .eq("organizationId", session.organizationId)
            .eq("assetId", asset.assetId)
            .eq("state", "Active"),
        )
        .take(MAX_ACTIVE_DOCUMENTS + 1),
    ]);
    const blockers = [
      ...(profile ? [] : [{ section: "tokenization-profile", code: "PROFILE_REQUIRED" }]),
      ...(documents.length ? [] : [{ section: "documents", code: "DOCUMENT_REQUIRED" }]),
    ];
    return {
      asset: {
        assetId: asset.assetId,
        name: asset.name,
        category: asset.category,
        description: asset.description,
        legalOwner: asset.legalOwner,
        registrationNumber: asset.registrationNumber,
        lifecycle: asset.lifecycle,
        version: asset.version,
        updatedAt: asset.updatedAt,
      },
      profile: profile ? publicProfile(profile) : null,
      documents: documents.map(
        ({ storageId: _storageId, organizationId: _org, createdBy: _by, ...doc }) => doc,
      ),
      readiness: { ready: blockers.length === 0, blockers },
      network: "Stellar Testnet",
    };
  },
});

export const submitReview = mutation({
  args: {
    boundaryKey: v.string(),
    sessionTokenHash: v.string(),
    assetId: v.string(),
    expectedAssetVersion: v.number(),
    correlationId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await enforceAuth(ctx, args.sessionTokenHash, args.boundaryKey);
    const asset = await findAsset(ctx, session.organizationId, args.assetId);
    if (!asset) throw new Error("ASSET_NOT_FOUND");
    if (asset.lifecycle !== "Draft") throw new Error("LIFECYCLE_CONFLICT");
    if (asset.version !== args.expectedAssetVersion) throw new Error("ASSET_VERSION_CONFLICT");
    const [profile, documents] = await Promise.all([
      findProfile(ctx, session.organizationId, asset.assetId),
      ctx.db
        .query("supportingDocuments")
        .withIndex("by_organizationId_assetId_state", (q) =>
          q
            .eq("organizationId", session.organizationId)
            .eq("assetId", asset.assetId)
            .eq("state", "Active"),
        )
        .take(MAX_ACTIVE_DOCUMENTS + 1),
    ]);
    if (!profile || documents.length === 0 || documents.length > MAX_ACTIVE_DOCUMENTS) {
      throw new Error("ASSET_NOT_READY_FOR_REVIEW");
    }
    const basis = {
      assetId: asset.assetId,
      assetVersion: asset.version,
      profileId: profile.profileId,
      profileVersion: profile.version,
      documents: documents.map((document) => ({
        documentId: document.documentId,
        version: document.version,
        sha256: document.sha256,
      })),
    };
    const canonicalManifest = canonicalReviewManifest(basis);
    const fingerprint = await sha256Hex(canonicalManifest);
    const manifestId = crypto.randomUUID();
    const manifestDocId = await ctx.db.insert("reviewManifests", {
      manifestId,
      organizationId: session.organizationId,
      assetId: asset.assetId,
      assetVersion: asset.version,
      profileId: profile.profileId,
      profileVersion: profile.version,
      checklistVersion: REVIEW_CHECKLIST_VERSION,
      canonicalManifest,
      fingerprint,
      submittedBy: session.userId,
      submittedAt: Date.now(),
    });
    for (const document of basis.documents) {
      await ctx.db.insert("reviewManifestDocuments", {
        organizationId: session.organizationId,
        manifestId,
        ...document,
      });
    }
    const updated = await transitionAsset(ctx, asset, "Review", {
      reviewManifestId: manifestDocId,
    });
    await addEvent(ctx, {
      ...session,
      assetId: asset.assetId,
      eventType: "asset.review_submitted",
      correlationId: args.correlationId,
      metadata: { manifestId, fingerprint, documentCount: documents.length },
    });
    return { manifestId, fingerprint, lifecycle: updated.lifecycle, assetVersion: updated.version };
  },
});

export const returnReview = mutation({
  args: {
    boundaryKey: v.string(),
    sessionTokenHash: v.string(),
    assetId: v.string(),
    expectedAssetVersion: v.number(),
    reason: v.string(),
    correlationId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await enforceAuth(ctx, args.sessionTokenHash, args.boundaryKey);
    const reason = args.reason.normalize("NFKC").trim().replace(/\s+/g, " ");
    if (reason.length < 10 || reason.length > 500) throw new Error("INVALID_RETURN_REASON");
    const asset = await findAsset(ctx, session.organizationId, args.assetId);
    if (!asset) throw new Error("ASSET_NOT_FOUND");
    if (asset.lifecycle !== "Review") throw new Error("LIFECYCLE_CONFLICT");
    if (asset.version !== args.expectedAssetVersion) throw new Error("ASSET_VERSION_CONFLICT");
    if (!asset.reviewManifestId) throw new Error("REVIEW_MANIFEST_MISSING");
    const manifest = await ctx.db.get(asset.reviewManifestId);
    if (!manifest) throw new Error("REVIEW_MANIFEST_MISSING");
    const existing = await ctx.db
      .query("reviewDecisions")
      .withIndex("by_organizationId_manifestId_decision", (q) =>
        q
          .eq("organizationId", session.organizationId)
          .eq("manifestId", manifest.manifestId)
          .eq("decision", "Returned"),
      )
      .unique();
    if (!existing) {
      await ctx.db.insert("reviewDecisions", {
        decisionId: crypto.randomUUID(),
        organizationId: session.organizationId,
        assetId: asset.assetId,
        manifestId: manifest.manifestId,
        decision: "Returned",
        reason,
        actorId: session.userId,
        decidedAt: Date.now(),
      });
    }
    const updated = await transitionAsset(ctx, asset, "Draft", { reviewManifestId: undefined });
    await addEvent(ctx, {
      ...session,
      assetId: asset.assetId,
      eventType: "asset.review_returned",
      correlationId: args.correlationId,
      metadata: { manifestId: manifest.manifestId, reason },
    });
    return { lifecycle: updated.lifecycle, assetVersion: updated.version, reason };
  },
});

export const approve = mutation({
  args: {
    boundaryKey: v.string(),
    sessionTokenHash: v.string(),
    assetId: v.string(),
    expectedAssetVersion: v.number(),
    correlationId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await enforceAuth(ctx, args.sessionTokenHash, args.boundaryKey);
    const asset = await findAsset(ctx, session.organizationId, args.assetId);
    if (!asset) throw new Error("ASSET_NOT_FOUND");
    const priorApproval = await ctx.db
      .query("reviewDecisions")
      .withIndex("by_organizationId_assetId", (q) =>
        q.eq("organizationId", session.organizationId).eq("assetId", asset.assetId),
      )
      .order("desc")
      .take(10);
    const replay = priorApproval.find((decision) => decision.decision === "Approved");
    if (asset.lifecycle === "Ready" && replay) {
      return {
        decisionId: replay.decisionId,
        lifecycle: asset.lifecycle,
        assetVersion: asset.version,
        replayed: true,
      };
    }
    if (asset.lifecycle !== "Review") throw new Error("LIFECYCLE_CONFLICT");
    if (asset.version !== args.expectedAssetVersion) throw new Error("ASSET_VERSION_CONFLICT");
    if (!asset.reviewManifestId) throw new Error("REVIEW_MANIFEST_MISSING");
    const manifest = await ctx.db.get(asset.reviewManifestId);
    if (!manifest) throw new Error("REVIEW_MANIFEST_MISSING");
    const decisionId = crypto.randomUUID();
    await ctx.db.insert("reviewDecisions", {
      decisionId,
      organizationId: session.organizationId,
      assetId: asset.assetId,
      manifestId: manifest.manifestId,
      decision: "Approved",
      actorId: session.userId,
      decidedAt: Date.now(),
    });
    const now = Date.now();
    const updated = await transitionAsset(ctx, asset, "Ready", {
      readyAt: now,
      approvedManifestFingerprint: manifest.fingerprint,
    });
    await addEvent(ctx, {
      ...session,
      assetId: asset.assetId,
      eventType: "asset.approved",
      correlationId: args.correlationId,
      metadata: { manifestId: manifest.manifestId, fingerprint: manifest.fingerprint },
    });
    return {
      decisionId,
      lifecycle: updated.lifecycle,
      assetVersion: updated.version,
      replayed: false,
    };
  },
});

export const archive = mutation({
  args: {
    boundaryKey: v.string(),
    sessionTokenHash: v.string(),
    assetId: v.string(),
    expectedAssetVersion: v.number(),
    correlationId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await enforceAuth(ctx, args.sessionTokenHash, args.boundaryKey);
    const asset = await findAsset(ctx, session.organizationId, args.assetId);
    if (!asset) throw new Error("ASSET_NOT_FOUND");
    if (!(["Draft", "Review", "Ready"] as const).includes(asset.lifecycle as never)) {
      throw new Error("LIFECYCLE_CONFLICT");
    }
    if (asset.version !== args.expectedAssetVersion) throw new Error("ASSET_VERSION_CONFLICT");
    const updated = await transitionAsset(ctx, asset, "Archived");
    await addEvent(ctx, {
      ...session,
      assetId: asset.assetId,
      eventType: "asset.archived",
      correlationId: args.correlationId,
      metadata: { priorLifecycle: asset.lifecycle },
    });
    return { lifecycle: updated.lifecycle, assetVersion: updated.version };
  },
});

export const readyQueue = query({
  args: {
    boundaryKey: v.string(),
    sessionTokenHash: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const session = await enforceAuth(ctx, args.sessionTokenHash, args.boundaryKey);
    if (
      !Number.isInteger(args.paginationOpts.numItems) ||
      args.paginationOpts.numItems < 1 ||
      args.paginationOpts.numItems > 100
    ) {
      throw new Error("INVALID_LIMIT");
    }
    const result = await ctx.db
      .query("assets")
      .withIndex("by_organizationId_lifecycle_readyAt", (q) =>
        q.eq("organizationId", session.organizationId).eq("lifecycle", "Ready"),
      )
      .order("asc")
      .paginate(args.paginationOpts);
    const items = await Promise.all(
      result.page.map(async (asset) => {
        const profile = await findProfile(ctx, session.organizationId, asset.assetId);
        if (!profile) throw new Error("READY_PROFILE_MISSING");
        return {
          assetId: asset.assetId,
          name: asset.name,
          category: asset.category,
          estimatedValue: asset.estimatedValue,
          currency: asset.currency,
          countryCode: asset.countryCode,
          lifecycle: asset.lifecycle,
          assetVersion: asset.version,
          readyAt: asset.readyAt,
          profile: publicProfile(profile),
        };
      }),
    );
    return {
      items,
      nextCursor: result.isDone ? null : result.continueCursor,
    };
  },
});
