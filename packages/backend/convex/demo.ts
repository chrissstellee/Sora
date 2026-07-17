import { v } from "convex/values";

import {
  CONTROLLED_FAULT_BOUNDARY,
  DEMO_DEPLOYMENT_TIER,
  allocateDemoAssetCode,
  assertControlledFault,
  assertDemoTestnetEnvironment,
  canonicalPreflightResult,
} from "../src/domain/demo.js";
import { STELLAR_TESTNET_CONFIG } from "../src/stellar/config.js";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server.js";
import { recordActivity } from "./activityWriter.js";
import { enforceBoundary } from "./helpers.js";

import type { DataModel, Id } from "./_generated/dataModel.js";
import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";

type ReadCtx = GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>;

function environment() {
  return (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } })
    .process?.env;
}

export function assertPrivateDemoAccess(boundaryKey: string, operatorKey: string) {
  enforceBoundary(boundaryKey);
  const env = environment();
  if (!env?.PHASE5_OPERATOR_KEY || operatorKey !== env.PHASE5_OPERATOR_KEY) {
    throw new Error("Unauthorized: Invalid Phase 5 operator");
  }
  assertDemoTestnetEnvironment({
    deploymentTier: env.SORA_DEPLOYMENT_TIER,
    networkPassphrase: STELLAR_TESTNET_CONFIG.networkPassphrase,
    horizonUrl: STELLAR_TESTNET_CONFIG.horizonUrl,
    explorerUrl: STELLAR_TESTNET_CONFIG.explorerUrl,
    faultsEnabled: env.PHASE5_FAULTS_ENABLED,
  });
  return env;
}

async function configuredOrganization(ctx: ReadCtx): Promise<Id<"organizations">> {
  const raw = environment()?.PHASE5_DEMO_ORGANIZATION_ID;
  if (!raw) throw new Error("DEMO_ORGANIZATION_NOT_CONFIGURED");
  const id = raw as Id<"organizations">;
  if (!(await ctx.db.get(id))) throw new Error("DEMO_ORGANIZATION_NOT_FOUND");
  return id;
}

export async function activeRunForOrganization(ctx: ReadCtx, organizationId: Id<"organizations">) {
  const active = await ctx.db
    .query("demoRuns")
    .withIndex("by_organizationId_status", (q) =>
      q.eq("organizationId", organizationId).eq("status", "Active"),
    )
    .unique();
  if (active) return active;
  return await ctx.db
    .query("demoRuns")
    .withIndex("by_organizationId_status", (q) =>
      q.eq("organizationId", organizationId).eq("status", "Prepared"),
    )
    .unique();
}

async function runById(ctx: ReadCtx, runId: string) {
  return await ctx.db
    .query("demoRuns")
    .withIndex("by_runId", (q) => q.eq("runId", runId))
    .unique();
}

