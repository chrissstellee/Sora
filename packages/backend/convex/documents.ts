import { v } from "convex/values";

import { MAX_ACTIVE_DOCUMENTS } from "../src/domain/tokenization.js";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server.js";
import { recordActivity } from "./activityWriter.js";
import { enforceAuth } from "./helpers.js";

import type { DataModel, Id } from "./_generated/dataModel.js";
import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";

const INTENT_TTL_MS = 10 * 60 * 1000;

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

async function findActiveDocument(
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
  organizationId: Id<"organizations">,
  documentId: string,
) {
  const versions = await ctx.db
    .query("supportingDocuments")
    .withIndex("by_organizationId_documentId", (q) =>
      q.eq("organizationId", organizationId).eq("documentId", documentId),
    )
    .order("desc")
    .take(2);
  return versions.find((document) => document.state === "Active") ?? null;
}

function publicDocument(document: {
  documentId: string;
  assetId: string;
  filename: string;
  mediaType: string;
  byteSize: number;
  version: number;
  state: string;
  createdAt: number;
}) {
  return {
    documentId: document.documentId,
    assetId: document.assetId,
    filename: document.filename,
    mediaType: document.mediaType,
    byteSize: document.byteSize,
    version: document.version,
    state: document.state,
    createdAt: document.createdAt,
  };
}

export const createUploadIntent = mutation({
  args: {
    boundaryKey: v.string(),
    sessionTokenHash: v.string(),
    assetId: v.string(),
    expectedAssetVersion: v.number(),
    replacesDocumentId: v.optional(v.string()),
    expectedDocumentVersion: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await enforceAuth(ctx, args.sessionTokenHash, args.boundaryKey);
    const asset = await findAsset(ctx, session.organizationId, args.assetId);
    if (!asset) throw new Error("ASSET_NOT_FOUND");
    if (asset.lifecycle !== "Draft") throw new Error("ASSET_NOT_EDITABLE");
    if (asset.version !== args.expectedAssetVersion) throw new Error("ASSET_VERSION_CONFLICT");
    const active = await ctx.db
      .query("supportingDocuments")
      .withIndex("by_organizationId_assetId_state", (q) =>
        q
          .eq("organizationId", session.organizationId)
          .eq("assetId", asset.assetId)
          .eq("state", "Active"),
      )
      .take(MAX_ACTIVE_DOCUMENTS + 1);
    if (!args.replacesDocumentId && active.length >= MAX_ACTIVE_DOCUMENTS) {
      throw new Error("DOCUMENT_LIMIT_REACHED");
    }
    if (args.replacesDocumentId) {
      const replaced = await findActiveDocument(
        ctx,
        session.organizationId,
        args.replacesDocumentId,
      );
      if (!replaced || replaced.assetId !== asset.assetId) throw new Error("DOCUMENT_NOT_FOUND");
      if (replaced.version !== args.expectedDocumentVersion) {
        throw new Error("DOCUMENT_VERSION_CONFLICT");
      }
    } else if (args.expectedDocumentVersion !== undefined) {
      throw new Error("DOCUMENT_VERSION_CONFLICT");
    }
    const now = Date.now();
    const intentId = crypto.randomUUID();
    await ctx.db.insert("documentUploadIntents", {
      intentId,
      organizationId: session.organizationId,
      assetId: asset.assetId,
      createdBy: session.userId,
      expectedAssetVersion: args.expectedAssetVersion,
      replacesDocumentId: args.replacesDocumentId,
      expectedDocumentVersion: args.expectedDocumentVersion,
      state: "Pending",
      expiresAt: now + INTENT_TTL_MS,
      createdAt: now,
    });
    return {
      intentId,
      uploadUrl: await ctx.storage.generateUploadUrl(),
      expiresAt: now + INTENT_TTL_MS,
    };
  },
});

export const list = query({
  args: { boundaryKey: v.string(), sessionTokenHash: v.string(), assetId: v.string() },
  handler: async (ctx, args) => {
    const session = await enforceAuth(ctx, args.sessionTokenHash, args.boundaryKey);
    const asset = await findAsset(ctx, session.organizationId, args.assetId);
    if (!asset) throw new Error("ASSET_NOT_FOUND");
    const documents = await ctx.db
      .query("supportingDocuments")
      .withIndex("by_organizationId_assetId_state", (q) =>
        q
          .eq("organizationId", session.organizationId)
          .eq("assetId", asset.assetId)
          .eq("state", "Active"),
      )
      .take(MAX_ACTIVE_DOCUMENTS + 1);
    return documents.map(publicDocument);
  },
});

