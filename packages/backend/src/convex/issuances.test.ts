/// <reference types="vite/client" />

import aggregateTest from "@convex-dev/aggregate/test";
import { Keypair } from "@stellar/stellar-sdk";
import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";

import { api, internal } from "../../convex/_generated/api.js";
import schema from "../../convex/schema.js";

const modules = import.meta.glob("../../convex/**/*.ts");
const BOUNDARY = "test-boundary-secret";
const issuer = Keypair.random();
const distributor = Keypair.random();

function createTest() {
  const t = convexTest(schema, modules);
  aggregateTest.register(t, "assetLifecycleCounts");
  return t;
}

async function seedIdentity(t: ReturnType<typeof convexTest>, suffix: string) {
  return await t.run(async (ctx) => {
    const organizationId = await ctx.db.insert("organizations", {
      name: `Org ${suffix}`,
      createdAt: Date.now(),
    });
    const userId = await ctx.db.insert("users", {
      walletAddress: `G${suffix}`,
      organizationId,
      createdAt: Date.now(),
    });
    const tokenHash = `token-${suffix}`;
    await ctx.db.insert("sessions", {
      tokenHash,
      userId,
      organizationId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 60_000,
    });
    return { organizationId, userId, tokenHash };
  });
}

async function seedReadyAsset(
  t: ReturnType<typeof convexTest>,
  suffix: string,
  assetCode = "SORA1",
) {
  const identity = await seedIdentity(t, suffix);
  const created = await t.mutation(api.assets.create, {
    boundaryKey: BOUNDARY,
    sessionTokenHash: identity.tokenHash,
    createRequestId: `80000000-0000-4000-8000-${suffix.padStart(12, "0").slice(-12)}`,
    correlationId: `create-${suffix}`,
    input: {
      name: `Ready Asset ${suffix}`,
      category: "Energy",
      description: "A utility-scale renewable energy installation.",
      estimatedValue: "1000000",
      currency: "USD",
      countryCode: "PH",
      legalOwner: "Sora Energy Inc.",
      registrationNumber: `READY-${suffix}`,
      ownershipType: "Organization",
      contactEmail: `${suffix}@example.com`,
    },
  });
  const profile = await t.mutation(api.tokenization.updateProfile, {
    boundaryKey: BOUNDARY,
    sessionTokenHash: identity.tokenHash,
    assetId: created.asset.assetId as string,
    expectedAssetVersion: 1,
    correlationId: `profile-${suffix}`,
    profile: { assetCode, proposedSupply: "25", internalReference: `Deal ${suffix}` },
  });
  await t.run(async (ctx) => {
    const storageId = await ctx.storage.store(new Blob(["%PDF-1.7\nfixture"]));
    await ctx.db.insert("supportingDocuments", {
      documentId: `document-${suffix}`,
      organizationId: identity.organizationId,
      assetId: created.asset.assetId as string,
      storageId,
      filename: "evidence.pdf",
      mediaType: "application/pdf",
      byteSize: 16,
      sha256: "a".repeat(64),
      version: 1,
      state: "Active",
      createdAt: Date.now(),
      createdBy: identity.userId,
    });
  });
  const review = await t.mutation(api.tokenization.submitReview, {
    boundaryKey: BOUNDARY,
    sessionTokenHash: identity.tokenHash,
    assetId: created.asset.assetId as string,
    expectedAssetVersion: profile.assetVersion,
    correlationId: `review-${suffix}`,
  });
  const ready = await t.mutation(api.tokenization.approve, {
    boundaryKey: BOUNDARY,
    sessionTokenHash: identity.tokenHash,
    assetId: created.asset.assetId as string,
    expectedAssetVersion: review.assetVersion,
    correlationId: `approve-${suffix}`,
  });
  return { identity, assetId: created.asset.assetId as string, assetVersion: ready.assetVersion };
}

