import { v } from "convex/values";

import { api } from "./_generated/api.js";
import { internalMutation } from "./_generated/server.js";

export const createThenFail = internalMutation({
  args: {
    boundaryKey: v.string(),
    sessionTokenHash: v.string(),
    createRequestId: v.string(),
    correlationId: v.string(),
    input: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(api.assets.create, args);
    throw new Error("INJECTED_POST_CREATE_FAILURE");
  },
});

export const updateThenFail = internalMutation({
  args: {
    boundaryKey: v.string(),
    sessionTokenHash: v.string(),
    assetId: v.string(),
    correlationId: v.string(),
    input: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(api.assets.update, args);
    throw new Error("INJECTED_POST_UPDATE_FAILURE");
  },
});