export const prepare = mutation({
  args: {
    boundaryKey: v.string(),
    operatorKey: v.string(),
    requestId: v.string(),
    browserTarget: v.string(),
  },
  handler: async (ctx, args) => {
    const env = assertPrivateDemoAccess(args.boundaryKey, args.operatorKey);
    if (!args.requestId.trim() || args.requestId.length > 100)
      throw new Error("DEMO_REQUEST_INVALID");
    if (!args.browserTarget.trim() || args.browserTarget.length > 100) {
      throw new Error("DEMO_BROWSER_TARGET_INVALID");
    }
    const organizationId = await configuredOrganization(ctx);
    const replay = await ctx.db
      .query("demoRuns")
      .withIndex("by_organizationId_requestId", (q) =>
        q.eq("organizationId", organizationId).eq("requestId", args.requestId),
      )
      .unique();
    if (replay) return publicRun(replay, true);
    if (await activeRunForOrganization(ctx, organizationId))
      throw new Error("DEMO_RUN_ALREADY_ACTIVE");

    const runId = crypto.randomUUID();
    const issuerAccount = env.STELLAR_TESTNET_ISSUER_PUBLIC_KEY;
    if (!issuerAccount) throw new Error("ISSUANCE_PUBLIC_ACCOUNTS_INVALID");
    const { assetCode, assetCodeNonce } = await allocateDemoAssetCode(runId, async (candidate) => {
      const [priorRun, reservedIdentity] = await Promise.all([
        ctx.db
          .query("demoRuns")
          .withIndex("by_organizationId_assetCode", (q) =>
            q.eq("organizationId", organizationId).eq("assetCode", candidate),
          )
          .unique(),
        ctx.db
          .query("managedAssetIdentities")
          .withIndex("by_network_assetCode_issuerAccount", (q) =>
            q
              .eq("network", "Testnet")
              .eq("assetCode", candidate)
              .eq("issuerAccount", issuerAccount),
          )
          .unique(),
      ]);
      return Boolean(priorRun || reservedIdentity);
    });
    const now = Date.now();
    const id = await ctx.db.insert("demoRuns", {
      runId,
      requestId: args.requestId,
      organizationId,
      assetCode,
      assetCodeNonce,
      status: "Prepared",
      environment: DEMO_DEPLOYMENT_TIER,
      browserTarget: args.browserTarget.trim(),
      startedAt: now,
      outcome: "Not Executed",
    });
    await recordActivity(ctx, {
      organizationId,
      actorKind: "system",
      eventType: "demo.run_prepared",
      outcome: "success",
      correlationId: args.requestId,
      eventId: `demo.run_prepared:${runId}`,
      runId,
      subjectId: runId,
      metadata: {
        assetCode,
        environment: DEMO_DEPLOYMENT_TIER,
        browserTarget: args.browserTarget.trim(),
      },
      timestamp: now,
    });
    return publicRun((await ctx.db.get(id))!, false);
  },
});

export const get = query({
  args: { boundaryKey: v.string(), operatorKey: v.string(), runId: v.string() },
  handler: async (ctx, args) => {
    assertPrivateDemoAccess(args.boundaryKey, args.operatorKey);
    const run = await runById(ctx, args.runId);
    const organizationId = await configuredOrganization(ctx);
    if (!run || run.organizationId !== organizationId) throw new Error("DEMO_RUN_NOT_FOUND");
    const checks = await ctx.db
      .query("demoPreflightChecks")
      .withIndex("by_runId_check", (q) => q.eq("runId", run.runId))
      .take(50);
    return {
      ...publicRun(run, false),
      checks: checks.map(({ _id, _creationTime, organizationId: _, ...check }) => check),
    };
  },
});

export const preflightSnapshot = internalQuery({
  args: { runId: v.string() },
  handler: async (ctx, args) => {
    const run = await runById(ctx, args.runId);
    if (!run) throw new Error("DEMO_RUN_NOT_FOUND");
    const now = Date.now();
    const rawOperatorId = environment()?.PHASE5_OPERATOR_USER_ID;
    const [locks, ownershipLeases, sessions, issuances, operator] = await Promise.all([
      ctx.db.query("accountLocks").take(20),
      ctx.db.query("ownershipSyncLeases").take(100),
      ctx.db
        .query("sessions")
        .withIndex("by_organizationId_expiresAt", (q) =>
          q.eq("organizationId", run.organizationId).gt("expiresAt", now),
        )
        .take(100),
      ctx.db
        .query("issuances")
        .withIndex("by_organizationId_updatedAt", (q) => q.eq("organizationId", run.organizationId))
        .order("desc")
        .take(25),
      rawOperatorId
        ? ctx.db.get(rawOperatorId as Id<"users">).catch(() => null)
        : Promise.resolve(null),
    ]);
    return {
      run,
      storedManifest: run.evidenceManifest,
      activeLocks:
        locks.filter((lock) => lock.leaseExpiresAt > now).length +
        ownershipLeases.filter((lease) => lease.leaseExpiresAt > now).length,
      activeSessionCount: sessions.filter((session) => !session.revokedAt).length,
      operatorWallet:
        operator?.organizationId === run.organizationId && !operator.disabledAt
          ? operator.walletAddress
          : undefined,
      activeIssuances: issuances.filter(
        (item) => item.status === "Pending" || item.status === "Submitted",
      ).length,
    };
  },
});

