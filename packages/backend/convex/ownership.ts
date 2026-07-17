import { v } from "convex/values";

import {
  canonicalHolderLine,
  normalizeAccountSearch,
  ownershipShare,
} from "../src/domain/ownership.js";
import { sha256Hex } from "../src/domain/tokenization.js";
import { internal } from "./_generated/api.js";
import { internalMutation, mutation, query } from "./_generated/server.js";
import { recordActivity } from "./activityWriter.js";
import { enforceAuth } from "./helpers.js";

import type { DataModel, Id } from "./_generated/dataModel.js";
import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";

const OWNERSHIP_LEASE_MS = 60_000;
const MANUAL_THROTTLE_MS = 15_000;
const STALE_AFTER_MS = 60_000;
const STAGING_EXPIRY_MS = 24 * 60 * 60 * 1_000;
const SNAPSHOT_RETENTION_MS = 30 * 24 * 60 * 60 * 1_000;
const SNAPSHOT_RETENTION_COUNT = 10;

const reasonValidator = v.union(
  v.literal("manual"),
  v.literal("visible-stale"),
  v.literal("focus-stale"),
);

const holderValidator = v.object({
  account: v.string(),
  balance: v.string(),
  balanceUnits: v.int64(),
  ledger: v.number(),
});

async function confirmedIssuance(
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
  organizationId: Id<"organizations">,
  assetId: string,
) {
  const issuance = await ctx.db
    .query("issuances")
    .withIndex("by_organizationId_assetId_network", (q) =>
      q.eq("organizationId", organizationId).eq("assetId", assetId).eq("network", "Testnet"),
    )
    .unique();
  if (!issuance || issuance.status !== "Confirmed") throw new Error("ASSET_NOT_FOUND");
  return issuance;
}

function pageLimit(value: number | undefined): number {
  if (value === undefined) return 50;
  if (!Number.isInteger(value) || value < 1 || value > 100) throw new Error("INVALID_PAGE_LIMIT");
  return value;
}

function decodeCursor(cursor: string | undefined, snapshotId: string): string | undefined {
  if (cursor === undefined) return undefined;
  const prefix = `${snapshotId}:`;
  if (!cursor.startsWith(prefix)) throw new Error("INVALID_OWNERSHIP_CURSOR");
  const account = cursor.slice(prefix.length);
  if (!/^G[A-Z2-7]{55}$/.test(account)) throw new Error("INVALID_OWNERSHIP_CURSOR");
  return account;
}

