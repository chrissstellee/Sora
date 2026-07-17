import { v } from "convex/values";

import { canonicalActivityType } from "../src/domain/activity.js";
import { query } from "./_generated/server.js";
import { enforceAuth } from "./helpers.js";

export const list = query({
  args: {
    boundaryKey: v.string(),
    sessionTokenHash: v.string(),
    assetId: v.optional(v.string()),
    runId: v.optional(v.string()),
    cursor: v.optional(v.string()),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const session = await enforceAuth(ctx, args.sessionTokenHash, args.boundaryKey);
    const paginationOpts = {
      cursor: args.cursor ?? null,
      numItems: Math.max(1, Math.min(100, Math.trunc(args.limit))),
    };
    const page =
      args.runId && args.assetId
        ? await ctx.db
            .query("activityEvents")
            .withIndex("by_organizationId_runId_assetId_timestamp", (q) =>
              q
                .eq("organizationId", session.organizationId)
                .eq("runId", args.runId)
                .eq("assetId", args.assetId),
            )
            .order("desc")
            .paginate(paginationOpts)
        : args.runId
          ? await ctx.db
              .query("activityEvents")
              .withIndex("by_organizationId_runId_timestamp", (q) =>
                q.eq("organizationId", session.organizationId).eq("runId", args.runId),
              )
              .order("desc")
              .paginate(paginationOpts)
          : args.assetId
            ? await ctx.db
                .query("activityEvents")
                .withIndex("by_organizationId_assetId_timestamp", (q) =>
                  q.eq("organizationId", session.organizationId).eq("assetId", args.assetId),
                )
                .order("desc")
                .paginate(paginationOpts)
            : await ctx.db
                .query("activityEvents")
                .withIndex("by_organizationId_timestamp", (q) =>
                  q.eq("organizationId", session.organizationId),
                )
                .order("desc")
                .paginate(paginationOpts);

    return {
      items: page.page.map(
        ({
          _id,
          _creationTime: _internalCreationTime,
          organizationId: _organizationId,
          userId: _userId,
          metadata,
          eventType,
          ...event
        }) => ({
          id: _id,
          ...event,
          eventType: canonicalActivityType(eventType) ?? eventType,
          metadata: safeMetadata(metadata),
        }),
      ),
      nextCursor: page.isDone ? null : page.continueCursor,
    };
  },
});

function safeMetadata(value: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}
