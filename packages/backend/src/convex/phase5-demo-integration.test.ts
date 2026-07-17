/// <reference types="vite/client" />

import aggregateTest from "@convex-dev/aggregate/test";
import { Keypair } from "@stellar/stellar-sdk";
import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";

import { api, internal } from "../../convex/_generated/api.js";
import { assetLifecycleCounts } from "../../convex/assetAggregates.js";
import schema from "../../convex/schema.js";

const modules = import.meta.glob("../../convex/**/*.ts");
const BOUNDARY = "phase5-demo-boundary";
const issuer = Keypair.random();
const distributor = Keypair.random();
const ASSET_CODE = "S5A1B2C3D4E5";

function createTest() {
  const t = convexTest(schema, modules);
  aggregateTest.register(t, "assetLifecycleCounts");
  return t;
}

async function seedIdentity(t: ReturnType<typeof convexTest>, suffix: string) {
  return await t.run(async (ctx) => {
    const organizationId = await ctx.db.insert("organizations", {
      name: `Demo ${suffix}`,
      createdAt: Date.now(),
    });
    const userId = await ctx.db.insert("users", {
      walletAddress: Keypair.random().publicKey(),
      organizationId,
      createdAt: Date.now(),
    });
    const tokenHash = `demo-token-${suffix}`;
    await ctx.db.insert("sessions", {
      tokenHash,
      userId,
      organizationId,
      expiresAt: Date.now() + 60_000,
      createdAt: Date.now(),
    });
    return { organizationId, userId, tokenHash };
  });
}

async function insertRun(
  t: ReturnType<typeof convexTest>,
  identity: Awaited<ReturnType<typeof seedIdentity>>,
  status: "Prepared" | "Active",
) {
  return await t.run(async (ctx) => {
    const runId = crypto.randomUUID();
    await ctx.db.insert("demoRuns", {
      runId,
      requestId: crypto.randomUUID(),
      organizationId: identity.organizationId,
      assetCode: ASSET_CODE,
      assetCodeNonce: 0,
      status,
      environment: "demo-testnet",
      browserTarget: "chromium-freighter",
      startedAt: Date.now(),
      outcome: "Not Executed",
    });
    return runId;
  });
}

const assetInput = {
  name: "Phase 5 Solar",
  category: "Energy" as const,
  description: "Formal Phase 5 demo asset.",
  estimatedValue: "1000000",
  currency: "USD" as const,
  countryCode: "PH",
  legalOwner: "Sora Demo Inc.",
  registrationNumber: "PHASE5-DEMO-1",
  ownershipType: "Organization" as const,
  contactEmail: "demo@example.test",
};

