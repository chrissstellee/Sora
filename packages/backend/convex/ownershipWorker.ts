"use node";

import { v } from "convex/values";

import { collectHorizonOwnership } from "../src/stellar/ownership.js";
import { internal } from "./_generated/api.js";
import { internalAction } from "./_generated/server.js";

export const process = internalAction({
  args: { attemptId: v.string() },
  handler: async (ctx, args) => {
    const holderId = `ownership-worker:${args.attemptId}`;
    const begun = await ctx.runMutation(internal.ownership.beginAttempt, {
      attemptId: args.attemptId,
      holderId,
    });
    if (!begun) return;
    if (begun.busy) {
      await ctx.scheduler.runAfter(
        Math.max(1, begun.retryAfterMs),
        internal.ownershipWorker.process,
        args,
      );
      return;
    }
    try {
      const result = await collectHorizonOwnership({
        assetCode: begun.assetCode,
        issuerAccount: begun.issuerAccount,
        onPage: async (page) => {
          await ctx.runMutation(internal.ownership.stagePage, {
            attemptId: args.attemptId,
            fencingToken: begun.fencingToken,
            pageNumber: page.pageNumber,
            holders: page.holders,
          });
        },
      });
      if (result.observedUnits !== begun.confirmedUnits)
        throw new Error("OWNERSHIP_SUPPLY_MISMATCH");
      await ctx.runMutation(internal.ownership.completeAttempt, {
        attemptId: args.attemptId,
        fencingToken: begun.fencingToken,
        pageCount: result.pageCount,
        holderCount: result.holders.length,
        observedUnits: result.observedUnits,
        holdersHash: result.holdersHash,
        firstLedger: result.firstLedger,
        lastLedger: result.lastLedger,
      });
    } catch (error) {
      await ctx.runMutation(internal.ownership.failAttempt, {
        attemptId: args.attemptId,
        fencingToken: begun.fencingToken,
        safeErrorCode: error instanceof Error ? error.message : "OWNERSHIP_SYNC_FAILED",
      });
    }
  },
});
