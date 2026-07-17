import { v } from "convex/values";

import { sha256Hex, validateDocumentBytes } from "../src/domain/tokenization.js";
import { internal } from "./_generated/api.js";
import { action } from "./_generated/server.js";

export const finalize = action({
  args: {
    boundaryKey: v.string(),
    sessionTokenHash: v.string(),
    intentId: v.string(),
    storageId: v.id("_storage"),
    filename: v.string(),
    correlationId: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    document: {
      documentId: string;
      assetId: string;
      filename: string;
      mediaType: string;
      byteSize: number;
      version: number;
      state: string;
      createdAt: number;
    };
    assetVersion: number;
    replayed: boolean;
  }> => {
    const preflight: { consumed: boolean } = await ctx.runQuery(
      internal.documents.preflightFinalize,
      {
        boundaryKey: args.boundaryKey,
        sessionTokenHash: args.sessionTokenHash,
        intentId: args.intentId,
      },
    );
    if (preflight.consumed) {
      const replay = await ctx.runMutation(internal.documents.commitFinalize, {
        ...args,
        mediaType: "application/octet-stream",
        byteSize: 0,
        sha256: "",
      });
      return { document: replay.document, assetVersion: replay.assetVersion, replayed: true };
    }
    const blob = await ctx.storage.get(args.storageId);
    if (!blob) throw new Error("STORAGE_OBJECT_NOT_FOUND");
    let linked = false;
    try {
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const validated = validateDocumentBytes({ bytes, filename: args.filename });
      const sha256 = await sha256Hex(bytes);
      const committed = await ctx.runMutation(internal.documents.commitFinalize, {
        ...args,
        ...validated,
        sha256,
      });
      linked = true;
      if (committed.cleanupStorageId) {
        await ctx.storage.delete(committed.cleanupStorageId).catch(() => undefined);
      }
      return {
        document: committed.document,
        assetVersion: committed.assetVersion,
        replayed: committed.replayed,
      };
    } catch (error) {
      if (!linked) await ctx.storage.delete(args.storageId).catch(() => undefined);
      throw error;
    }
  },
});
