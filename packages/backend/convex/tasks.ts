import { v } from "convex/values";

import { mutation, query } from "./_generated/server.js";
import { enforceAuth } from "./helpers.js";

export const list = query({
  args: { boundaryKey: v.string(), sessionTokenHash: v.string() },
  handler: async (ctx, args) => {
    const session = await enforceAuth(ctx, args.sessionTokenHash, args.boundaryKey);
    return await ctx.db
      .query("tasks")
      .withIndex("by_organizationId", (q) => q.eq("organizationId", session.organizationId))
      .collect();
  },
});

export const getByCompleted = query({
  args: { boundaryKey: v.string(), completed: v.boolean(), sessionTokenHash: v.string() },
  handler: async (ctx, args) => {
    const session = await enforceAuth(ctx, args.sessionTokenHash, args.boundaryKey);
    return await ctx.db
      .query("tasks")
      .withIndex("by_organizationId_completed", (q) =>
        q.eq("organizationId", session.organizationId).eq("completed", args.completed),
      )
      .collect();
  },
});

export const create = mutation({
  args: { boundaryKey: v.string(), todo: v.string(), sessionTokenHash: v.string() },
  handler: async (ctx, args) => {
    const session = await enforceAuth(ctx, args.sessionTokenHash, args.boundaryKey);
    const now = Date.now();
    return await ctx.db.insert("tasks", {
      organizationId: session.organizationId,
      todo: args.todo,
      completed: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const toggle = mutation({
  args: { boundaryKey: v.string(), id: v.id("tasks"), sessionTokenHash: v.string() },
  handler: async (ctx, args) => {
    const session = await enforceAuth(ctx, args.sessionTokenHash, args.boundaryKey);
    const task = await ctx.db.get(args.id);
    if (!task) throw new Error("Task not found");
    if (task.organizationId !== session.organizationId) {
      throw new Error("Unauthorized: Task does not belong to your organization");
    }

    await ctx.db.patch(args.id, {
      completed: !task.completed,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { boundaryKey: v.string(), id: v.id("tasks"), sessionTokenHash: v.string() },
  handler: async (ctx, args) => {
    const session = await enforceAuth(ctx, args.sessionTokenHash, args.boundaryKey);
    const task = await ctx.db.get(args.id);
    if (!task) throw new Error("Task not found");
    if (task.organizationId !== session.organizationId) {
      throw new Error("Unauthorized: Task does not belong to your organization");
    }

    await ctx.db.delete(args.id);
  },
});