describe("Phase 5 demo authority integration", () => {
  beforeEach(() => {
    process.env.CONVEX_SERVER_BOUNDARY_KEY = BOUNDARY;
    process.env.STELLAR_TESTNET_ISSUER_PUBLIC_KEY = issuer.publicKey();
    process.env.STELLAR_TESTNET_DISTRIBUTOR_PUBLIC_KEY = distributor.publicKey();
    process.env.SORA_DEPLOYMENT_TIER = "demo-testnet";
    process.env.PHASE5_FAULTS_ENABLED = "true";
  });

  it("prepares idempotently, enforces one active run, and preserves prior run records", async () => {
    const t = createTest();
    const identity = await seedIdentity(t, "prepare");
    process.env.PHASE5_OPERATOR_KEY = "operator-key";
    process.env.PHASE5_DEMO_ORGANIZATION_ID = identity.organizationId;
    const request = {
      boundaryKey: BOUNDARY,
      operatorKey: "operator-key",
      requestId: crypto.randomUUID(),
      browserTarget: "chromium-freighter",
    };
    const prepared = await t.mutation(api.demo.prepare, request);
    expect(prepared).toMatchObject({ status: "Prepared", replayed: false });
    expect(await t.mutation(api.demo.prepare, request)).toMatchObject({
      runId: prepared.runId,
      replayed: true,
    });
    await expect(
      t.mutation(api.demo.prepare, { ...request, requestId: crypto.randomUUID() }),
    ).rejects.toThrow("DEMO_RUN_ALREADY_ACTIVE");

    await t.run(async (ctx) => {
      const issuanceId = "prior-ledger-effect";
      const assetId = crypto.randomUUID();
      const paymentHash = "b".repeat(64);
      await ctx.db.insert("issuances", {
        issuanceId,
        organizationId: identity.organizationId,
        assetId,
        network: "Testnet",
        status: "Confirmed",
        assetVersion: 4,
        manifestId: crypto.randomUUID(),
        manifestFingerprint: "f".repeat(64),
        profileId: crypto.randomUUID(),
        profileVersion: 1,
        assetCode: ASSET_CODE,
        supplyUnits: 250_000_000n,
        supply: "25.0000000",
        internalReference: "Preserved proof",
        issuerAccount: issuer.publicKey(),
        distributorAccount: distributor.publicKey(),
        trustlineState: "Confirmed",
        paymentState: "Confirmed",
        paymentHash,
        paymentLedger: 123,
        createdBy: identity.userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        confirmedAt: Date.now(),
        runId: prepared.runId,
      });
      await ctx.db.insert("transactionAttempts", {
        issuanceId,
        organizationId: identity.organizationId,
        purpose: "issuance-payment",
        attemptNumber: 1,
        state: "Confirmed",
        network: "Testnet",
        sourceAccount: issuer.publicKey(),
        sequence: "2",
        baseFee: "100",
        minTime: 1_000,
        maxTime: 1_300,
        assetCode: ASSET_CODE,
        issuerAccount: issuer.publicKey(),
        distributorAccount: distributor.publicKey(),
        amount: "25.0000000",
        hash: paymentHash,
        confirmedAt: Date.now(),
        ledger: 123,
        fencingToken: 1n,
        retryCount: 0,
        createdAt: Date.now(),
      });
      await ctx.db.insert("ownershipSnapshots", {
        snapshotId: crypto.randomUUID(),
        attemptId: crypto.randomUUID(),
        organizationId: identity.organizationId,
        assetId,
        issuanceId,
        network: "Testnet",
        assetCode: ASSET_CODE,
        issuerAccount: issuer.publicKey(),
        confirmedSupply: "25.0000000",
        observedSupply: "25.0000000",
        holderCount: 1,
        holdersHash: "c".repeat(64),
        firstLedger: 123,
        lastLedger: 123,
        synchronizedAt: Date.now(),
        pinned: true,
        runId: prepared.runId,
      });
      await ctx.db.insert("reconciliationEvidence", {
        issuanceId,
        organizationId: identity.organizationId,
        purpose: "issuance-payment",
        attemptNumber: 1,
        checkedAt: Date.now(),
        hashResult: "Found",
        expectedSequence: "1",
        outcome: "Confirmed",
        correlationId: "prior-evidence",
      });
      await ctx.db.insert("demoFaults", {
        runId: prepared.runId,
        organizationId: identity.organizationId,
        boundary: "after-submit-before-result-persist",
        status: "Armed",
        armedBy: identity.userId,
        armedAt: Date.now(),
      });
    });
    expect(
      await t.mutation(api.demo.reset, {
        boundaryKey: BOUNDARY,
        operatorKey: "operator-key",
        runId: prepared.runId,
      }),
    ).toMatchObject({ status: "Failed", outcome: "Fail" });
    const next = await t.mutation(api.demo.prepare, {
      ...request,
      requestId: crypto.randomUUID(),
    });
    const persisted = await t.run(async (ctx) => ({
      runs: await ctx.db.query("demoRuns").collect(),
      evidence: await ctx.db.query("reconciliationEvidence").collect(),
      faults: await ctx.db.query("demoFaults").collect(),
      issuances: await ctx.db.query("issuances").collect(),
      attempts: await ctx.db.query("transactionAttempts").collect(),
      snapshots: await ctx.db.query("ownershipSnapshots").collect(),
      events: await ctx.db.query("activityEvents").collect(),
    }));
    expect(next.runId).not.toBe(prepared.runId);
    expect(persisted.runs).toHaveLength(2);
    expect(persisted.evidence).toHaveLength(1);
    expect(persisted.faults).toEqual([expect.objectContaining({ status: "Cleared" })]);
    expect(persisted.issuances).toEqual([expect.objectContaining({ status: "Confirmed" })]);
    expect(persisted.attempts).toEqual([expect.objectContaining({ state: "Confirmed" })]);
    expect(persisted.snapshots).toEqual([expect.objectContaining({ pinned: true })]);
    expect(persisted.events.map((event) => event.eventType)).toEqual([
      "demo.run_prepared",
      "demo.run_completed",
      "demo.run_prepared",
    ]);
  });

  it("rejects missing authorization, wrong deployment, and foreign Organization access", async () => {
    const t = createTest();
    const configured = await seedIdentity(t, "configured-org");
    const foreign = await seedIdentity(t, "foreign-org");
    process.env.PHASE5_DEMO_ORGANIZATION_ID = configured.organizationId;
    delete process.env.PHASE5_OPERATOR_KEY;
    await expect(
      t.mutation(api.demo.prepare, {
        boundaryKey: BOUNDARY,
        operatorKey: "operator-key",
        requestId: crypto.randomUUID(),
        browserTarget: "chromium-freighter",
      }),
    ).rejects.toThrow("Unauthorized: Invalid Phase 5 operator");

    process.env.PHASE5_OPERATOR_KEY = "operator-key";
    process.env.SORA_DEPLOYMENT_TIER = "production";
    await expect(
      t.mutation(api.demo.prepare, {
        boundaryKey: BOUNDARY,
        operatorKey: "operator-key",
        requestId: crypto.randomUUID(),
        browserTarget: "chromium-freighter",
      }),
    ).rejects.toThrow("DEMO_ENVIRONMENT_REJECTED");

    process.env.SORA_DEPLOYMENT_TIER = "demo-testnet";
    const foreignRunId = await insertRun(t, foreign, "Prepared");
    await expect(
      t.query(api.demo.get, {
        boundaryKey: BOUNDARY,
        operatorKey: "operator-key",
        runId: foreignRunId,
      }),
    ).rejects.toThrow("DEMO_RUN_NOT_FOUND");
  });

  it("serializes concurrent prepare and keeps one run identity and preparation event", async () => {
    const t = createTest();
    const identity = await seedIdentity(t, "concurrent-prepare");
    process.env.PHASE5_OPERATOR_KEY = "operator-key";
    process.env.PHASE5_DEMO_ORGANIZATION_ID = identity.organizationId;
    const request = {
      boundaryKey: BOUNDARY,
      operatorKey: "operator-key",
      requestId: crypto.randomUUID(),
      browserTarget: "chromium-freighter",
    };
    const [first, second] = await Promise.all([
      t.mutation(api.demo.prepare, request),
      t.mutation(api.demo.prepare, request),
    ]);
    expect(second.runId).toBe(first.runId);
    const state = await t.run(async (ctx) => ({
      runs: await ctx.db.query("demoRuns").collect(),
      events: await ctx.db
        .query("activityEvents")
        .withIndex("by_organizationId_runId_timestamp", (q) =>
          q.eq("organizationId", identity.organizationId).eq("runId", first.runId),
        )
        .collect(),
    }));
    expect(state.runs).toHaveLength(1);
    expect(state.events.filter((event) => event.eventType === "demo.run_prepared")).toHaveLength(1);
  });

  it("persists sanitized preflight results and emits successful completion once", async () => {
    const t = createTest();
    const identity = await seedIdentity(t, "preflight-repeat");
    const runId = await insertRun(t, identity, "Prepared");
    const checks = [{ check: "Worker health", status: "Pass" as const }];
    await t.mutation(internal.demo.recordPreflight, {
      runId,
      correlationId: "preflight-1",
      checks,
    });
    await t.mutation(internal.demo.recordPreflight, {
      runId,
      correlationId: "preflight-2",
      checks,
    });
    const state = await t.run(async (ctx) => ({
      run: await ctx.db.query("demoRuns").first(),
      checks: await ctx.db.query("demoPreflightChecks").collect(),
      events: await ctx.db.query("activityEvents").collect(),
    }));
    expect(state.run?.status).toBe("Active");
    expect(state.checks).toEqual([
      expect.objectContaining({ check: "Worker health", correlationId: "preflight-2" }),
    ]);
    expect(
      state.events.filter(
        (event) => event.eventType === "demo.preflight_completed" && event.outcome === "success",
      ),
    ).toHaveLength(1);
  });

  it("refuses reset while issuance work is active without changing the run", async () => {
    const t = createTest();
    const identity = await seedIdentity(t, "reset-active-work");
    const runId = await insertRun(t, identity, "Active");
    process.env.PHASE5_OPERATOR_KEY = "operator-key";
    process.env.PHASE5_DEMO_ORGANIZATION_ID = identity.organizationId;
    await t.run(async (ctx) => {
      await ctx.db.insert("issuances", {
        issuanceId: crypto.randomUUID(),
        organizationId: identity.organizationId,
        assetId: crypto.randomUUID(),
        network: "Testnet",
        status: "Submitted",
        assetVersion: 4,
        manifestId: crypto.randomUUID(),
        manifestFingerprint: "f".repeat(64),
        profileId: crypto.randomUUID(),
        profileVersion: 1,
        assetCode: ASSET_CODE,
        supplyUnits: 250_000_000n,
        supply: "25.0000000",
        internalReference: "Active reset guard",
        issuerAccount: issuer.publicKey(),
        distributorAccount: distributor.publicKey(),
        trustlineState: "Confirmed",
        paymentState: "Submitted",
        createdBy: identity.userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        runId,
      });
    });
    await expect(
      t.mutation(api.demo.reset, {
        boundaryKey: BOUNDARY,
        operatorKey: "operator-key",
        runId,
      }),
    ).rejects.toThrow("DEMO_RUN_ACTIVE_WORK");
    const state = await t.run(async (ctx) => ({
      run: await ctx.db.query("demoRuns").first(),
      issuance: await ctx.db.query("issuances").first(),
    }));
    expect(state.run).toMatchObject({ runId, status: "Active", outcome: "Not Executed" });
    expect(state.issuance).toMatchObject({ status: "Submitted", runId });
  });

  it("associates asset creation with the server-side run and enforces its prepared code", async () => {
    const t = createTest();
    const identity = await seedIdentity(t, "asset");
    const runId = await insertRun(t, identity, "Prepared");
    const created = await t.mutation(api.assets.create, {
      boundaryKey: BOUNDARY,
      sessionTokenHash: identity.tokenHash,
      createRequestId: crypto.randomUUID(),
      correlationId: "demo-asset-create",
      input: assetInput,
    });
    expect(created.asset.runId).toBe(runId);
    await expect(
      t.mutation(api.assets.create, {
        boundaryKey: BOUNDARY,
        sessionTokenHash: identity.tokenHash,
        createRequestId: crypto.randomUUID(),
        correlationId: "demo-second-asset",
        input: { ...assetInput, name: "Second", registrationNumber: "PHASE5-DEMO-2" },
      }),
    ).rejects.toThrow("DEMO_RUN_ASSET_ALREADY_EXISTS");
    await expect(
      t.mutation(api.tokenization.updateProfile, {
        boundaryKey: BOUNDARY,
        sessionTokenHash: identity.tokenHash,
        assetId: created.asset.assetId as string,
        expectedAssetVersion: 1,
        correlationId: "wrong-demo-code",
        profile: { assetCode: "WRONG", proposedSupply: "25", internalReference: "Demo" },
      }),
    ).rejects.toThrow("DEMO_ASSET_CODE_MISMATCH");
    await t.mutation(api.tokenization.updateProfile, {
      boundaryKey: BOUNDARY,
      sessionTokenHash: identity.tokenHash,
      assetId: created.asset.assetId as string,
      expectedAssetVersion: 1,
      correlationId: "correct-demo-code",
      profile: { assetCode: ASSET_CODE, proposedSupply: "25", internalReference: "Demo" },
    });
    const state = await t.run(async (ctx) => ({
      asset: await ctx.db.query("assets").first(),
      events: await ctx.db.query("activityEvents").collect(),
    }));
    expect(state.asset?.runId).toBe(runId);
    expect(state.events).toEqual([
      expect.objectContaining({
        eventType: "asset.created",
        actorKind: "user",
        subjectType: "asset",
        runId,
        metadata: '{"lifecycle":"Draft"}',
      }),
      expect.objectContaining({
        eventType: "asset.token_proposal_updated",
        runId,
        metadata: `{"assetCode":"${ASSET_CODE}","network":"Testnet"}`,
      }),
    ]);
  });

  it("derives issuance authority from the Active run and rejects a mismatched profile code", async () => {
    const t = createTest();
    const identity = await seedIdentity(t, "issuance");
    const runId = await insertRun(t, identity, "Active");
    const seeded = await t.run(async (ctx) => {
      const assetId = crypto.randomUUID();
      const manifestId = crypto.randomUUID();
      const fingerprint = "f".repeat(64);
      const manifestDocumentId = await ctx.db.insert("reviewManifests", {
        manifestId,
        organizationId: identity.organizationId,
        assetId,
        assetVersion: 4,
        profileId: "profile-demo",
        profileVersion: 1,
        checklistVersion: 1,
        canonicalManifest: "{}",
        fingerprint,
        submittedBy: identity.userId,
        submittedAt: Date.now(),
      });
      const assetDocumentId = await ctx.db.insert("assets", {
        ...assetInput,
        assetId,
        organizationId: identity.organizationId,
        createdBy: identity.userId,
        normalizedName: "phase 5 solar",
        normalizedRegistrationNumber: "phase5-demo-issuance",
        registrationNumber: "PHASE5-DEMO-ISSUANCE",
        lifecycle: "Ready",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 4,
        createRequestId: crypto.randomUUID(),
        createFingerprint: "fixture",
        readyAt: Date.now(),
        reviewManifestId: manifestDocumentId,
        approvedManifestFingerprint: fingerprint,
        runId,
      });
      await assetLifecycleCounts.insertIfDoesNotExist(ctx, (await ctx.db.get(assetDocumentId))!);
      const profileDocumentId = await ctx.db.insert("tokenizationProfiles", {
        profileId: "profile-demo",
        organizationId: identity.organizationId,
        assetId,
        assetCode: "WRONG",
        supplyUnits: 250_000_000n,
        supply: "25.0000000",
        internalReference: "Demo",
        network: "Testnet",
        version: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        updatedBy: identity.userId,
      });
      return { assetId, profileDocumentId };
    });
    const request = {
      boundaryKey: BOUNDARY,
      sessionTokenHash: identity.tokenHash,
      assetId: seeded.assetId,
      expectedAssetVersion: 4,
      correlationId: "demo-issuance",
    };
    await expect(t.mutation(api.issuances.request, request)).rejects.toThrow(
      "DEMO_ASSET_CODE_MISMATCH",
    );
    await t.run(async (ctx) => {
      await ctx.db.patch(seeded.profileDocumentId, { assetCode: ASSET_CODE });
    });
    const claim = await t.mutation(api.issuances.request, request);
    const state = await t.run(async (ctx) => ({
      issuance: await ctx.db
        .query("issuances")
        .withIndex("by_issuanceId", (q) => q.eq("issuanceId", claim.issuanceId))
        .unique(),
      event: await ctx.db
        .query("activityEvents")
        .withIndex("by_organizationId_runId_timestamp", (q) =>
          q.eq("organizationId", identity.organizationId).eq("runId", runId),
        )
        .order("desc")
        .first(),
    }));
    expect(state.issuance).toMatchObject({ runId, assetCode: ASSET_CODE, status: "Pending" });
    expect(state.event).toMatchObject({ eventType: "issuance.requested", runId });
  });

  it("consumes the payment fault from durable attempt identity and enters reconciliation once", async () => {
    const t = createTest();
    const identity = await seedIdentity(t, "fault");
    const runId = await insertRun(t, identity, "Active");
    process.env.PHASE5_DEMO_ORGANIZATION_ID = identity.organizationId;
    const seeded = await t.run(async (ctx) => {
      const issuanceId = crypto.randomUUID();
      await ctx.db.insert("issuances", {
        issuanceId,
        organizationId: identity.organizationId,
        assetId: crypto.randomUUID(),
        network: "Testnet",
        status: "Pending",
        assetVersion: 4,
        manifestId: crypto.randomUUID(),
        manifestFingerprint: "f".repeat(64),
        profileId: crypto.randomUUID(),
        profileVersion: 1,
        assetCode: ASSET_CODE,
        supplyUnits: 250_000_000n,
        supply: "25.0000000",
        internalReference: "Fault demo",
        issuerAccount: issuer.publicKey(),
        distributorAccount: distributor.publicKey(),
        trustlineState: "Confirmed",
        paymentState: "Pending",
        createdBy: identity.userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        runId,
      });
      const hash = "a".repeat(64);
      const fencingToken = 7n;
      await ctx.db.insert("transactionAttempts", {
        issuanceId,
        organizationId: identity.organizationId,
        purpose: "issuance-payment",
        attemptNumber: 1,
        state: "Prepared",
        network: "Testnet",
        sourceAccount: issuer.publicKey(),
        sequence: "2",
        baseFee: "100",
        minTime: 1_000,
        maxTime: 1_300,
        assetCode: ASSET_CODE,
        issuerAccount: issuer.publicKey(),
        distributorAccount: distributor.publicKey(),
        amount: "25.0000000",
        hash,
        fencingToken,
        retryCount: 0,
        createdAt: Date.now(),
      });
      await ctx.db.insert("demoFaults", {
        runId,
        organizationId: identity.organizationId,
        boundary: "after-submit-before-result-persist",
        status: "Armed",
        armedBy: identity.userId,
        armedAt: Date.now(),
      });
      return { issuanceId, hash, fencingToken };
    });
    expect(
      await t.mutation(internal.demo.consumePaymentFault, {
        hash: seeded.hash,
        fencingToken: seeded.fencingToken,
      }),
    ).toBe(true);
    expect(
      await t.mutation(internal.demo.consumePaymentFault, {
        hash: seeded.hash,
        fencingToken: seeded.fencingToken,
      }),
    ).toBe(false);
    await t.mutation(internal.issuances.recordReconciliation, {
      hash: seeded.hash,
      fencingToken: seeded.fencingToken,
      checkedAt: Date.now(),
      hashResult: "Unavailable",
      outcome: "Unresolved",
      correlationId: crypto.randomUUID(),
    });
    await t.mutation(internal.issuances.scheduleRetry, {
      hash: seeded.hash,
      fencingToken: seeded.fencingToken,
    });
    const state = await t.run(async (ctx) => ({
      issuances: await ctx.db.query("issuances").collect(),
      attempt: await ctx.db.query("transactionAttempts").first(),
      fault: await ctx.db.query("demoFaults").first(),
      evidence: await ctx.db.query("reconciliationEvidence").collect(),
      events: await ctx.db.query("activityEvents").collect(),
    }));
    expect(state.issuances).toHaveLength(1);
    expect(state.issuances[0]).toMatchObject({
      issuanceId: seeded.issuanceId,
      paymentState: "Reconciling",
    });
    expect(state.attempt).toMatchObject({ state: "Reconciling", retryCount: 1 });
    expect(state.fault?.status).toBe("Consumed");
    expect(state.evidence).toHaveLength(1);
    expect(state.events.filter((event) => event.eventType === "demo.fault_consumed")).toHaveLength(
      1,
    );
    expect(state.attempt).not.toHaveProperty("signedXdr");
  });
});
