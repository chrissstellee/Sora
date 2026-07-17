import { StrKey } from "@stellar/stellar-sdk";
import { v } from "convex/values";

import { internal } from "./_generated/api.js";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server.js";
import { recordActivity } from "./activityWriter.js";
import { assetLifecycleCounts } from "./assetAggregates.js";
import { activeRunForOrganization } from "./demo.js";
import { enforceAuth } from "./helpers.js";

import type { DataModel, Id } from "./_generated/dataModel.js";
import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";

const LEASE_MS = 30_000;

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

function publicAccounts() {
  const processEnvironment = (
    globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }
  ).process?.env;
  const issuerAccount = processEnvironment?.STELLAR_TESTNET_ISSUER_PUBLIC_KEY;
  const distributorAccount = processEnvironment?.STELLAR_TESTNET_DISTRIBUTOR_PUBLIC_KEY;
  if (
    !issuerAccount ||
    !distributorAccount ||
    !StrKey.isValidEd25519PublicKey(issuerAccount) ||
    !StrKey.isValidEd25519PublicKey(distributorAccount) ||
    issuerAccount === distributorAccount
  ) {
    throw new Error("ISSUANCE_PUBLIC_ACCOUNTS_INVALID");
  }
  return { issuerAccount, distributorAccount };
}

async function safeSnapshot(
  ctx: GenericQueryCtx<DataModel>,
  issuance: DataModel["issuances"]["document"],
) {
  const [attempts, evidence, asset] = await Promise.all([
    ctx.db
      .query("transactionAttempts")
      .withIndex("by_issuanceId_purpose_attemptNumber", (q) =>
        q.eq("issuanceId", issuance.issuanceId),
      )
      .take(20),
    ctx.db
      .query("reconciliationEvidence")
      .withIndex("by_issuanceId_purpose_checkedAt", (q) => q.eq("issuanceId", issuance.issuanceId))
      .order("desc")
      .take(20),
    findAsset(ctx, issuance.organizationId, issuance.assetId),
  ]);
  return {
    issuanceId: issuance.issuanceId,
    assetId: issuance.assetId,
    assetName: asset?.name ?? "Unavailable asset",
    category: asset?.category ?? "Unknown",
    estimatedValue: asset?.estimatedValue ?? "0.00",
    currency: asset?.currency ?? "USD",
    countryCode: asset?.countryCode ?? "",
    network: issuance.network,
    status: issuance.status,
    assetVersion: issuance.assetVersion,
    manifestId: issuance.manifestId,
    manifestFingerprint: issuance.manifestFingerprint,
    profileId: issuance.profileId,
    profileVersion: issuance.profileVersion,
    assetCode: issuance.assetCode,
    supply: issuance.supply,
    internalReference: issuance.internalReference,
    issuerAccount: issuance.issuerAccount,
    distributorAccount: issuance.distributorAccount,
    trustlineState: issuance.trustlineState,
    paymentState: issuance.paymentState,
    trustlineProof:
      issuance.trustlineProofType === undefined
        ? null
        : {
            type: issuance.trustlineProofType,
            hash: issuance.trustlineHash,
            ledger: issuance.trustlineLedger,
            checkedAt: issuance.trustlineCheckedAt,
            limit: issuance.trustlineLimit,
          },
    paymentProof:
      issuance.paymentHash === undefined
        ? null
        : {
            hash: issuance.paymentHash,
            ledger: issuance.paymentLedger,
            ledgerCloseTime: issuance.paymentLedgerCloseTime,
            amount: issuance.supply,
          },
    safeErrorCode: issuance.safeErrorCode,
    createdAt: issuance.createdAt,
    updatedAt: issuance.updatedAt,
    confirmedAt: issuance.confirmedAt,
    attempts: attempts.map((attempt) => ({
      purpose: attempt.purpose,
      attemptNumber: attempt.attemptNumber,
      state: attempt.state,
      sourceAccount: attempt.sourceAccount,
      sequence: attempt.sequence,
      minTime: attempt.minTime,
      maxTime: attempt.maxTime,
      hash: attempt.hash,
      submittedAt: attempt.submittedAt,
      confirmedAt: attempt.confirmedAt,
      ledger: attempt.ledger,
      ledgerCloseTime: attempt.ledgerCloseTime,
    })),
    reconciliation: evidence.map((item) => ({
      purpose: item.purpose,
      attemptNumber: item.attemptNumber,
      checkedAt: item.checkedAt,
      hashResult: item.hashResult,
      outcome: item.outcome,
      correlationId: item.correlationId,
    })),
  };
}

