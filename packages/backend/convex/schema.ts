import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  organizations: defineTable({
    name: v.string(),
    optionalEmail: v.optional(v.string()),
    createdAt: v.number(),
  }),
  users: defineTable({
    walletAddress: v.string(),
    organizationId: v.id("organizations"),
    email: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_walletAddress", ["walletAddress"]),
  sessions: defineTable({
    tokenHash: v.string(),
    userId: v.id("users"),
    organizationId: v.id("organizations"),
    expiresAt: v.number(),
    createdAt: v.number(),
  }).index("by_tokenHash", ["tokenHash"]),
  challenges: defineTable({
    walletAddress: v.string(),
    challengeXdr: v.string(),
    expiresAt: v.number(),
    consumed: v.boolean(),
  }).index("by_walletAddress", ["walletAddress"]),
  onboardingGrants: defineTable({
    tokenHash: v.string(),
    walletAddress: v.string(),
    expiresAt: v.number(),
    consumed: v.boolean(),
  }).index("by_tokenHash", ["tokenHash"]),
  activityEvents: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    eventType: v.string(),
    timestamp: v.number(),
    outcome: v.string(),
    correlationId: v.string(),
    metadata: v.string(),
  }).index("by_organizationId", ["organizationId"]),
  tasks: defineTable({
    organizationId: v.id("organizations"),
    todo: v.string(),
    completed: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_completed", ["completed"]),
});
