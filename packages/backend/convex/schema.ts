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
    readyAt: v.optional(v.number()),
    reviewManifestId: v.optional(v.id("reviewManifests")),
    approvedManifestFingerprint: v.optional(v.string()),
  })
    .index("by_organizationId_assetId", ["organizationId", "assetId"])
    .index("by_organizationId_requestId", ["organizationId", "createRequestId"])
    .index("by_organizationId_registration", ["organizationId", "normalizedRegistrationNumber"])
    .index("by_organizationId_name", ["organizationId", "normalizedName", "assetId"])
    .index("by_organizationId_lifecycle", ["organizationId", "lifecycle"])
    .index("by_organizationId_lifecycle_readyAt", [
      "organizationId",
      "lifecycle",
      "readyAt",
      "assetId",
    ])
    .index("by_organizationId_updatedAt", ["organizationId", "updatedAt", "assetId"]),
  tokenizationProfiles: defineTable({
    profileId: v.string(),
    organizationId: v.id("organizations"),
    assetId: v.string(),
    assetCode: v.string(),
    supplyUnits: v.int64(),
    supply: v.string(),
    internalReference: v.string(),
    network: v.literal("Testnet"),
    version: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    updatedBy: v.id("users"),
  })
    .index("by_organizationId_assetId", ["organizationId", "assetId"])
    .index("by_organizationId_profileId", ["organizationId", "profileId"]),
  documentUploadIntents: defineTable({
    intentId: v.string(),
    organizationId: v.id("organizations"),
    assetId: v.string(),
    createdBy: v.id("users"),
    expectedAssetVersion: v.number(),
    replacesDocumentId: v.optional(v.string()),
    expectedDocumentVersion: v.optional(v.number()),
    state: v.union(v.literal("Pending"), v.literal("Consumed"), v.literal("Expired")),
    expiresAt: v.number(),
    createdAt: v.number(),
    consumedAt: v.optional(v.number()),
    storageId: v.optional(v.id("_storage")),
    finalizedDocumentId: v.optional(v.string()),
    finalizedDocumentVersion: v.optional(v.number()),
  })
    .index("by_organizationId_intentId", ["organizationId", "intentId"])
    .index("by_state_expiresAt", ["state", "expiresAt"]),
  supportingDocuments: defineTable({
    documentId: v.string(),
    organizationId: v.id("organizations"),
    assetId: v.string(),
    storageId: v.id("_storage"),
    filename: v.string(),
    mediaType: v.string(),
    byteSize: v.number(),
    sha256: v.string(),
    version: v.number(),
    state: v.union(v.literal("Active"), v.literal("Retired"), v.literal("CleanupPending")),
    createdAt: v.number(),
    createdBy: v.id("users"),
    retiredAt: v.optional(v.number()),
  })
    .index("by_organizationId_documentId", ["organizationId", "documentId", "version"])
    .index("by_organizationId_assetId_state", ["organizationId", "assetId", "state"])
    .index("by_storageId", ["storageId"])
    .index("by_state_createdAt", ["state", "createdAt"]),
  reviewManifests: defineTable({
    manifestId: v.string(),
    organizationId: v.id("organizations"),
    assetId: v.string(),
    assetVersion: v.number(),
    profileId: v.string(),
    profileVersion: v.number(),
    checklistVersion: v.number(),
    canonicalManifest: v.string(),
    fingerprint: v.string(),
    submittedBy: v.id("users"),
    submittedAt: v.number(),
  })
    .index("by_organizationId_manifestId", ["organizationId", "manifestId"])
    .index("by_organizationId_assetId", ["organizationId", "assetId"]),
  reviewManifestDocuments: defineTable({
    organizationId: v.id("organizations"),
    manifestId: v.string(),
    documentId: v.string(),
    version: v.number(),
    sha256: v.string(),
  })
    .index("by_organizationId_manifestId", ["organizationId", "manifestId"])
    .index("by_organizationId_documentId", ["organizationId", "documentId"]),
  reviewDecisions: defineTable({
    decisionId: v.string(),
    organizationId: v.id("organizations"),
    assetId: v.string(),
    manifestId: v.string(),
    decision: v.union(v.literal("Approved"), v.literal("Returned")),
    reason: v.optional(v.string()),
    actorId: v.id("users"),
    decidedAt: v.number(),
  })
    .index("by_organizationId_assetId", ["organizationId", "assetId", "decidedAt"])
    .index("by_organizationId_manifestId_decision", ["organizationId", "manifestId", "decision"]),
  issuances: defineTable({
    issuanceId: v.string(),
    organizationId: v.id("organizations"),
    assetId: v.string(),
    network: v.literal("Testnet"),
    status: v.union(
      v.literal("Pending"),
      v.literal("Submitted"),
      v.literal("Confirmed"),
      v.literal("Failed"),
    ),
    assetVersion: v.number(),
    manifestId: v.string(),
    manifestFingerprint: v.string(),
    profileId: v.string(),
    profileVersion: v.number(),
    assetCode: v.string(),
    supplyUnits: v.int64(),
    supply: v.string(),
    internalReference: v.string(),
    issuerAccount: v.string(),
    distributorAccount: v.string(),
    trustlineState: v.string(),
    paymentState: v.string(),
    trustlineProofType: v.optional(
      v.union(v.literal("verified-existing"), v.literal("transaction")),
    ),
    trustlineHash: v.optional(v.string()),
    trustlineLedger: v.optional(v.number()),
    trustlineCheckedAt: v.optional(v.number()),
    trustlineLimit: v.optional(v.string()),
    paymentHash: v.optional(v.string()),
    paymentLedger: v.optional(v.number()),
    paymentLedgerCloseTime: v.optional(v.number()),
    safeErrorCode: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    confirmedAt: v.optional(v.number()),
  })
    .index("by_issuanceId", ["issuanceId"])
    .index("by_organizationId_issuanceId", ["organizationId", "issuanceId"])
    .index("by_organizationId_updatedAt", ["organizationId", "updatedAt", "issuanceId"])
    .index("by_organizationId_assetId_network", ["organizationId", "assetId", "network"])
    .index("by_network_assetCode_issuerAccount", ["network", "assetCode", "issuerAccount"]),
  managedAssetIdentities: defineTable({
    network: v.literal("Testnet"),
    assetCode: v.string(),
    issuerAccount: v.string(),
    organizationId: v.id("organizations"),
    assetId: v.string(),
    issuanceId: v.string(),
    reservedAt: v.number(),
  }).index("by_network_assetCode_issuerAccount", ["network", "assetCode", "issuerAccount"]),
  transactionAttempts: defineTable({
    issuanceId: v.string(),
    organizationId: v.id("organizations"),
    purpose: v.union(v.literal("trustline"), v.literal("issuance-payment")),
    attemptNumber: v.number(),
    state: v.union(
      v.literal("Prepared"),
      v.literal("Submitted"),
      v.literal("Reconciling"),
      v.literal("Confirmed"),
      v.literal("SafeToRetry"),
      v.literal("NeedsReview"),
    ),
    network: v.literal("Testnet"),
    sourceAccount: v.string(),
    sequence: v.string(),
    baseFee: v.string(),
    minTime: v.number(),
    maxTime: v.number(),
    assetCode: v.string(),
    issuerAccount: v.string(),
    distributorAccount: v.string(),
    amount: v.string(),
    hash: v.string(),
    submittedAt: v.optional(v.number()),
    confirmedAt: v.optional(v.number()),
    ledger: v.optional(v.number()),
    ledgerCloseTime: v.optional(v.number()),
    fencingToken: v.int64(),
    retryCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_issuanceId_purpose_attemptNumber", ["issuanceId", "purpose", "attemptNumber"])
    .index("by_network_sourceAccount_sequence", ["network", "sourceAccount", "sequence"])
    .index("by_hash", ["hash"]),
  reconciliationEvidence: defineTable({
    issuanceId: v.string(),
    organizationId: v.id("organizations"),
    purpose: v.union(v.literal("trustline"), v.literal("issuance-payment")),
    attemptNumber: v.number(),
    checkedAt: v.number(),
    hashResult: v.union(v.literal("Found"), v.literal("Missing"), v.literal("Unavailable")),
    expectedSequence: v.string(),
    observedSequence: v.optional(v.string()),
    latestClosedLedger: v.optional(v.number()),
    latestClosedLedgerTime: v.optional(v.number()),
    outcome: v.union(
      v.literal("Confirmed"),
      v.literal("Failed"),
      v.literal("Unresolved"),
      v.literal("SafeToRetry"),
      v.literal("NeedsReview"),
    ),
    correlationId: v.string(),
  }).index("by_issuanceId_purpose_checkedAt", ["issuanceId", "purpose", "checkedAt"]),
  accountLocks: defineTable({
    network: v.literal("Testnet"),
    sourceAccount: v.string(),
    holderId: v.string(),
    fencingToken: v.int64(),
    leaseExpiresAt: v.number(),
    updatedAt: v.number(),
  }).index("by_network_sourceAccount", ["network", "sourceAccount"]),
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