export const request = mutation({
  args: {
    boundaryKey: v.string(),
    sessionTokenHash: v.string(),
    assetId: v.string(),
    expectedAssetVersion: v.number(),
    correlationId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await enforceAuth(ctx, args.sessionTokenHash, args.boundaryKey);
    const asset = await findAsset(ctx, session.organizationId, args.assetId);
    if (!asset) throw new Error("ASSET_NOT_FOUND");
    const existing = await ctx.db
      .query("issuances")
      .withIndex("by_organizationId_assetId_network", (q) =>
        q
          .eq("organizationId", session.organizationId)
          .eq("assetId", asset.assetId)
          .eq("network", "Testnet"),
      )
      .unique();
    if (existing) return { issuanceId: existing.issuanceId, claimed: false };
    const demoRun = await activeRunForOrganization(ctx, session.organizationId);
    if (asset.runId !== undefined) {
      if (!demoRun || demoRun.runId !== asset.runId || demoRun.status !== "Active") {
        throw new Error("DEMO_RUN_NOT_ACTIVE");
      }
    } else if (demoRun) {
      throw new Error("DEMO_RUN_ASSET_MISMATCH");
    }
    if (asset.lifecycle !== "Ready") throw new Error("ASSET_NOT_READY_FOR_ISSUANCE");
    if (asset.version !== args.expectedAssetVersion) throw new Error("ASSET_VERSION_CONFLICT");
    if (!asset.reviewManifestId || !asset.approvedManifestFingerprint) {
      throw new Error("APPROVED_MANIFEST_MISSING");
    }
    const [manifest, profile] = await Promise.all([
      ctx.db.get(asset.reviewManifestId),
      ctx.db
        .query("tokenizationProfiles")
        .withIndex("by_organizationId_assetId", (q) =>
          q.eq("organizationId", session.organizationId).eq("assetId", asset.assetId),
        )
        .unique(),
    ]);
    if (!manifest || !profile || manifest.fingerprint !== asset.approvedManifestFingerprint) {
      throw new Error("APPROVED_MANIFEST_MISSING");
    }
    if (demoRun && profile.assetCode !== demoRun.assetCode) {
      throw new Error("DEMO_ASSET_CODE_MISMATCH");
    }
    const accounts = publicAccounts();
    const reserved = await ctx.db
      .query("managedAssetIdentities")
      .withIndex("by_network_assetCode_issuerAccount", (q) =>
        q
          .eq("network", "Testnet")
          .eq("assetCode", profile.assetCode)
          .eq("issuerAccount", accounts.issuerAccount),
      )
      .unique();
    if (reserved) throw new Error("MANAGED_ASSET_IDENTITY_CONFLICT");
    const now = Date.now();
    const issuanceId = crypto.randomUUID();
    await ctx.db.insert("issuances", {
      issuanceId,
      organizationId: session.organizationId,
      assetId: asset.assetId,
      network: "Testnet",
      status: "Pending",
      assetVersion: asset.version,
      manifestId: manifest.manifestId,
      manifestFingerprint: manifest.fingerprint,
      profileId: profile.profileId,
      profileVersion: profile.version,
      assetCode: profile.assetCode,
      supplyUnits: profile.supplyUnits,
      supply: profile.supply,
      internalReference: profile.internalReference,
      ...accounts,
      trustlineState: "Pending",
      paymentState: "Pending",
      createdBy: session.userId,
      createdAt: now,
      updatedAt: now,
      runId: demoRun?.runId,
    });
    await ctx.db.insert("managedAssetIdentities", {
      network: "Testnet",
      assetCode: profile.assetCode,
      issuerAccount: accounts.issuerAccount,
      organizationId: session.organizationId,
      assetId: asset.assetId,
      issuanceId,
      reservedAt: now,
    });
    const updatedAsset = {
      ...asset,
      lifecycle: "Issuing",
      version: asset.version + 1,
      updatedAt: now,
    };
    await ctx.db.patch(asset._id, {
      lifecycle: updatedAsset.lifecycle,
      version: updatedAsset.version,
      updatedAt: now,
    });
    await assetLifecycleCounts.replace(ctx, asset, updatedAsset);
    await recordActivity(ctx, {
      organizationId: session.organizationId,
      userId: session.userId,
      actorKind: "user",
      eventType: "issuance.requested",
      outcome: "success",
      correlationId: args.correlationId,
      eventId: `issuance.requested:${issuanceId}`,
      assetId: asset.assetId,
      runId: demoRun?.runId,
      subjectId: issuanceId,
      metadata: { network: "Testnet", assetCode: profile.assetCode },
      timestamp: now,
    });
    await ctx.scheduler.runAfter(0, internal.issuanceWorker.process, { issuanceId });
    return { issuanceId, claimed: true };
  },
});