export const evidenceSnapshot = internalQuery({
  args: { runId: v.string() },
  handler: async (ctx, args) => {
    const run = await runById(ctx, args.runId);
    if (!run) throw new Error("DEMO_RUN_NOT_FOUND");
    const [checks, assets, issuances, events, fault] = await Promise.all([
      ctx.db
        .query("demoPreflightChecks")
        .withIndex("by_runId_check", (q) => q.eq("runId", run.runId))
        .take(100),
      ctx.db
        .query("assets")
        .withIndex("by_organizationId_updatedAt", (q) => q.eq("organizationId", run.organizationId))
        .order("desc")
        .take(100),
      ctx.db
        .query("issuances")
        .withIndex("by_organizationId_updatedAt", (q) => q.eq("organizationId", run.organizationId))
        .order("desc")
        .take(100),
      ctx.db
        .query("activityEvents")
        .withIndex("by_organizationId_runId_timestamp", (q) =>
          q.eq("organizationId", run.organizationId).eq("runId", run.runId),
        )
        .take(1_000),
      ctx.db
        .query("demoFaults")
        .withIndex("by_runId_boundary", (q) =>
          q.eq("runId", run.runId).eq("boundary", CONTROLLED_FAULT_BOUNDARY),
        )
        .unique(),
    ]);
    const runAssets = assets.filter((asset) => asset.runId === run.runId);
    const runIssuances = issuances.filter((issuance) => issuance.runId === run.runId);
    const issuance = runIssuances.length === 1 ? runIssuances[0] : undefined;
    const [snapshot, attempts, reconciliations] = issuance
      ? await Promise.all([
          issuance.currentOwnershipSnapshotId
            ? ctx.db.get(issuance.currentOwnershipSnapshotId)
            : Promise.resolve(null),
          ctx.db
            .query("transactionAttempts")
            .withIndex("by_issuanceId_purpose_attemptNumber", (q) =>
              q.eq("issuanceId", issuance.issuanceId).eq("purpose", "issuance-payment"),
            )
            .take(20),
          ctx.db
            .query("reconciliationEvidence")
            .withIndex("by_issuanceId_purpose_checkedAt", (q) =>
              q.eq("issuanceId", issuance.issuanceId).eq("purpose", "issuance-payment"),
            )
            .take(100),
        ])
      : [null, [], []];
    return {
      run,
      checks: checks.map((check) => ({ check: check.check, status: check.status })),
      assets: runAssets.map((asset) => ({
        assetId: asset.assetId,
        lifecycle: asset.lifecycle,
        version: asset.version,
      })),
      issuances: runIssuances.map((item) => ({
        issuanceId: item.issuanceId,
        assetId: item.assetId,
        status: item.status,
        network: item.network,
        assetCode: item.assetCode,
        issuerAccount: item.issuerAccount,
        distributorAccount: item.distributorAccount,
        supply: item.supply,
        paymentHash: item.paymentHash,
        paymentLedger: item.paymentLedger,
        confirmedAt: item.confirmedAt,
      })),
      snapshot: snapshot
        ? {
            snapshotId: snapshot.snapshotId,
            runId: snapshot.runId,
            confirmedSupply: snapshot.confirmedSupply,
            observedSupply: snapshot.observedSupply,
            holderCount: snapshot.holderCount,
            holdersHash: snapshot.holdersHash,
            firstLedger: snapshot.firstLedger,
            lastLedger: snapshot.lastLedger,
            synchronizedAt: snapshot.synchronizedAt,
          }
        : null,
      paymentAttempts: attempts.map((attempt) => ({
        hash: attempt.hash,
        state: attempt.state,
        attemptNumber: attempt.attemptNumber,
      })),
      reconciliationCount: reconciliations.length,
      eventTypes: events.map((event) => event.eventType),
      faultStatus: fault?.status,
    };
  },
});