export const getDownload = query({
  args: { boundaryKey: v.string(), sessionTokenHash: v.string(), documentId: v.string() },
  handler: async (ctx, args) => {
    const session = await enforceAuth(ctx, args.sessionTokenHash, args.boundaryKey);
    const document = await findActiveDocument(ctx, session.organizationId, args.documentId);
    if (!document) throw new Error("DOCUMENT_NOT_FOUND");
    const url = await ctx.storage.getUrl(document.storageId);
    if (!url) throw new Error("DOCUMENT_NOT_FOUND");
    return {
      url,
      filename: document.filename,
      mediaType: document.mediaType,
      byteSize: document.byteSize,
    };
  },
});

export const remove = mutation({
  args: {
    boundaryKey: v.string(),
    sessionTokenHash: v.string(),
    assetId: v.string(),
    documentId: v.string(),
    expectedAssetVersion: v.number(),
    expectedDocumentVersion: v.number(),
    correlationId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await enforceAuth(ctx, args.sessionTokenHash, args.boundaryKey);
    const asset = await findAsset(ctx, session.organizationId, args.assetId);
    if (!asset) throw new Error("ASSET_NOT_FOUND");
    if (asset.lifecycle !== "Draft") throw new Error("ASSET_NOT_EDITABLE");
    const completed = await ctx.db
      .query("activityEvents")
      .withIndex("by_organizationId_assetId_timestamp", (q) =>
        q.eq("organizationId", session.organizationId).eq("assetId", asset.assetId),
      )
      .order("desc")
      .take(100);
    if (
      completed.some(
        (event) => event.eventId === args.correlationId && event.eventType === "document.deleted",
      )
    ) {
      return { deleted: true, replayed: true, assetVersion: asset.version };
    }
    if (asset.version !== args.expectedAssetVersion) throw new Error("ASSET_VERSION_CONFLICT");
    const document = await findActiveDocument(ctx, session.organizationId, args.documentId);
    if (!document || document.assetId !== asset.assetId) throw new Error("DOCUMENT_NOT_FOUND");
    if (document.version !== args.expectedDocumentVersion)
      throw new Error("DOCUMENT_VERSION_CONFLICT");
    const now = Date.now();
    await ctx.storage.delete(document.storageId);
    await ctx.db.patch(document._id, { state: "Retired", retiredAt: now });
    await ctx.db.patch(asset._id, { version: asset.version + 1, updatedAt: now });
    await recordActivity(ctx, {
      organizationId: session.organizationId,
      userId: session.userId,
      actorKind: "user",
      eventType: "document.deleted",
      subjectId: document.documentId,
      outcome: "success",
      correlationId: args.correlationId,
      eventId: args.correlationId,
      assetId: asset.assetId,
      runId: asset.runId,
      timestamp: now,
    });
    return { deleted: true, replayed: false, assetVersion: asset.version + 1 };
  },
});

export const preflightFinalize = internalQuery({
  args: {
    boundaryKey: v.string(),
    sessionTokenHash: v.string(),
    intentId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await enforceAuth(ctx, args.sessionTokenHash, args.boundaryKey);
    const intent = await ctx.db
      .query("documentUploadIntents")
      .withIndex("by_organizationId_intentId", (q) =>
        q.eq("organizationId", session.organizationId).eq("intentId", args.intentId),
      )
      .unique();
    if (!intent) throw new Error("UPLOAD_INTENT_NOT_FOUND");
    if (intent.state === "Consumed") return { consumed: true };
    if (intent.state !== "Pending" || intent.expiresAt <= Date.now())
      throw new Error("UPLOAD_INTENT_EXPIRED");
    return { consumed: false };
  },
});