export const get = query({
  args: { boundaryKey: v.string(), sessionTokenHash: v.string(), issuanceId: v.string() },
  handler: async (ctx, args) => {
    const session = await enforceAuth(ctx, args.sessionTokenHash, args.boundaryKey);
    const issuance = await ctx.db
      .query("issuances")
      .withIndex("by_organizationId_issuanceId", (q) =>
        q.eq("organizationId", session.organizationId).eq("issuanceId", args.issuanceId),
      )
      .unique();
    if (!issuance) throw new Error("ISSUANCE_NOT_FOUND");
    return await safeSnapshot(ctx, issuance);
  },
});

export const configuration = query({
  args: { boundaryKey: v.string(), sessionTokenHash: v.string() },
  handler: async (ctx, args) => {
    await enforceAuth(ctx, args.sessionTokenHash, args.boundaryKey);
    return { network: "Testnet" as const, ...publicAccounts() };
  },
});

export const list = query({
  args: { boundaryKey: v.string(), sessionTokenHash: v.string() },
  handler: async (ctx, args) => {
    const session = await enforceAuth(ctx, args.sessionTokenHash, args.boundaryKey);
    const issuances = await ctx.db
      .query("issuances")
      .withIndex("by_organizationId_updatedAt", (q) =>
        q.eq("organizationId", session.organizationId),
      )
      .order("desc")
      .take(25);
    return await Promise.all(issuances.map((issuance) => safeSnapshot(ctx, issuance)));
  },
});

export const resume = mutation({
  args: {
    boundaryKey: v.string(),
    sessionTokenHash: v.string(),
    issuanceId: v.string(),
    correlationId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await enforceAuth(ctx, args.sessionTokenHash, args.boundaryKey);
    const issuance = await ctx.db
      .query("issuances")
      .withIndex("by_organizationId_issuanceId", (q) =>
        q.eq("organizationId", session.organizationId).eq("issuanceId", args.issuanceId),
      )
      .unique();
    if (!issuance) throw new Error("ISSUANCE_NOT_FOUND");
    const attempts = await ctx.db
      .query("transactionAttempts")
      .withIndex("by_issuanceId_purpose_attemptNumber", (q) =>
        q.eq("issuanceId", issuance.issuanceId),
      )
      .take(20);
    if (!attempts.some((attempt) => attempt.state === "SafeToRetry")) {
      throw new Error("ISSUANCE_NOT_SAFE_TO_RESUME");
    }
    await recordActivity(ctx, {
      organizationId: session.organizationId,
      userId: session.userId,
      actorKind: "user",
      eventType: "issuance.resumed",
      outcome: "success",
      correlationId: args.correlationId,
      eventId: args.correlationId,
      assetId: issuance.assetId,
      subjectId: issuance.issuanceId,
      metadata: { safeState: "SafeToRetry" },
    });
    await ctx.scheduler.runAfter(0, internal.issuanceWorker.process, {
      issuanceId: issuance.issuanceId,
    });
    return { issuanceId: issuance.issuanceId, resumed: true };
  },
});

