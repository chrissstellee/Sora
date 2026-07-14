import { v } from "convex/values";

import { query } from "./_generated/server.js";
import { enforceAuth } from "./helpers.js";

export const list = query({
  args: {
    boundaryKey: v.string(),
    sessionTokenHash: v.string(),
    assetId: v.optional(v.string()),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const session = await enforceAuth(ctx, args.sessionTokenHash, args.boundaryKey);
    const events = args.assetId
      ? await ctx.db
          .query("activityEvents")
          .withIndex("by_organizationId_assetId_timestamp", (q) =>
            q.eq("organizationId", session.organizationId).eq("assetId", args.assetId),
          )
          .collect()
      : await ctx.db
          .query("activityEvents")
          .withIndex("by_organizationId_timestamp", (q) =>
            q.eq("organizationId", session.organizationId),
          )
          .collect();
    return events
      .sort((a, b) => b.timestamp - a.timestamp || (a.eventId ?? "").localeCompare(b.eventId ?? ""))
      .slice(0, Math.max(1, Math.min(100, Math.trunc(args.limit))))
      .map(
        ({
          _id: _internalId,
          _creationTime: _internalCreationTime,
          organizationId: _organizationId,
          userId: _userId,
          ...event
        }) => event,
      );
  },
});