describe("durable Phase 4 claim", () => {
  beforeEach(() => {
    process.env.CONVEX_SERVER_BOUNDARY_KEY = BOUNDARY;
    process.env.STELLAR_TESTNET_ISSUER_PUBLIC_KEY = issuer.publicKey();
    process.env.STELLAR_TESTNET_DISTRIBUTOR_PUBLIC_KEY = distributor.publicKey();
  });

  it("claims once, snapshots the approved basis, and returns the same record for stale replay", async () => {
    const t = createTest();
    const ready = await seedReadyAsset(t, "000000000001");
    const first = await t.mutation(api.issuances.request, {
      boundaryKey: BOUNDARY,
      sessionTokenHash: ready.identity.tokenHash,
      assetId: ready.assetId,
      expectedAssetVersion: ready.assetVersion,
      correlationId: "issuance-request-1",
    });
    const replay = await t.mutation(api.issuances.request, {
      boundaryKey: BOUNDARY,
      sessionTokenHash: ready.identity.tokenHash,
      assetId: ready.assetId,
      expectedAssetVersion: 1,
      correlationId: "issuance-request-replay",
    });
    const snapshot = await t.query(api.issuances.get, {
      boundaryKey: BOUNDARY,
      sessionTokenHash: ready.identity.tokenHash,
      issuanceId: first.issuanceId,
    });
    const state = await t.run(async (ctx) => ({
      issuances: await ctx.db.query("issuances").collect(),
      identities: await ctx.db.query("managedAssetIdentities").collect(),
      assets: await ctx.db.query("assets").collect(),
    }));
    expect(first.claimed).toBe(true);
    expect(replay).toEqual({ issuanceId: first.issuanceId, claimed: false });
    expect(snapshot).toMatchObject({
      issuanceId: first.issuanceId,
      network: "Testnet",
      status: "Pending",
      supply: "25.0000000",
      issuerAccount: issuer.publicKey(),
      distributorAccount: distributor.publicKey(),
    });
    expect(state.issuances).toHaveLength(1);
    expect(state.identities).toHaveLength(1);
    expect(state.assets[0]?.lifecycle).toBe("Issuing");
  });

  it("does not disclose a known foreign issuance", async () => {
    const t = createTest();
    const ready = await seedReadyAsset(t, "000000000002", "SORA2");
    const foreign = await seedIdentity(t, "foreign");
    const claim = await t.mutation(api.issuances.request, {
      boundaryKey: BOUNDARY,
      sessionTokenHash: ready.identity.tokenHash,
      assetId: ready.assetId,
      expectedAssetVersion: ready.assetVersion,
      correlationId: "issuance-request-2",
    });
    await expect(
      t.query(api.issuances.get, {
        boundaryKey: BOUNDARY,
        sessionTokenHash: foreign.tokenHash,
        issuanceId: claim.issuanceId,
      }),
    ).rejects.toThrow("ISSUANCE_NOT_FOUND");
  });

  it("reserves the full managed identity globally across Organizations", async () => {
    const t = createTest();
    const first = await seedReadyAsset(t, "000000000003", "COLLIDE");
    const second = await seedReadyAsset(t, "000000000004", "COLLIDE");
    await t.mutation(api.issuances.request, {
      boundaryKey: BOUNDARY,
      sessionTokenHash: first.identity.tokenHash,
      assetId: first.assetId,
      expectedAssetVersion: first.assetVersion,
      correlationId: "issuance-request-3",
    });
    await expect(
      t.mutation(api.issuances.request, {
        boundaryKey: BOUNDARY,
        sessionTokenHash: second.identity.tokenHash,
        assetId: second.assetId,
        expectedAssetVersion: second.assetVersion,
        correlationId: "issuance-request-4",
      }),
    ).rejects.toThrow("MANAGED_ASSET_IDENTITY_CONFLICT");
  });

  it("gates payment on Trustline proof and atomically confirms payment, Active, and one event", async () => {
    const t = createTest();
    const ready = await seedReadyAsset(t, "000000000005", "ATOMIC");
    const claim = await t.mutation(api.issuances.request, {
      boundaryKey: BOUNDARY,
      sessionTokenHash: ready.identity.tokenHash,
      assetId: ready.assetId,
      expectedAssetVersion: ready.assetVersion,
      correlationId: "issuance-request-5",
    });
    const lock = await t.mutation(internal.issuances.acquireLock, {
      sourceAccount: issuer.publicKey(),
      holderId: "payment-worker",
    });
    expect(lock).not.toBeNull();
    const attempt = await t.mutation(internal.issuances.prepareAttempt, {
      issuanceId: claim.issuanceId,
      purpose: "issuance-payment",
      attemptNumber: 1,
      sourceAccount: issuer.publicKey(),
      sequence: "2",
      baseFee: "100",
      minTime: 1_000,
      maxTime: 1_300,
      hash: "b".repeat(64),
      fencingToken: lock!.fencingToken,
    });
    await expect(
      t.mutation(internal.issuances.confirmPayment, {
        hash: attempt.hash,
        fencingToken: lock!.fencingToken,
        ledger: 100,
        ledgerCloseTime: 1_100,
        confirmedAt: 1_100_000,
      }),
    ).rejects.toThrow("TRUSTLINE_NOT_CONFIRMED");
    await t.mutation(internal.issuances.confirmTrustline, {
      issuanceId: claim.issuanceId,
      proofType: "verified-existing",
      ledger: 99,
      checkedAt: 1_000_000,
      limit: "25.0000000",
    });
    const confirmed = await t.mutation(internal.issuances.confirmPayment, {
      hash: attempt.hash,
      fencingToken: lock!.fencingToken,
      ledger: 100,
      ledgerCloseTime: 1_100,
      confirmedAt: 1_100_000,
    });
    const replay = await t.mutation(internal.issuances.confirmPayment, {
      hash: attempt.hash,
      fencingToken: lock!.fencingToken,
      ledger: 100,
      ledgerCloseTime: 1_100,
      confirmedAt: 1_100_000,
    });
    const state = await t.run(async (ctx) => ({
      issuance: await ctx.db
        .query("issuances")
        .withIndex("by_issuanceId", (q) => q.eq("issuanceId", claim.issuanceId))
        .unique(),
      asset: await ctx.db
        .query("assets")
        .withIndex("by_organizationId_assetId", (q) =>
          q.eq("organizationId", ready.identity.organizationId).eq("assetId", ready.assetId),
        )
        .unique(),
      events: await ctx.db.query("activityEvents").collect(),
    }));
    expect(confirmed).toEqual({ confirmed: true, replayed: false });
    expect(replay).toEqual({ confirmed: true, replayed: true });
    expect(state.issuance).toMatchObject({ status: "Confirmed", paymentHash: attempt.hash });
    expect(state.asset?.lifecycle).toBe("Active");
    expect(state.events.filter((event) => event.eventType === "issuance.confirmed")).toHaveLength(
      1,
    );
  });

  it("rejects a stale worker fence immediately before submission", async () => {
    const t = createTest();
    const ready = await seedReadyAsset(t, "000000000006", "FENCE");
    const claim = await t.mutation(api.issuances.request, {
      boundaryKey: BOUNDARY,
      sessionTokenHash: ready.identity.tokenHash,
      assetId: ready.assetId,
      expectedAssetVersion: ready.assetVersion,
      correlationId: "issuance-request-6",
    });
    const firstLock = await t.mutation(internal.issuances.acquireLock, {
      sourceAccount: distributor.publicKey(),
      holderId: "old-worker",
    });
    const attempt = await t.mutation(internal.issuances.prepareAttempt, {
      issuanceId: claim.issuanceId,
      purpose: "trustline",
      attemptNumber: 1,
      sourceAccount: distributor.publicKey(),
      sequence: "2",
      baseFee: "100",
      minTime: 1_000,
      maxTime: 1_300,
      hash: "c".repeat(64),
      fencingToken: firstLock!.fencingToken,
    });
    await t.run(async (ctx) => {
      const row = await ctx.db
        .query("accountLocks")
        .withIndex("by_network_sourceAccount", (q) =>
          q.eq("network", "Testnet").eq("sourceAccount", distributor.publicKey()),
        )
        .unique();
      await ctx.db.patch(row!._id, { leaseExpiresAt: 0 });
    });
    await t.mutation(internal.issuances.acquireLock, {
      sourceAccount: distributor.publicKey(),
      holderId: "new-worker",
    });
    await expect(
      t.query(internal.issuances.authorizeSubmission, {
        hash: attempt.hash,
        fencingToken: firstLock!.fencingToken,
      }),
    ).rejects.toThrow("STALE_FENCING_TOKEN");
  });
});