export const workerSnapshot = internalQuery({
  args: { issuanceId: v.string() },
  handler: async (ctx, args) => {
    const issuance = await ctx.db
      .query("issuances")
      .withIndex("by_issuanceId", (q) => q.eq("issuanceId", args.issuanceId))
      .unique();
    if (!issuance) throw new Error("ISSUANCE_NOT_FOUND");
    const attempts = await ctx.db
      .query("transactionAttempts")
      .withIndex("by_issuanceId_purpose_attemptNumber", (q) =>
        q.eq("issuanceId", issuance.issuanceId),
      )
      .take(20);
    return { issuance, attempts };
  },
});

export const acquireLock = internalMutation({
  args: { sourceAccount: v.string(), holderId: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const lock = await ctx.db
      .query("accountLocks")
      .withIndex("by_network_sourceAccount", (q) =>
        q.eq("network", "Testnet").eq("sourceAccount", args.sourceAccount),
      )
      .unique();
    if (lock && lock.leaseExpiresAt > now && lock.holderId !== args.holderId) return null;
    const fencingToken = (lock?.fencingToken ?? 0n) + 1n;
    if (lock) {
      await ctx.db.patch(lock._id, {
        holderId: args.holderId,
        fencingToken,
        leaseExpiresAt: now + LEASE_MS,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("accountLocks", {
        network: "Testnet",
        sourceAccount: args.sourceAccount,
        holderId: args.holderId,
        fencingToken,
        leaseExpiresAt: now + LEASE_MS,
        updatedAt: now,
      });
    }
    return { fencingToken, leaseExpiresAt: now + LEASE_MS };
  },
});

export const prepareAttempt = internalMutation({
  args: {
    issuanceId: v.string(),
    purpose: v.union(v.literal("trustline"), v.literal("issuance-payment")),
    attemptNumber: v.number(),
    sourceAccount: v.string(),
    sequence: v.string(),
    baseFee: v.string(),
    minTime: v.number(),
    maxTime: v.number(),
    hash: v.string(),
    fencingToken: v.int64(),
  },
  handler: async (ctx, args) => {
    const issuance = await ctx.db
      .query("issuances")
      .withIndex("by_issuanceId", (q) => q.eq("issuanceId", args.issuanceId))
      .unique();
    if (!issuance) throw new Error("ISSUANCE_NOT_FOUND");
    const lock = await ctx.db
      .query("accountLocks")
      .withIndex("by_network_sourceAccount", (q) =>
        q.eq("network", "Testnet").eq("sourceAccount", args.sourceAccount),
      )
      .unique();
    if (!lock || lock.fencingToken !== args.fencingToken || lock.leaseExpiresAt <= Date.now()) {
      throw new Error("STALE_FENCING_TOKEN");
    }
    const existing = await ctx.db
      .query("transactionAttempts")
      .withIndex("by_issuanceId_purpose_attemptNumber", (q) =>
        q
          .eq("issuanceId", args.issuanceId)
          .eq("purpose", args.purpose)
          .eq("attemptNumber", args.attemptNumber),
      )
      .unique();
    if (existing) {
      if (existing.hash !== args.hash) throw new Error("ATTEMPT_IDENTITY_CONFLICT");
      return existing;
    }
    const sequenceConflict = await ctx.db
      .query("transactionAttempts")
      .withIndex("by_network_sourceAccount_sequence", (q) =>
        q
          .eq("network", "Testnet")
          .eq("sourceAccount", args.sourceAccount)
          .eq("sequence", args.sequence),
      )
      .unique();
    if (sequenceConflict) throw new Error("SOURCE_SEQUENCE_CONFLICT");
    const id = await ctx.db.insert("transactionAttempts", {
      issuanceId: issuance.issuanceId,
      organizationId: issuance.organizationId,
      purpose: args.purpose,
      attemptNumber: args.attemptNumber,
      state: "Prepared",
      network: "Testnet",
      sourceAccount: args.sourceAccount,
      sequence: args.sequence,
      baseFee: args.baseFee,
      minTime: args.minTime,
      maxTime: args.maxTime,
      assetCode: issuance.assetCode,
      issuerAccount: issuance.issuerAccount,
      distributorAccount: issuance.distributorAccount,
      amount: issuance.supply,
      hash: args.hash,
      fencingToken: args.fencingToken,
      retryCount: 0,
      createdAt: Date.now(),
    });
    await ctx.scheduler.runAfter(15_000, internal.issuanceWorker.process, {
      issuanceId: issuance.issuanceId,
    });
    await ctx.db.patch(issuance._id, {
      ...(args.purpose === "trustline"
        ? { trustlineState: "Prepared" }
        : { paymentState: "Prepared" }),
      updatedAt: Date.now(),
    });
    return (await ctx.db.get(id))!;
  },
});

export const scheduleRetry = internalMutation({
  args: { hash: v.string(), fencingToken: v.int64() },
  handler: async (ctx, args) => {
    const attempt = await ctx.db
      .query("transactionAttempts")
      .withIndex("by_hash", (q) => q.eq("hash", args.hash))
      .unique();
    if (!attempt || attempt.fencingToken !== args.fencingToken) {
      throw new Error("STALE_FENCING_TOKEN");
    }
    if (
      attempt.state === "Confirmed" ||
      attempt.state === "NeedsReview" ||
      attempt.state === "SafeToRetry"
    ) {
      return null;
    }
    const retryCount = attempt.retryCount + 1;
    const delays = [15, 30, 60, 120, 300] as const;
    const delaySeconds = delays[Math.min(retryCount - 1, delays.length - 1)]!;
    await ctx.db.patch(attempt._id, { retryCount });
    await ctx.scheduler.runAfter(delaySeconds * 1_000, internal.issuanceWorker.process, {
      issuanceId: attempt.issuanceId,
    });
    return { retryCount, delaySeconds };
  },
});

export const markSubmitted = internalMutation({
  args: { hash: v.string(), fencingToken: v.int64() },
  handler: async (ctx, args) => {
    const attempt = await ctx.db
      .query("transactionAttempts")
      .withIndex("by_hash", (q) => q.eq("hash", args.hash))
      .unique();
    if (!attempt) throw new Error("ATTEMPT_NOT_FOUND");
    if (attempt.fencingToken !== args.fencingToken) throw new Error("STALE_FENCING_TOKEN");
    if (attempt.state === "Confirmed") return attempt;
    const firstSubmission = attempt.state !== "Submitted";
    const issuance = await ctx.db
      .query("issuances")
      .withIndex("by_issuanceId", (q) => q.eq("issuanceId", attempt.issuanceId))
      .unique();
    if (!issuance) throw new Error("ISSUANCE_NOT_FOUND");
    const now = Date.now();
    await ctx.db.patch(attempt._id, {
      state: "Submitted",
      submittedAt: attempt.submittedAt ?? now,
    });
    await ctx.db.patch(issuance._id, {
      status: "Submitted",
      ...(attempt.purpose === "trustline"
        ? { trustlineState: "Submitted" }
        : { paymentState: "Submitted" }),
      updatedAt: now,
    });
    if (firstSubmission) {
      await recordActivity(ctx, {
        organizationId: issuance.organizationId,
        actorKind: "system",
        eventType: "issuance.submitted",
        subjectId: issuance.issuanceId,
        outcome: "pending",
        correlationId: `submission:${attempt.hash}`,
        eventId: `issuance.submitted:${attempt.hash}`,
        assetId: issuance.assetId,
        metadata: {
          network: "Testnet",
          transactionHash: attempt.hash,
          assetCode: issuance.assetCode,
          issuerAccount: issuance.issuerAccount,
        },
        proof: { type: "transaction", id: attempt.hash },
        timestamp: now,
      });
    }
    return { ...attempt, state: "Submitted" as const, submittedAt: attempt.submittedAt ?? now };
  },
});

export const authorizeSubmission = internalQuery({
  args: { hash: v.string(), fencingToken: v.int64() },
  handler: async (ctx, args) => {
    const attempt = await ctx.db
      .query("transactionAttempts")
      .withIndex("by_hash", (q) => q.eq("hash", args.hash))
      .unique();
    if (
      !attempt ||
      attempt.fencingToken !== args.fencingToken ||
      attempt.state === "Confirmed" ||
      attempt.state === "NeedsReview"
    ) {
      throw new Error("STALE_FENCING_TOKEN");
    }
    const lock = await ctx.db
      .query("accountLocks")
      .withIndex("by_network_sourceAccount", (q) =>
        q.eq("network", "Testnet").eq("sourceAccount", attempt.sourceAccount),
      )
      .unique();
    if (!lock || lock.fencingToken !== args.fencingToken || lock.leaseExpiresAt <= Date.now()) {
      throw new Error("STALE_FENCING_TOKEN");
    }
    return true;
  },
});

export const adoptAttemptFence = internalMutation({
  args: { hash: v.string(), fencingToken: v.int64() },
  handler: async (ctx, args) => {
    const attempt = await ctx.db
      .query("transactionAttempts")
      .withIndex("by_hash", (q) => q.eq("hash", args.hash))
      .unique();
    if (!attempt) throw new Error("ATTEMPT_NOT_FOUND");
    if (attempt.state === "Confirmed" || attempt.state === "NeedsReview") return attempt;
    const lock = await ctx.db
      .query("accountLocks")
      .withIndex("by_network_sourceAccount", (q) =>
        q.eq("network", "Testnet").eq("sourceAccount", attempt.sourceAccount),
      )
      .unique();
    if (!lock || lock.fencingToken !== args.fencingToken || lock.leaseExpiresAt <= Date.now()) {
      throw new Error("STALE_FENCING_TOKEN");
    }
    await ctx.db.patch(attempt._id, { fencingToken: args.fencingToken, state: "Reconciling" });
    return { ...attempt, fencingToken: args.fencingToken, state: "Reconciling" as const };
  },
});

export const recordReconciliation = internalMutation({
  args: {
    hash: v.string(),
    fencingToken: v.int64(),
    checkedAt: v.number(),
    hashResult: v.union(v.literal("Found"), v.literal("Missing"), v.literal("Unavailable")),
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
  },
  handler: async (ctx, args) => {
    const attempt = await ctx.db
      .query("transactionAttempts")
      .withIndex("by_hash", (q) => q.eq("hash", args.hash))
      .unique();
    if (!attempt) throw new Error("ATTEMPT_NOT_FOUND");
    if (attempt.fencingToken !== args.fencingToken) throw new Error("STALE_FENCING_TOKEN");
    await ctx.db.insert("reconciliationEvidence", {
      issuanceId: attempt.issuanceId,
      organizationId: attempt.organizationId,
      purpose: attempt.purpose,
      attemptNumber: attempt.attemptNumber,
      checkedAt: args.checkedAt,
      hashResult: args.hashResult,
      expectedSequence: attempt.sequence,
      observedSequence: args.observedSequence,
      latestClosedLedger: args.latestClosedLedger,
      latestClosedLedgerTime: args.latestClosedLedgerTime,
      outcome: args.outcome,
      correlationId: args.correlationId,
    });
    const state =
      args.outcome === "SafeToRetry"
        ? "SafeToRetry"
        : args.outcome === "NeedsReview"
          ? "NeedsReview"
          : args.outcome === "Confirmed"
            ? attempt.state
            : "Reconciling";
    if (state !== attempt.state) await ctx.db.patch(attempt._id, { state });
    const issuance = await ctx.db
      .query("issuances")
      .withIndex("by_issuanceId", (q) => q.eq("issuanceId", attempt.issuanceId))
      .unique();
    if (issuance) {
      const now = Date.now();
      await ctx.db.patch(issuance._id, {
        ...(attempt.purpose === "trustline" ? { trustlineState: state } : { paymentState: state }),
        updatedAt: now,
      });
      if (state === "Reconciling" && attempt.state !== "Reconciling") {
        await recordActivity(ctx, {
          organizationId: issuance.organizationId,
          actorKind: "system",
          eventType: "issuance.reconciling",
          subjectId: issuance.issuanceId,
          outcome: "pending",
          correlationId: args.correlationId,
          eventId: `issuance.reconciling:${attempt.hash}:${args.correlationId}`,
          assetId: issuance.assetId,
          runId: issuance.runId,
          metadata: { safeState: state, transactionHash: attempt.hash },
          proof: { type: "transaction", id: attempt.hash },
          timestamp: now,
        });
      }
    }
    return { state };
  },
});

export const confirmTrustline = internalMutation({
  args: {
    issuanceId: v.string(),
    hash: v.optional(v.string()),
    fencingToken: v.optional(v.int64()),
    proofType: v.union(v.literal("verified-existing"), v.literal("transaction")),
    ledger: v.optional(v.number()),
    checkedAt: v.number(),
    limit: v.string(),
  },
  handler: async (ctx, args) => {
    const issuance = await ctx.db
      .query("issuances")
      .withIndex("by_issuanceId", (q) => q.eq("issuanceId", args.issuanceId))
      .unique();
    if (!issuance) throw new Error("ISSUANCE_NOT_FOUND");
    if (issuance.trustlineState === "Confirmed") return { confirmed: true, replayed: true };
    if (args.hash) {
      const attempt = await ctx.db
        .query("transactionAttempts")
        .withIndex("by_hash", (q) => q.eq("hash", args.hash!))
        .unique();
      if (
        !attempt ||
        attempt.issuanceId !== issuance.issuanceId ||
        attempt.purpose !== "trustline"
      ) {
        throw new Error("ATTEMPT_NOT_FOUND");
      }
      if (args.fencingToken === undefined || attempt.fencingToken !== args.fencingToken) {
        throw new Error("STALE_FENCING_TOKEN");
      }
      await ctx.db.patch(attempt._id, {
        state: "Confirmed",
        confirmedAt: args.checkedAt,
        ledger: args.ledger,
      });
    }
    await ctx.db.patch(issuance._id, {
      trustlineState: "Confirmed",
      trustlineProofType: args.proofType,
      trustlineHash: args.hash,
      trustlineLedger: args.ledger,
      trustlineCheckedAt: args.checkedAt,
      trustlineLimit: args.limit,
      updatedAt: args.checkedAt,
    });
    await recordActivity(ctx, {
      organizationId: issuance.organizationId,
      actorKind: "system",
      eventType: "issuance.trustline_confirmed",
      outcome: "success",
      correlationId: `trustline:${issuance.issuanceId}`,
      eventId: `issuance.trustline_confirmed:${issuance.issuanceId}`,
      assetId: issuance.assetId,
      subjectId: issuance.issuanceId,
      metadata: {
        network: "Testnet",
        ...(args.hash ? { transactionHash: args.hash } : {}),
        ...(args.ledger ? { ledger: args.ledger } : {}),
        assetCode: issuance.assetCode,
        issuerAccount: issuance.issuerAccount,
      },
      proof: args.hash ? { type: "transaction", id: args.hash } : undefined,
      timestamp: args.checkedAt,
    });
    return { confirmed: true, replayed: false };
  },
});

export const confirmPayment = internalMutation({
  args: {
    hash: v.string(),
    fencingToken: v.int64(),
    ledger: v.number(),
    ledgerCloseTime: v.number(),
    confirmedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const attempt = await ctx.db
      .query("transactionAttempts")
      .withIndex("by_hash", (q) => q.eq("hash", args.hash))
      .unique();
    if (!attempt || attempt.purpose !== "issuance-payment") throw new Error("ATTEMPT_NOT_FOUND");
    if (attempt.fencingToken !== args.fencingToken) throw new Error("STALE_FENCING_TOKEN");
    const issuance = await ctx.db
      .query("issuances")
      .withIndex("by_issuanceId", (q) => q.eq("issuanceId", attempt.issuanceId))
      .unique();
    if (!issuance) throw new Error("ISSUANCE_NOT_FOUND");
    if (issuance.status === "Confirmed") return { confirmed: true, replayed: true };
    if (issuance.trustlineState !== "Confirmed") throw new Error("TRUSTLINE_NOT_CONFIRMED");
    const asset = await findAsset(ctx, issuance.organizationId, issuance.assetId);
    if (!asset || asset.lifecycle !== "Issuing") throw new Error("LIFECYCLE_CONFLICT");
    const updatedAsset = {
      ...asset,
      lifecycle: "Active",
      version: asset.version + 1,
      updatedAt: args.confirmedAt,
    };
    await ctx.db.patch(attempt._id, {
      state: "Confirmed",
      confirmedAt: args.confirmedAt,
      ledger: args.ledger,
      ledgerCloseTime: args.ledgerCloseTime,
    });
    await ctx.db.patch(issuance._id, {
      status: "Confirmed",
      paymentState: "Confirmed",
      paymentHash: args.hash,
      paymentLedger: args.ledger,
      paymentLedgerCloseTime: args.ledgerCloseTime,
      confirmedAt: args.confirmedAt,
      updatedAt: args.confirmedAt,
    });
    await ctx.db.patch(asset._id, {
      lifecycle: "Active",
      version: updatedAsset.version,
      updatedAt: args.confirmedAt,
    });
    await assetLifecycleCounts.replace(ctx, asset, updatedAsset);
    await recordActivity(ctx, {
      organizationId: issuance.organizationId,
      actorKind: "system",
      eventType: "issuance.confirmed",
      outcome: "success",
      correlationId: `payment:${issuance.issuanceId}`,
      eventId: `issuance.confirmed:${issuance.issuanceId}`,
      assetId: issuance.assetId,
      subjectId: issuance.issuanceId,
      metadata: {
        transactionHash: args.hash,
        ledger: args.ledger,
        network: "Testnet",
        amount: issuance.supply,
        assetCode: issuance.assetCode,
        issuerAccount: issuance.issuerAccount,
      },
      proof: { type: "transaction", id: args.hash },
      timestamp: args.confirmedAt,
    });
    await ctx.scheduler.runAfter(0, internal.ownership.enqueueConfirmed, {
      issuanceId: issuance.issuanceId,
    });
    return { confirmed: true, replayed: false };
  },
});

export const failPreflight = internalMutation({
  args: { issuanceId: v.string(), safeErrorCode: v.string() },
  handler: async (ctx, args) => {
    const issuance = await ctx.db
      .query("issuances")
      .withIndex("by_issuanceId", (q) => q.eq("issuanceId", args.issuanceId))
      .unique();
    if (!issuance || issuance.status === "Confirmed") return null;
    const asset = await findAsset(ctx, issuance.organizationId, issuance.assetId);
    const now = Date.now();
    await ctx.db.patch(issuance._id, {
      status: "Failed",
      safeErrorCode: args.safeErrorCode,
      updatedAt: now,
    });
    if (asset?.lifecycle === "Issuing") {
      const updated = { ...asset, lifecycle: "Failed", version: asset.version + 1, updatedAt: now };
      await ctx.db.patch(asset._id, {
        lifecycle: "Failed",
        version: updated.version,
        updatedAt: now,
      });
      await assetLifecycleCounts.replace(ctx, asset, updated);
    }
    await recordActivity(ctx, {
      organizationId: issuance.organizationId,
      actorKind: "system",
      eventType: "issuance.preflight_failed",
      subjectId: issuance.issuanceId,
      outcome: "failure",
      correlationId: `preflight:${issuance.issuanceId}`,
      eventId: `issuance.preflight_failed:${issuance.issuanceId}`,
      assetId: issuance.assetId,
      metadata: { safeErrorCode: args.safeErrorCode },
      timestamp: now,
    });
    return null;
  },
});
