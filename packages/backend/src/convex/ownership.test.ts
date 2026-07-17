/// <reference types="vite/client" />

import { Keypair } from "@stellar/stellar-sdk";
import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";

import { api, internal } from "../../convex/_generated/api.js";
import schema from "../../convex/schema.js";
import { canonicalHolderLine } from "../domain/ownership.js";
import { sha256Hex } from "../domain/tokenization.js";

const modules = import.meta.glob("../../convex/**/*.ts");
const BOUNDARY = "ownership-test-boundary";
const issuer = Keypair.random().publicKey();
const distributor = Keypair.random().publicKey();

function createTest() {
  return convexTest(schema, modules);
}

async function seedConfirmed(
  t: ReturnType<typeof convexTest>,
  suffix: string,
  supply = "3.0000000",
) {
  return await t.run(async (ctx) => {
    const organizationId = await ctx.db.insert("organizations", {
      name: `Ownership Org ${suffix}`,
      createdAt: Date.now(),
    });
    const userId = await ctx.db.insert("users", {
      walletAddress: Keypair.random().publicKey(),
      organizationId,
      createdAt: Date.now(),
    });
    const tokenHash = `ownership-token-${suffix}`;
    await ctx.db.insert("sessions", {
      tokenHash,
      userId,
      organizationId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 60_000,
    });
    const assetId = crypto.randomUUID();
    await ctx.db.insert("assets", {
      assetId,
      organizationId,
      createdBy: userId,
      name: `Ownership Asset ${suffix}`,
      normalizedName: `ownership asset ${suffix}`,
      category: "Energy",
      description: "Confirmed ownership fixture",
      estimatedValue: "1000.00",
      currency: "USD",
      countryCode: "PH",
      legalOwner: "Fixture Owner",
      registrationNumber: `OWN-${suffix}`,
      normalizedRegistrationNumber: `own-${suffix}`,
      ownershipType: "Organization",
      contactEmail: "owner@example.test",
      lifecycle: "Active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 5,
      createRequestId: crypto.randomUUID(),
      createFingerprint: "fixture",
    });
    const issuanceId = crypto.randomUUID();
    await ctx.db.insert("issuances", {
      issuanceId,
      organizationId,
      assetId,
      network: "Testnet",
      status: "Confirmed",
      assetVersion: 4,
      manifestId: crypto.randomUUID(),
      manifestFingerprint: "f".repeat(64),
      profileId: crypto.randomUUID(),
      profileVersion: 1,
      assetCode: "SORA5",
      supplyUnits: BigInt(supply.replace(".", "")),
      supply,
      internalReference: `Run ${suffix}`,
      issuerAccount: issuer,
      distributorAccount: distributor,
      trustlineState: "Confirmed",
      paymentState: "Confirmed",
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      confirmedAt: Date.now(),
    });
    return { organizationId, userId, tokenHash, assetId, issuanceId };
  });
}

async function createAttempt(
  t: ReturnType<typeof convexTest>,
  seed: Awaited<ReturnType<typeof seedConfirmed>>,
  suffix: string,
) {
  const attemptId = crypto.randomUUID();
  await t.run(async (ctx) => {
    await ctx.db.insert("ownershipSyncAttempts", {
      attemptId,
      requestId: `request-${suffix}`,
      organizationId: seed.organizationId,
      assetId: seed.assetId,
      issuanceId: seed.issuanceId,
      reason: "manual",
      state: "Queued",
      pageCount: 0,
      holderCount: 0,
      observedUnits: 0n,
      startedAt: Date.now(),
      updatedAt: Date.now(),
    });
  });
  return attemptId;
}

async function publish(
  t: ReturnType<typeof convexTest>,
  seed: Awaited<ReturnType<typeof seedConfirmed>>,
  suffix: string,
) {
  const accounts = [Keypair.random().publicKey(), Keypair.random().publicKey()].sort();
  const holders = [
    { account: accounts[0]!, balance: "1.0000000", balanceUnits: 10_000_000n, ledger: 100 },
    { account: accounts[1]!, balance: "2.0000000", balanceUnits: 20_000_000n, ledger: 101 },
  ];
  const attemptId = await createAttempt(t, seed, suffix);
  const begun = await t.mutation(internal.ownership.beginAttempt, {
    attemptId,
    holderId: `worker-${suffix}`,
  });
  if (!begun || begun.busy) throw new Error("fixture lease not acquired");
  await t.mutation(internal.ownership.stagePage, {
    attemptId,
    fencingToken: begun.fencingToken,
    pageNumber: 1,
    holders,
  });
  const holdersHash = await sha256Hex(holders.map(canonicalHolderLine).join(""));
  const result = await t.mutation(internal.ownership.completeAttempt, {
    attemptId,
    fencingToken: begun.fencingToken,
    pageCount: 1,
    holderCount: 2,
    observedUnits: 30_000_000n,
    holdersHash,
    firstLedger: 100,
    lastLedger: 101,
  });
  return { ...result, attemptId, accounts, holdersHash };
}