export const performanceFixtureTarget = internalQuery({
  args: { assetId: v.string() },
  handler: async (ctx, args) => {
    const organizationId = await configuredOrganization(ctx);
    const issuance = await ctx.db
      .query("issuances")
      .withIndex("by_organizationId_assetId_network", (q) =>
        q.eq("organizationId", organizationId).eq("assetId", args.assetId).eq("network", "Testnet"),
      )
      .unique();
    if (!issuance || issuance.status !== "Confirmed")
      throw new Error("PERFORMANCE_ASSET_NOT_CONFIRMED");
    if (issuance.runId) throw new Error("PERFORMANCE_FIXTURE_FORMAL_RUN_FORBIDDEN");
    const currentSnapshot = issuance.currentOwnershipSnapshotId
      ? await ctx.db.get(issuance.currentOwnershipSnapshotId)
      : null;
    return {
      issuanceId: issuance.issuanceId,
      supplyUnits: issuance.supplyUnits,
      ledger: issuance.paymentLedger ?? 0,
      currentSnapshot:
        currentSnapshot && currentSnapshot.holderCount === 5_000
          ? { snapshotId: currentSnapshot.snapshotId, holderCount: currentSnapshot.holderCount }
          : null,
    };
  },
});

export const finalizeEvidence = internalMutation({
  args: {
    runId: v.string(),
    evidenceManifest: v.string(),
    recoveryScenario: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const run = await runById(ctx, args.runId);
    if (!run || run.status !== "Active") throw new Error("DEMO_RUN_NOT_ACTIVE");
    if (args.evidenceManifest.length > 20_000) throw new Error("DEMO_EVIDENCE_TOO_LARGE");
    const completedAt = Date.now();
    const durationMs = completedAt - run.startedAt;
    if (durationMs >= 10 * 60_000) throw new Error("DEMO_RUN_TIME_GATE_FAILED");
    await ctx.db.patch(run._id, {
      status: "Completed",
      outcome: "Pass",
      completedAt,
      durationMs,
      evidenceManifest: args.evidenceManifest,
      recoveryScenario: args.recoveryScenario,
    });
    await recordActivity(ctx, {
      organizationId: run.organizationId,
      actorKind: "system",
      eventType: "demo.run_completed",
      outcome: "success",
      correlationId: `demo-evidence:${run.runId}`,
      eventId: `demo.run_completed:${run.runId}`,
      runId: run.runId,
      subjectId: run.runId,
      metadata: {
        status: "Pass",
        durationMs,
        recoveryScenario: args.recoveryScenario ?? "none",
      },
      timestamp: completedAt,
    });
    return { runId: run.runId, status: "Completed" as const, outcome: "Pass" as const, durationMs };
  },
});