export const commitFinalize = internalMutation({
  args: {
    boundaryKey: v.string(),
    sessionTokenHash: v.string(),
    intentId: v.string(),
    storageId: v.id("_storage"),
    filename: v.string(),
    mediaType: v.string(),
    byteSize: v.number(),
    sha256: v.string(),
    correlationId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await enforceAuth(ctx, args.sessionTokenHash, args.boundaryKey);
    const intent = await ctx.db
      .query("documentUploadIntents")
      .withIndex("by_organizationId_intentId", (q) =>
        q.eq("organizationId", session.organizationId).eq("intentId", args.intentId),
      )
      .unique();
    if (!intent) throw new Error("UPLOAD_INTENT_NOT_FOUND");
    if (intent.state === "Consumed") {
      if (
        intent.storageId !== args.storageId ||
        !intent.finalizedDocumentId ||
        !intent.finalizedDocumentVersion
      ) {
        throw new Error("UPLOAD_INTENT_REPLAYED");
      }
      const document = await findActiveDocument(
        ctx,
        session.organizationId,
        intent.finalizedDocumentId,
      );
      if (!document) throw new Error("DOCUMENT_NOT_FOUND");
      return {
        document: publicDocument(document),
        assetVersion: intent.expectedAssetVersion + 1,
        replayed: true,
        cleanupStorageId: null,
      };
    }
    if (intent.state !== "Pending" || intent.expiresAt <= Date.now())
      throw new Error("UPLOAD_INTENT_EXPIRED");
    const reusedStorage = await ctx.db
      .query("supportingDocuments")
      .withIndex("by_storageId", (q) => q.eq("storageId", args.storageId))
      .unique();
    if (reusedStorage) throw new Error("STORAGE_OBJECT_ALREADY_LINKED");
    const asset = await findAsset(ctx, session.organizationId, intent.assetId);
    if (!asset) throw new Error("ASSET_NOT_FOUND");
    if (asset.lifecycle !== "Draft") throw new Error("ASSET_NOT_EDITABLE");
    if (asset.version !== intent.expectedAssetVersion) throw new Error("ASSET_VERSION_CONFLICT");
    const active = await ctx.db
      .query("supportingDocuments")
      .withIndex("by_organizationId_assetId_state", (q) =>
        q
          .eq("organizationId", session.organizationId)
          .eq("assetId", asset.assetId)
          .eq("state", "Active"),
      )
      .take(MAX_ACTIVE_DOCUMENTS + 1);
    if (!intent.replacesDocumentId && active.length >= MAX_ACTIVE_DOCUMENTS) {
      throw new Error("DOCUMENT_LIMIT_REACHED");
    }
    let replaced = null;
    if (intent.replacesDocumentId) {
      replaced = await findActiveDocument(ctx, session.organizationId, intent.replacesDocumentId);
      if (!replaced || replaced.assetId !== asset.assetId) throw new Error("DOCUMENT_NOT_FOUND");
      if (replaced.version !== intent.expectedDocumentVersion)
        throw new Error("DOCUMENT_VERSION_CONFLICT");
    }
    const now = Date.now();
    const documentId = replaced?.documentId ?? crypto.randomUUID();
    const version = replaced ? replaced.version + 1 : 1;
    const inserted = await ctx.db.insert("supportingDocuments", {
      documentId,
      organizationId: session.organizationId,
      assetId: asset.assetId,
      storageId: args.storageId,
      filename: args.filename,
      mediaType: args.mediaType,
      byteSize: args.byteSize,
      sha256: args.sha256,
      version,
      state: "Active",
      createdAt: now,
      createdBy: session.userId,
    });
    if (replaced) await ctx.db.patch(replaced._id, { state: "Retired", retiredAt: now });
    await ctx.db.patch(intent._id, {
      state: "Consumed",
      consumedAt: now,
      storageId: args.storageId,
      finalizedDocumentId: documentId,
      finalizedDocumentVersion: version,
    });
    await ctx.db.patch(asset._id, { version: asset.version + 1, updatedAt: now });
    await recordActivity(ctx, {
      organizationId: session.organizationId,
      userId: session.userId,
      actorKind: "user",
      eventType: replaced ? "document.replaced" : "document.uploaded",
      subjectId: documentId,
      outcome: "success",
      correlationId: args.correlationId,
      eventId: args.correlationId,
      assetId: asset.assetId,
      runId: asset.runId,
      metadata: { mediaType: args.mediaType, byteSize: args.byteSize },
      timestamp: now,
    });
    const document = (await ctx.db.get(inserted))!;
    return {
      document: publicDocument(document),
      assetVersion: asset.version + 1,
      replayed: false,
      cleanupStorageId: replaced?.storageId ?? null,
    };
  },
});