export const get = query({
  args: {
    boundaryKey: v.string(),
    sessionTokenHash: v.string(),
    assetId: v.string(),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
    q: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await enforceAuth(ctx, args.sessionTokenHash, args.boundaryKey);
    const issuance = await confirmedIssuance(ctx, session.organizationId, args.assetId);
    const snapshot = issuance.currentOwnershipSnapshotId
      ? await ctx.db.get(issuance.currentOwnershipSnapshotId)
      : null;
    const latestAttempt = await ctx.db
      .query("ownershipSyncAttempts")
      .withIndex("by_organizationId_assetId_startedAt", (q) =>
        q.eq("organizationId", session.organizationId).eq("assetId", args.assetId),
      )
      .order("desc")
      .first();
    const now = Date.now();
    let state: "unavailable" | "refreshing" | "fresh" | "stale" | "failed" = "unavailable";
    if (latestAttempt?.state === "Queued" || latestAttempt?.state === "Staging") {
      state = "refreshing";
    } else if (
      latestAttempt?.state === "Failed" &&
      (!snapshot || latestAttempt.startedAt > snapshot.synchronizedAt)
    ) {
      state = "failed";
    } else if (snapshot) {
      state = now - snapshot.synchronizedAt > STALE_AFTER_MS ? "stale" : "fresh";
    }

    if (!snapshot) {
      return {
        asset: {
          assetId: issuance.assetId,
          assetCode: issuance.assetCode,
          issuerAccount: issuance.issuerAccount,
          network: "Testnet" as const,
          confirmedSupply: issuance.supply,
        },
        snapshot: null,
        sync: {
          state,
          safeErrorCode: latestAttempt?.safeErrorCode,
          lastAttemptAt: latestAttempt?.startedAt,
        },
        holders: { items: [], nextCursor: null },
      };
    }

    const limit = pageLimit(args.limit);
    const afterAccount = decodeCursor(args.cursor, snapshot.snapshotId);
    const search =
      args.q === undefined || args.q.trim() === "" ? undefined : normalizeAccountSearch(args.q);
    if (search !== undefined && afterAccount !== undefined && !afterAccount.startsWith(search)) {
      throw new Error("INVALID_OWNERSHIP_CURSOR");
    }
    const rows = search
      ? await ctx.db
          .query("ownershipStagedHolders")
          .withIndex("by_attemptId_normalizedAccount", (q) =>
            afterAccount
              ? q
                  .eq("attemptId", snapshot.attemptId)
                  .gt("normalizedAccount", afterAccount)
                  .lt("normalizedAccount", `${search}\uffff`)
              : q
                  .eq("attemptId", snapshot.attemptId)
                  .gte("normalizedAccount", search)
                  .lt("normalizedAccount", `${search}\uffff`),
          )
          .take(limit + 1)
      : await ctx.db
          .query("ownershipStagedHolders")
          .withIndex("by_attemptId_account", (q) =>
            afterAccount
              ? q.eq("attemptId", snapshot.attemptId).gt("account", afterAccount)
              : q.eq("attemptId", snapshot.attemptId),
          )
          .take(limit + 1);
    const page = rows.slice(0, limit);
    return {
      asset: {
        assetId: issuance.assetId,
        assetCode: issuance.assetCode,
        issuerAccount: issuance.issuerAccount,
        network: "Testnet" as const,
        confirmedSupply: issuance.supply,
      },
      snapshot: {
        snapshotId: snapshot.snapshotId,
        confirmedSupply: snapshot.confirmedSupply,
        observedSupply: snapshot.observedSupply,
        holderCount: snapshot.holderCount,
        holdersHash: snapshot.holdersHash,
        firstLedger: snapshot.firstLedger,
        lastLedger: snapshot.lastLedger,
        synchronizedAt: snapshot.synchronizedAt,
      },
      sync: {
        state,
        safeErrorCode: latestAttempt?.safeErrorCode,
        lastAttemptAt: latestAttempt?.startedAt,
      },
      holders: {
        items: page.map((holder) => ({
          account: holder.account,
          balance: holder.balance,
          share: holder.share,
          ledger: holder.ledger,
        })),
        nextCursor:
          rows.length > limit && page.length > 0
            ? `${snapshot.snapshotId}:${page.at(-1)!.account}`
            : null,
      },
    };
  },
});