describe("atomic ownership publication", () => {
  beforeEach(() => {
    process.env.CONVEX_SERVER_BOUNDARY_KEY = BOUNDARY;
  });

  it("publishes only a count/hash/supply-verified corpus and paginates exact strings", async () => {
    const t = createTest();
    const seeded = await seedConfirmed(t, "publish");
    const published = await publish(t, seeded, "publish");
    const first = await t.query(api.ownership.get, {
      boundaryKey: BOUNDARY,
      sessionTokenHash: seeded.tokenHash,
      assetId: seeded.assetId,
      limit: 1,
    });
    const second = await t.query(api.ownership.get, {
      boundaryKey: BOUNDARY,
      sessionTokenHash: seeded.tokenHash,
      assetId: seeded.assetId,
      limit: 1,
      cursor: first.holders.nextCursor!,
    });
    const state = await t.run(async (ctx) => ({
      issuance: await ctx.db
        .query("issuances")
        .withIndex("by_issuanceId", (q) => q.eq("issuanceId", seeded.issuanceId))
        .unique(),
      snapshots: await ctx.db.query("ownershipSnapshots").collect(),
      events: await ctx.db.query("activityEvents").collect(),
    }));
    expect(first.snapshot).toMatchObject({
      snapshotId: published.snapshotId,
      confirmedSupply: "3.0000000",
      observedSupply: "3.0000000",
      holderCount: 2,
      holdersHash: published.holdersHash,
    });
    expect([...first.holders.items, ...second.holders.items]).toEqual([
      { account: published.accounts[0], balance: "1.0000000", share: "33.3333", ledger: 100 },
      { account: published.accounts[1], balance: "2.0000000", share: "66.6667", ledger: 101 },
    ]);
    expect(state.issuance?.currentOwnershipSnapshotId).toBe(state.snapshots[0]?._id);
    expect(state.events.map((event) => event.eventType)).toEqual(["ownership.proof_published"]);
  });

  it("supports normalized indexed prefix search without disclosing foreign Organizations", async () => {
    const t = createTest();
    const owner = await seedConfirmed(t, "owner");
    const foreign = await seedConfirmed(t, "foreign");
    const published = await publish(t, owner, "search");
    const found = await t.query(api.ownership.get, {
      boundaryKey: BOUNDARY,
      sessionTokenHash: owner.tokenHash,
      assetId: owner.assetId,
      q: published.accounts[0]!.slice(0, 20).toLowerCase(),
    });
    expect(found.holders.items.map((holder) => holder.account)).toEqual([published.accounts[0]]);
    await expect(
      t.query(api.ownership.get, {
        boundaryKey: BOUNDARY,
        sessionTokenHash: foreign.tokenHash,
        assetId: owner.assetId,
      }),
    ).rejects.toThrow("ASSET_NOT_FOUND");
  });

  it("retains the last good pointer when a later corpus mismatches confirmed supply", async () => {
    const t = createTest();
    const seeded = await seedConfirmed(t, "mismatch");
    const good = await publish(t, seeded, "good");
    const attemptId = await createAttempt(t, seeded, "bad");
    const begun = await t.mutation(internal.ownership.beginAttempt, {
      attemptId,
      holderId: "bad-worker",
    });
    if (!begun || begun.busy) throw new Error("fixture lease not acquired");
    const holder = {
      account: Keypair.random().publicKey(),
      balance: "2.0000000",
      balanceUnits: 20_000_000n,
      ledger: 102,
    };
    await t.mutation(internal.ownership.stagePage, {
      attemptId,
      fencingToken: begun.fencingToken,
      pageNumber: 1,
      holders: [holder],
    });
    await expect(
      t.mutation(internal.ownership.completeAttempt, {
        attemptId,
        fencingToken: begun.fencingToken,
        pageCount: 1,
        holderCount: 1,
        observedUnits: 20_000_000n,
        holdersHash: await sha256Hex(canonicalHolderLine(holder)),
        firstLedger: 102,
        lastLedger: 102,
      }),
    ).rejects.toThrow("OWNERSHIP_SUPPLY_MISMATCH");
    await t.mutation(internal.ownership.failAttempt, {
      attemptId,
      fencingToken: begun.fencingToken,
      safeErrorCode: "OWNERSHIP_SUPPLY_MISMATCH",
    });
    const result = await t.query(api.ownership.get, {
      boundaryKey: BOUNDARY,
      sessionTokenHash: seeded.tokenHash,
      assetId: seeded.assetId,
    });
    expect(result.snapshot?.snapshotId).toBe(good.snapshotId);
    expect(result.sync).toMatchObject({
      state: "failed",
      safeErrorCode: "OWNERSHIP_SUPPLY_MISMATCH",
    });
  });

  it("fences concurrent asset workers and rejects the stale worker after takeover", async () => {
    const t = createTest();
    const seeded = await seedConfirmed(t, "fence");
    const firstId = await createAttempt(t, seeded, "fence-a");
    const secondId = await createAttempt(t, seeded, "fence-b");
    const first = await t.mutation(internal.ownership.beginAttempt, {
      attemptId: firstId,
      holderId: "first",
    });
    if (!first || first.busy) throw new Error("fixture lease not acquired");
    expect(
      await t.mutation(internal.ownership.beginAttempt, {
        attemptId: secondId,
        holderId: "second",
      }),
    ).toMatchObject({ busy: true });
    await t.run(async (ctx) => {
      const lease = await ctx.db.query("ownershipSyncLeases").first();
      await ctx.db.patch(lease!._id, { leaseExpiresAt: 0 });
    });
    const second = await t.mutation(internal.ownership.beginAttempt, {
      attemptId: secondId,
      holderId: "second",
    });
    expect(second && !second.busy ? second.fencingToken : 0n).toBe(first.fencingToken + 1n);
    await expect(
      t.mutation(internal.ownership.stagePage, {
        attemptId: firstId,
        fencingToken: first.fencingToken,
        pageNumber: 1,
        holders: [],
      }),
    ).rejects.toThrow("STALE_OWNERSHIP_FENCE");
  });

  it("deduplicates request IDs, suppresses active work, and throttles manual refresh", async () => {
    const t = createTest();
    const seeded = await seedConfirmed(t, "refresh");
    const args = {
      boundaryKey: BOUNDARY,
      sessionTokenHash: seeded.tokenHash,
      assetId: seeded.assetId,
      reason: "manual" as const,
      requestId: crypto.randomUUID(),
    };
    const accepted = await t.mutation(api.ownership.refresh, args);
    expect(accepted.status).toBe("accepted");
    expect(await t.mutation(api.ownership.refresh, args)).toMatchObject({
      status: "deduplicated",
      attemptId: accepted.attemptId,
    });
    await t.run(async (ctx) => {
      const attempt = await ctx.db
        .query("ownershipSyncAttempts")
        .withIndex("by_attemptId", (q) => q.eq("attemptId", accepted.attemptId!))
        .unique();
      await ctx.db.patch(attempt!._id, { state: "Failed" });
    });
    expect(
      await t.mutation(api.ownership.refresh, { ...args, requestId: crypto.randomUUID() }),
    ).toMatchObject({ status: "throttled", retryAfterMs: expect.any(Number) });
  });

  it("never deletes current or pinned snapshots while pruning expired history", async () => {
    const t = createTest();
    const seeded = await seedConfirmed(t, "retention");
    const ids = await t.run(async (ctx) => {
      const result = [];
      for (let index = 0; index < 12; index += 1) {
        result.push(
          await ctx.db.insert("ownershipSnapshots", {
            snapshotId: `snapshot-${index}`,
            attemptId: `retention-attempt-${index}`,
            organizationId: seeded.organizationId,
            assetId: seeded.assetId,
            issuanceId: seeded.issuanceId,
            network: "Testnet",
            assetCode: "SORA5",
            issuerAccount: issuer,
            confirmedSupply: "3.0000000",
            observedSupply: "3.0000000",
            holderCount: 0,
            holdersHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            synchronizedAt: Date.now() - (12 - index) * 31 * 24 * 60 * 60 * 1_000,
            pinned: index === 0,
          }),
        );
      }
      const issuance = await ctx.db
        .query("issuances")
        .withIndex("by_issuanceId", (q) => q.eq("issuanceId", seeded.issuanceId))
        .unique();
      await ctx.db.patch(issuance!._id, { currentOwnershipSnapshotId: result.at(-1)! });
      return result;
    });
    for (let index = 0; index < 12; index += 1) {
      await t.mutation(internal.ownership.cleanup, {
        organizationId: seeded.organizationId,
        assetId: seeded.assetId,
      });
    }
    const remaining = await t.run(
      async (ctx) => await ctx.db.query("ownershipSnapshots").collect(),
    );
    expect(remaining.some((snapshot) => snapshot._id === ids[0])).toBe(true);
    expect(remaining.some((snapshot) => snapshot._id === ids.at(-1))).toBe(true);
    expect(remaining.length).toBeLessThanOrEqual(10);
  });
});
