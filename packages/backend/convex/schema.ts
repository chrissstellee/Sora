import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  organizations: defineTable({
    name: v.string(),
    optionalEmail: v.optional(v.string()),
    disabledAt: v.optional(v.number()),
    createdAt: v.number(),
  }),
  users: defineTable({
    walletAddress: v.string(),
    organizationId: v.id("organizations"),
    email: v.optional(v.string()),
    disabledAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_walletAddress", ["walletAddress"]),
  sessions: defineTable({
    tokenHash: v.string(),
    userId: v.id("users"),
    organizationId: v.id("organizations"),
    expiresAt: v.number(),
    revokedAt: v.optional(v.number()),
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
    assetId: v.optional(v.string()),
    eventId: v.optional(v.string()),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_organizationId_timestamp", ["organizationId", "timestamp", "eventId"])
    .index("by_organizationId_assetId_timestamp", [
      "organizationId",
      "assetId",
      "timestamp",
      "eventId",
    ]),
  assets: defineTable({
    assetId: v.string(),
    organizationId: v.id("organizations"),
    createdBy: v.id("users"),
    name: v.string(),
    normalizedName: v.string(),
    category: v.string(),
    description: v.string(),
    estimatedValue: v.string(),
    currency: v.string(),
    countryCode: v.string(),
    legalOwner: v.string(),
    registrationNumber: v.string(),
    normalizedRegistrationNumber: v.string(),
    ownershipType: v.string(),
    contactEmail: v.string(),
    address: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    internalNotes: v.optional(v.string()),
    lifecycle: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    version: v.number(),
    createRequestId: v.string(),
    createFingerprint: v.string(),
  })
    .index("by_organizationId_assetId", ["organizationId", "assetId"])
    .index("by_organizationId_requestId", ["organizationId", "createRequestId"])
    .index("by_organizationId_registration", ["organizationId", "normalizedRegistrationNumber"])
    .index("by_organizationId_name", ["organizationId", "normalizedName", "assetId"])
    .index("by_organizationId_lifecycle", ["organizationId", "lifecycle"])
    .index("by_organizationId_updatedAt", ["organizationId", "updatedAt", "assetId"]),
  tasks: defineTable({
    organizationId: v.id("organizations"),
    todo: v.string(),
    completed: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_organizationId_completed", ["organizationId", "completed"]),
});