export const refresh = mutation({
  args: {
    boundaryKey: v.string(),
    sessionTokenHash: v.string(),
    assetId: v.string(),
    reason: reasonValidator,
    requestId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await enforceAuth(ctx, args.sessionTokenHash, args.boundaryKey);
    const issuance = await confirmedIssuance(ctx, session.organizationId, args.assetId);
    const existing = await ctx.db
      .query("ownershipSyncAttempts")
      .withIndex("by_organizationId_assetId_requestId", (q) =>
        q
          .eq("organizationId", session.organizationId)
          .eq("assetId", args.assetId)
          .eq("requestId", args.requestId),
      )
      .unique();
    if (existing) return { status: "deduplicated" as const, attemptId: existing.attemptId };
    const recent = await ctx.db
      .query("ownershipSyncAttempts")
      .withIndex("by_organizationId_assetId_startedAt", (q) =>
        q.eq("organizationId", session.organizationId).eq("assetId", args.assetId),
      )
      .order("desc")
      .take(20);
    const active = recent.find(
      (attempt) => attempt.state === "Queued" || attempt.state === "Staging",
    );
    if (active) return { status: "deduplicated" as const, attemptId: active.attemptId };
    const now = Date.now();
    if (args.reason === "manual") {
      const lastManual = recent.find((attempt) => attempt.reason === "manual");
      if (lastManual && now - lastManual.startedAt < MANUAL_THROTTLE_MS) {
        return {
          status: "throttled" as const,
          retryAfterMs: MANUAL_THROTTLE_MS - (now - lastManual.startedAt),
        };
      }
    }
    const attemptId = crypto.randomUUID();
    await ctx.db.insert("ownershipSyncAttempts", {
      attemptId,
      requestId: args.requestId,
      organizationId: session.organizationId,
      assetId: args.assetId,
      issuanceId: issuance.issuanceId,
      reason: args.reason,
      state: "Queued",
      pageCount: 0,
      holderCount: 0,
      observedUnits: 0n,
      startedAt: now,
      updatedAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.ownershipWorker.process, { attemptId });
    return { status: "accepted" as const, attemptId };
  },
});

export const enqueueConfirmed = internalMutation({
  args: { issuanceId: v.string() },
  handler: async (ctx, args) => {
    const issuance = await ctx.db
      .query("issuances")
      .withIndex("by_issuanceId", (q) => q.eq("issuanceId", args.issuanceId))
      .unique();
    if (!issuance || issuance.status !== "Confirmed") return null;
    const requestId = `issuance-confirmed:${issuance.issuanceId}`;
    const existing = await ctx.db
      .query("ownershipSyncAttempts")
      .withIndex("by_organizationId_assetId_requestId", (q) =>
        q
          .eq("organizationId", issuance.organizationId)
          .eq("assetId", issuance.assetId)
          .eq("requestId", requestId),
      )
      .unique();
    if (existing) return existing.attemptId;
    const now = Date.now();
    const attemptId = crypto.randomUUID();
    await ctx.db.insert("ownershipSyncAttempts", {
      attemptId,
      requestId,
      organizationId: issuance.organizationId,
      assetId: issuance.assetId,
      issuanceId: issuance.issuanceId,
      reason: "issuance-confirmed",
      state: "Queued",
      pageCount: 0,
      holderCount: 0,
      observedUnits: 0n,
      startedAt: now,
      updatedAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.ownershipWorker.process, { attemptId });
    return attemptId;
  },
});

export const preparePerformanceFixture = internalMutation({
  args: { issuanceId: v.string(), requestId: v.string() },
  handler: async (ctx, args) => {
    const issuance = await ctx.db
      .query("issuances")
      .withIndex("by_issuanceId", (q) => q.eq("issuanceId", args.issuanceId))
      .unique();
    if (!issuance || issuance.status !== "Confirmed") throw new Error("OWNERSHIP_ISSUANCE_INVALID");
    if (issuance.runId) throw new Error("PERFORMANCE_FIXTURE_FORMAL_RUN_FORBIDDEN");
    const replay = await ctx.db
      .query("ownershipSyncAttempts")
      .withIndex("by_organizationId_assetId_requestId", (q) =>
        q
          .eq("organizationId", issuance.organizationId)
          .eq("assetId", issuance.assetId)
          .eq("requestId", args.requestId),
      )
      .unique();
    if (replay) return replay.attemptId;
    const attemptId = crypto.randomUUID();
    const now = Date.now();
    await ctx.db.insert("ownershipSyncAttempts", {
      attemptId,
      requestId: args.requestId,
      organizationId: issuance.organizationId,
      assetId: issuance.assetId,
      issuanceId: issuance.issuanceId,
      reason: "manual",
      state: "Queued",
      pageCount: 0,
      holderCount: 0,
      observedUnits: 0n,
      startedAt: now,
      updatedAt: now,
    });
    return attemptId;
  },
});

export const beginAttempt = internalMutation({
  args: { attemptId: v.string(), holderId: v.string() },
  handler: async (ctx, args) => {
    const attempt = await ctx.db
      .query("ownershipSyncAttempts")
      .withIndex("by_attemptId", (q) => q.eq("attemptId", args.attemptId))
      .unique();
    if (!attempt || attempt.state === "Complete" || attempt.state === "Failed") return null;
    const issuance = await ctx.db
      .query("issuances")
      .withIndex("by_issuanceId", (q) => q.eq("issuanceId", attempt.issuanceId))
      .unique();
    if (!issuance || issuance.status !== "Confirmed") throw new Error("OWNERSHIP_ISSUANCE_INVALID");
    const now = Date.now();
    const lease = await ctx.db
      .query("ownershipSyncLeases")
      .withIndex("by_organizationId_assetId", (q) =>
        q.eq("organizationId", attempt.organizationId).eq("assetId", attempt.assetId),
      )
      .unique();
    if (lease && lease.leaseExpiresAt > now && lease.holderId !== args.holderId) {
      return { busy: true as const, retryAfterMs: lease.leaseExpiresAt - now };
    }
    const fencingToken = (lease?.fencingToken ?? 0n) + 1n;
    if (lease) {
      await ctx.db.patch(lease._id, {
        holderId: args.holderId,
        fencingToken,
        leaseExpiresAt: now + OWNERSHIP_LEASE_MS,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("ownershipSyncLeases", {
        organizationId: attempt.organizationId,
        assetId: attempt.assetId,
        holderId: args.holderId,
        fencingToken,
        leaseExpiresAt: now + OWNERSHIP_LEASE_MS,
        updatedAt: now,
      });
    }
    await ctx.db.patch(attempt._id, { state: "Staging", fencingToken, updatedAt: now });
    return {
      busy: false as const,
      fencingToken,
      assetCode: issuance.assetCode,
      issuerAccount: issuance.issuerAccount,
      confirmedSupply: issuance.supply,
      confirmedUnits: issuance.supplyUnits,
    };
  },
});

async function assertFence(
  ctx: GenericMutationCtx<DataModel>,
  attemptId: string,
  fencingToken: bigint,
) {
  const attempt = await ctx.db
    .query("ownershipSyncAttempts")
    .withIndex("by_attemptId", (q) => q.eq("attemptId", attemptId))
    .unique();
  if (!attempt || attempt.state !== "Staging" || attempt.fencingToken !== fencingToken) {
    throw new Error("STALE_OWNERSHIP_FENCE");
  }
  const lease = await ctx.db
    .query("ownershipSyncLeases")
    .withIndex("by_organizationId_assetId", (q) =>
      q.eq("organizationId", attempt.organizationId).eq("assetId", attempt.assetId),
    )
    .unique();
  if (!lease || lease.fencingToken !== fencingToken || lease.leaseExpiresAt <= Date.now()) {
    throw new Error("STALE_OWNERSHIP_FENCE");
  }
  return { attempt, lease };
}

export const stagePage = internalMutation({
  args: {
    attemptId: v.string(),
    fencingToken: v.int64(),
    pageNumber: v.number(),
    holders: v.array(holderValidator),
  },
  handler: async (ctx, args) => {
    const { attempt, lease } = await assertFence(ctx, args.attemptId, args.fencingToken);
    if (args.pageNumber !== attempt.pageCount + 1)
      throw new Error("OWNERSHIP_PAGE_SEQUENCE_INVALID");
    const issuance = await ctx.db
      .query("issuances")
      .withIndex("by_issuanceId", (q) => q.eq("issuanceId", attempt.issuanceId))
      .unique();
    if (!issuance) throw new Error("OWNERSHIP_ISSUANCE_INVALID");
    let lastAccount = attempt.lastAccount;
    let observedUnits = attempt.observedUnits;
    let firstLedger = attempt.firstLedger;
    let lastLedger = attempt.lastLedger;
    for (const holder of args.holders) {
      if (
        !/^G[A-Z2-7]{55}$/.test(holder.account) ||
        (lastAccount && holder.account <= lastAccount)
      ) {
        throw new Error("OWNERSHIP_HOLDER_ORDER_INVALID");
      }
      if (holder.balanceUnits <= 0n) throw new Error("OWNERSHIP_ZERO_HOLDER_INVALID");
      observedUnits += holder.balanceUnits;
      await ctx.db.insert("ownershipStagedHolders", {
        attemptId: attempt.attemptId,
        organizationId: attempt.organizationId,
        account: holder.account,
        normalizedAccount: holder.account,
        balance: holder.balance,
        balanceUnits: holder.balanceUnits,
        share: ownershipShare(holder.balanceUnits, issuance.supplyUnits),
        ledger: holder.ledger,
      });
      lastAccount = holder.account;
      firstLedger =
        firstLedger === undefined ? holder.ledger : Math.min(firstLedger, holder.ledger);
      lastLedger = lastLedger === undefined ? holder.ledger : Math.max(lastLedger, holder.ledger);
    }
    const now = Date.now();
    await ctx.db.patch(attempt._id, {
      pageCount: args.pageNumber,
      holderCount: attempt.holderCount + args.holders.length,
      observedUnits,
      firstLedger,
      lastLedger,
      lastAccount,
      updatedAt: now,
    });
    await ctx.db.patch(lease._id, { leaseExpiresAt: now + OWNERSHIP_LEASE_MS, updatedAt: now });
  },
});

export const completeAttempt = internalMutation({
  args: {
    attemptId: v.string(),
    fencingToken: v.int64(),
    pageCount: v.number(),
    holderCount: v.number(),
    observedUnits: v.int64(),
    holdersHash: v.string(),
    firstLedger: v.optional(v.number()),
    lastLedger: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { attempt, lease } = await assertFence(ctx, args.attemptId, args.fencingToken);
    const issuance = await ctx.db
      .query("issuances")
      .withIndex("by_issuanceId", (q) => q.eq("issuanceId", attempt.issuanceId))
      .unique();
    if (!issuance || issuance.status !== "Confirmed") throw new Error("OWNERSHIP_ISSUANCE_INVALID");
    if (
      attempt.pageCount !== args.pageCount ||
      attempt.holderCount !== args.holderCount ||
      attempt.observedUnits !== args.observedUnits ||
      args.observedUnits !== issuance.supplyUnits ||
      attempt.firstLedger !== args.firstLedger ||
      attempt.lastLedger !== args.lastLedger
    ) {
      throw new Error("OWNERSHIP_SUPPLY_MISMATCH");
    }
    const staged = await ctx.db
      .query("ownershipStagedHolders")
      .withIndex("by_attemptId_account", (q) => q.eq("attemptId", attempt.attemptId))
      .take(10_001);
    if (staged.length !== args.holderCount || staged.length > 10_000) {
      throw new Error("OWNERSHIP_CORPUS_MISMATCH");
    }
    const recomputedHash = await sha256Hex(staged.map(canonicalHolderLine).join(""));
    if (recomputedHash !== args.holdersHash || !/^[a-f0-9]{64}$/.test(args.holdersHash)) {
      throw new Error("OWNERSHIP_HASH_MISMATCH");
    }
    const now = Date.now();
    const snapshotId = crypto.randomUUID();
    const snapshotDocumentId = await ctx.db.insert("ownershipSnapshots", {
      snapshotId,
      attemptId: attempt.attemptId,
      organizationId: attempt.organizationId,
      assetId: attempt.assetId,
      issuanceId: attempt.issuanceId,
      network: "Testnet",
      assetCode: issuance.assetCode,
      issuerAccount: issuance.issuerAccount,
      confirmedSupply: issuance.supply,
      observedSupply: issuance.supply,
      holderCount: args.holderCount,
      holdersHash: args.holdersHash,
      firstLedger: args.firstLedger,
      lastLedger: args.lastLedger,
      synchronizedAt: now,
      runId: issuance.runId,
      pinned: issuance.runId ? true : undefined,
    });
    await ctx.db.patch(issuance._id, { currentOwnershipSnapshotId: snapshotDocumentId });
    await ctx.db.patch(attempt._id, {
      state: "Complete",
      holdersHash: args.holdersHash,
      completedAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(lease._id, { leaseExpiresAt: now, updatedAt: now });
    await recordActivity(ctx, {
      organizationId: attempt.organizationId,
      actorKind: "system",
      eventType: "ownership.proof_published",
      outcome: "success",
      correlationId: `ownership:${attempt.attemptId}`,
      eventId: `ownership.proof_published:${snapshotId}`,
      assetId: attempt.assetId,
      subjectId: snapshotId,
      runId: issuance.runId,
      metadata: {
        snapshotId,
        holderCount: args.holderCount,
        contentHash: args.holdersHash,
        network: "Testnet",
        confirmedSupply: issuance.supply,
        observedSupply: issuance.supply,
        assetCode: issuance.assetCode,
        issuerAccount: issuance.issuerAccount,
      },
      timestamp: now,
    });
    await ctx.scheduler.runAfter(0, internal.ownership.cleanup, {
      organizationId: attempt.organizationId,
      assetId: attempt.assetId,
    });
    await ctx.scheduler.runAfter(0, internal.ownership.cleanupExpiredStaging, {});
    return { snapshotId };
  },
});

const SAFE_FAILURES = new Set([
  "HORIZON_RATE_LIMITED",
  "HORIZON_UNAVAILABLE",
  "HORIZON_RESPONSE_INVALID",
  "HORIZON_ACCOUNT_INVALID",
  "HORIZON_ASSET_IDENTITY_INVALID",
  "HORIZON_PAGINATION_INVALID",
  "HORIZON_CURSOR_LOOP",
  "HORIZON_ACCOUNT_ORDER_INVALID",
  "HORIZON_PAGE_LIMIT_EXCEEDED",
  "HORIZON_HOLDER_LIMIT_EXCEEDED",
  "INVALID_HOLDER_BALANCE",
  "OWNERSHIP_SUPPLY_MISMATCH",
  "OWNERSHIP_HASH_MISMATCH",
  "STALE_OWNERSHIP_FENCE",
]);

export const failAttempt = internalMutation({
  args: { attemptId: v.string(), fencingToken: v.optional(v.int64()), safeErrorCode: v.string() },
  handler: async (ctx, args) => {
    const attempt = await ctx.db
      .query("ownershipSyncAttempts")
      .withIndex("by_attemptId", (q) => q.eq("attemptId", args.attemptId))
      .unique();
    if (!attempt || attempt.state === "Complete" || attempt.state === "Failed") return;
    if (args.fencingToken !== undefined && attempt.fencingToken !== args.fencingToken) return;
    const safeErrorCode = SAFE_FAILURES.has(args.safeErrorCode)
      ? args.safeErrorCode
      : "OWNERSHIP_SYNC_FAILED";
    const now = Date.now();
    await ctx.db.patch(attempt._id, { state: "Failed", safeErrorCode, updatedAt: now });
    const lease = await ctx.db
      .query("ownershipSyncLeases")
      .withIndex("by_organizationId_assetId", (q) =>
        q.eq("organizationId", attempt.organizationId).eq("assetId", attempt.assetId),
      )
      .unique();
    if (lease && (args.fencingToken === undefined || lease.fencingToken === args.fencingToken)) {
      await ctx.db.patch(lease._id, { leaseExpiresAt: now, updatedAt: now });
    }
  },
});

export const cleanup = internalMutation({
  args: { organizationId: v.id("organizations"), assetId: v.string() },
  handler: async (ctx, args) => {
    const issuance = await ctx.db
      .query("issuances")
      .withIndex("by_organizationId_assetId_network", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("assetId", args.assetId)
          .eq("network", "Testnet"),
      )
      .unique();
    const snapshots = await ctx.db
      .query("ownershipSnapshots")
      .withIndex("by_organizationId_assetId_synchronizedAt", (q) =>
        q.eq("organizationId", args.organizationId).eq("assetId", args.assetId),
      )
      .order("desc")
      .collect();
    const now = Date.now();
    const candidate = snapshots.find(
      (snapshot, index) =>
        snapshot._id !== issuance?.currentOwnershipSnapshotId &&
        !snapshot.pinned &&
        (index >= SNAPSHOT_RETENTION_COUNT ||
          now - snapshot.synchronizedAt > SNAPSHOT_RETENTION_MS),
    );
    if (!candidate) return { deleted: false };
    const holders = await ctx.db
      .query("ownershipStagedHolders")
      .withIndex("by_attemptId_account", (q) => q.eq("attemptId", candidate.attemptId))
      .take(200);
    for (const holder of holders) await ctx.db.delete(holder._id);
    if (holders.length === 0) {
      await ctx.db.delete(candidate._id);
      const attempt = await ctx.db
        .query("ownershipSyncAttempts")
        .withIndex("by_attemptId", (q) => q.eq("attemptId", candidate.attemptId))
        .unique();
      if (attempt) await ctx.db.delete(attempt._id);
    }
    await ctx.scheduler.runAfter(0, internal.ownership.cleanup, args);
    return { deleted: holders.length === 0 };
  },
});

export const cleanupExpiredStaging = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - STAGING_EXPIRY_MS;
    let candidate = null;
    for (const state of ["Queued", "Staging", "Failed"] as const) {
      candidate = await ctx.db
        .query("ownershipSyncAttempts")
        .withIndex("by_state_updatedAt", (q) => q.eq("state", state).lt("updatedAt", cutoff))
        .first();
      if (candidate) break;
    }
    if (!candidate) return { deleted: false };
    const holders = await ctx.db
      .query("ownershipStagedHolders")
      .withIndex("by_attemptId_account", (q) => q.eq("attemptId", candidate!.attemptId))
      .take(200);
    for (const holder of holders) await ctx.db.delete(holder._id);
    if (holders.length === 0) await ctx.db.delete(candidate._id);
    await ctx.scheduler.runAfter(0, internal.ownership.cleanupExpiredStaging, {});
    return { deleted: holders.length === 0 };
  },
});