export const recordPreflight = internalMutation({
  args: {
    runId: v.string(),
    correlationId: v.string(),
    checks: v.array(
      v.object({
        check: v.string(),
        status: v.union(v.literal("Pass"), v.literal("Fail"), v.literal("Not Executed")),
        safeAction: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const run = await runById(ctx, args.runId);
    if (!run) throw new Error("DEMO_RUN_NOT_FOUND");
    const existing = await ctx.db
      .query("demoPreflightChecks")
      .withIndex("by_runId_check", (q) => q.eq("runId", run.runId))
      .take(100);
    const previousPassed =
      existing.length > 0 && existing.every((check) => check.status === "Pass");
    for (const item of existing) await ctx.db.delete(item._id);
    const checkedAt = Date.now();
    const checks = args.checks.map(canonicalPreflightResult);
    for (const check of checks) {
      await ctx.db.insert("demoPreflightChecks", {
        runId: run.runId,
        organizationId: run.organizationId,
        ...check,
        correlationId: args.correlationId,
        checkedAt,
      });
    }
    const passed = checks.length > 0 && checks.every((check) => check.status === "Pass");
    await ctx.db.patch(run._id, {
      status: passed ? "Active" : "Prepared",
      outcome: passed ? "Not Executed" : "Fail",
    });
    if (!passed || !previousPassed) {
      await recordActivity(ctx, {
        organizationId: run.organizationId,
        actorKind: "system",
        eventType: "demo.preflight_completed",
        outcome: passed ? "success" : "failure",
        correlationId: args.correlationId,
        eventId: `demo.preflight_completed:${run.runId}:${passed ? "Pass" : args.correlationId}`,
        runId: run.runId,
        subjectId: run.runId,
        metadata: { status: passed ? "Pass" : "Fail", checkCount: checks.length },
        timestamp: checkedAt,
      });
    }
    return { passed, checks };
  },
});

export const armFault = mutation({
  args: { boundaryKey: v.string(), operatorKey: v.string(), runId: v.string() },
  handler: async (ctx, args) => {
    const env = assertPrivateDemoAccess(args.boundaryKey, args.operatorKey);
    assertDemoTestnetEnvironment(
      {
        deploymentTier: env.SORA_DEPLOYMENT_TIER,
        networkPassphrase: STELLAR_TESTNET_CONFIG.networkPassphrase,
        horizonUrl: STELLAR_TESTNET_CONFIG.horizonUrl,
        explorerUrl: STELLAR_TESTNET_CONFIG.explorerUrl,
        faultsEnabled: env.PHASE5_FAULTS_ENABLED,
      },
      true,
    );
    const run = await runById(ctx, args.runId);
    const organizationId = await configuredOrganization(ctx);
    if (!run || run.organizationId !== organizationId || run.status !== "Active") {
      throw new Error("DEMO_RUN_NOT_ACTIVE");
    }
    const rawUserId = env.PHASE5_OPERATOR_USER_ID;
    if (!rawUserId) throw new Error("DEMO_OPERATOR_USER_NOT_CONFIGURED");
    const userId = rawUserId as Id<"users">;
    const user = await ctx.db.get(userId);
    if (!user || user.organizationId !== organizationId)
      throw new Error("DEMO_OPERATOR_NOT_AUTHORIZED");
    const existing = await ctx.db
      .query("demoFaults")
      .withIndex("by_runId_boundary", (q) =>
        q.eq("runId", run.runId).eq("boundary", CONTROLLED_FAULT_BOUNDARY),
      )
      .unique();
    if (existing?.status === "Consumed") throw new Error("DEMO_FAULT_ALREADY_CONSUMED");
    const now = Date.now();
    if (existing)
      await ctx.db.patch(existing._id, {
        status: "Armed",
        armedBy: userId,
        armedAt: now,
        consumedAt: undefined,
      });
    else
      await ctx.db.insert("demoFaults", {
        runId: run.runId,
        organizationId,
        boundary: CONTROLLED_FAULT_BOUNDARY,
        status: "Armed",
        armedBy: userId,
        armedAt: now,
      });
    await recordActivity(ctx, {
      organizationId,
      userId,
      actorKind: "user",
      eventType: "demo.fault_armed",
      outcome: "success",
      correlationId: `demo-fault:${run.runId}`,
      eventId: `demo.fault_armed:${run.runId}`,
      runId: run.runId,
      subjectId: run.runId,
      metadata: { faultPoint: CONTROLLED_FAULT_BOUNDARY },
      timestamp: now,
    });
    return { runId: run.runId, boundary: CONTROLLED_FAULT_BOUNDARY, status: "Armed" as const };
  },
});

export const reset = mutation({
  args: { boundaryKey: v.string(), operatorKey: v.string(), runId: v.string() },
  handler: async (ctx, args) => {
    assertPrivateDemoAccess(args.boundaryKey, args.operatorKey);
    const run = await runById(ctx, args.runId);
    const organizationId = await configuredOrganization(ctx);
    if (
      !run ||
      run.organizationId !== organizationId ||
      (run.status !== "Prepared" && run.status !== "Active")
    ) {
      throw new Error("DEMO_RUN_NOT_RESETTABLE");
    }
    const issuances = await ctx.db
      .query("issuances")
      .withIndex("by_organizationId_updatedAt", (q) => q.eq("organizationId", organizationId))
      .take(100);
    if (
      issuances.some(
        (issuance) =>
          issuance.runId === run.runId &&
          (issuance.status === "Pending" || issuance.status === "Submitted"),
      )
    ) {
      throw new Error("DEMO_RUN_ACTIVE_WORK");
    }
    const now = Date.now();
    const durationMs = now - run.startedAt;
    await ctx.db.patch(run._id, {
      status: "Failed",
      outcome: "Fail",
      completedAt: now,
      durationMs,
      recoveryScenario: "operator-reset",
    });
    const fault = await ctx.db
      .query("demoFaults")
      .withIndex("by_runId_boundary", (q) =>
        q.eq("runId", run.runId).eq("boundary", CONTROLLED_FAULT_BOUNDARY),
      )
      .unique();
    if (fault?.status === "Armed") await ctx.db.patch(fault._id, { status: "Cleared" });
    await recordActivity(ctx, {
      organizationId,
      actorKind: "system",
      eventType: "demo.run_completed",
      outcome: "failure",
      correlationId: `demo-reset:${run.runId}`,
      eventId: `demo.run_completed:${run.runId}`,
      runId: run.runId,
      subjectId: run.runId,
      metadata: {
        status: "Fail",
        durationMs,
        recoveryScenario: "operator-reset",
      },
      timestamp: now,
    });
    return { runId: run.runId, status: "Failed" as const, outcome: "Fail" as const };
  },
});

async function consumeFaultForRun(
  ctx: GenericMutationCtx<DataModel>,
  organizationId: Id<"organizations">,
  runId: string,
) {
  const env = environment();
  assertDemoTestnetEnvironment(
    {
      deploymentTier: env?.SORA_DEPLOYMENT_TIER,
      networkPassphrase: STELLAR_TESTNET_CONFIG.networkPassphrase,
      horizonUrl: STELLAR_TESTNET_CONFIG.horizonUrl,
      explorerUrl: STELLAR_TESTNET_CONFIG.explorerUrl,
      faultsEnabled: env?.PHASE5_FAULTS_ENABLED,
    },
    true,
  );
  assertControlledFault({
    boundary: CONTROLLED_FAULT_BOUNDARY,
    runId,
    organizationId,
    allowedRunId: runId,
    allowedOrganizationId: environment()?.PHASE5_DEMO_ORGANIZATION_ID ?? "",
  });
  const fault = await ctx.db
    .query("demoFaults")
    .withIndex("by_runId_boundary", (q) =>
      q.eq("runId", runId).eq("boundary", CONTROLLED_FAULT_BOUNDARY),
    )
    .unique();
  if (!fault || fault.organizationId !== organizationId || fault.status !== "Armed") return false;
  const now = Date.now();
  await ctx.db.patch(fault._id, { status: "Consumed", consumedAt: now });
  await recordActivity(ctx, {
    organizationId,
    actorKind: "system",
    eventType: "demo.fault_consumed",
    outcome: "success",
    correlationId: `demo-fault:${runId}`,
    eventId: `demo.fault_consumed:${runId}`,
    runId,
    subjectId: runId,
    metadata: { faultPoint: CONTROLLED_FAULT_BOUNDARY },
    timestamp: now,
  });
  return true;
}

export const consumeFault = internalMutation({
  args: { organizationId: v.id("organizations"), runId: v.string() },
  handler: async (ctx, args) => {
    return await consumeFaultForRun(ctx, args.organizationId, args.runId);
  },
});

export const consumePaymentFault = internalMutation({
  args: { hash: v.string(), fencingToken: v.int64() },
  handler: async (ctx, args) => {
    const attempt = await ctx.db
      .query("transactionAttempts")
      .withIndex("by_hash", (q) => q.eq("hash", args.hash))
      .unique();
    if (
      !attempt ||
      attempt.purpose !== "issuance-payment" ||
      attempt.fencingToken !== args.fencingToken
    ) {
      throw new Error("DEMO_PAYMENT_ATTEMPT_INVALID");
    }
    const issuance = await ctx.db
      .query("issuances")
      .withIndex("by_issuanceId", (q) => q.eq("issuanceId", attempt.issuanceId))
      .unique();
    if (!issuance?.runId || issuance.organizationId !== attempt.organizationId) {
      throw new Error("DEMO_PAYMENT_RUN_INVALID");
    }
    const run = await runById(ctx, issuance.runId);
    if (!run || run.organizationId !== issuance.organizationId || run.status !== "Active") {
      throw new Error("DEMO_RUN_NOT_ACTIVE");
    }
    return await consumeFaultForRun(ctx, issuance.organizationId, run.runId);
  },
});

function publicRun(run: DataModel["demoRuns"]["document"], replayed: boolean) {
  return {
    runId: run.runId,
    assetCode: run.assetCode,
    status: run.status,
    environment: run.environment,
    browserTarget: run.browserTarget,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    durationMs: run.durationMs,
    outcome: run.outcome,
    replayed,
  };
}
