/// <reference types="vite/client" />

import aggregateTest from "@convex-dev/aggregate/test";
import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";

import { api } from "../../convex/_generated/api.js";
import schema from "../../convex/schema.js";

const modules = import.meta.glob("../../convex/**/*.ts");
const BOUNDARY = "test-boundary-secret";

function createTest() {
  const t = convexTest(schema, modules);
  aggregateTest.register(t, "assetLifecycleCounts");
  return t;
}

const assetInput = {
  name: "Solar Farm Alpha",
  category: "Energy" as const,
  description: "A utility-scale renewable energy installation.",
  estimatedValue: "1000000",
  currency: "USD" as const,
  countryCode: "PH",
  legalOwner: "Sora Energy Inc.",
  registrationNumber: "PHASE3-123",
  ownershipType: "Organization" as const,
  contactEmail: "owner@example.com",
};

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

async function createAsset(t: ReturnType<typeof convexTest>, tokenHash: string, requestId: string) {
  return await t.mutation(api.assets.create, {
    boundaryKey: BOUNDARY,
    sessionTokenHash: tokenHash,
    createRequestId: requestId,
    correlationId: `create-${requestId}`,
    input: assetInput,
  });
}

describe("Phase 3 review and Ready gate", () => {
  beforeEach(() => {
    process.env.CONVEX_SERVER_BOUNDARY_KEY = BOUNDARY;
  });

  it("freezes one immutable manifest, approves exactly once, and derives the Ready queue", async () => {
    const t = createTest();
    const identity = await seedIdentity(t, "phase3-a");
    const created = await createAsset(
      t,
      identity.tokenHash,
      "70000000-0000-4000-8000-000000000001",
    );
    const profile = await t.mutation(api.tokenization.updateProfile, {
      boundaryKey: BOUNDARY,
      sessionTokenHash: identity.tokenHash,
      assetId: created.asset.assetId as string,
      expectedAssetVersion: 1,
      correlationId: "profile-1",
      profile: { assetCode: "sora1", proposedSupply: "25.5", internalReference: "Deal 1" },
    });
    expect(() => JSON.stringify(profile)).not.toThrow();
    expect(profile.profile).not.toHaveProperty("supplyUnits");
    const snapshot = await t.query(api.tokenization.getReviewSnapshot, {
      boundaryKey: BOUNDARY,
      sessionTokenHash: identity.tokenHash,
      assetId: created.asset.assetId as string,
    });
    expect(() => JSON.stringify(snapshot)).not.toThrow();
    await t.run(async (ctx) => {
      const storageId = await ctx.storage.store(new Blob(["%PDF-1.7\nfixture"]));
      await ctx.db.insert("supportingDocuments", {
        documentId: "document-1",
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
    const submitted = await t.mutation(api.tokenization.submitReview, {
      boundaryKey: BOUNDARY,
      sessionTokenHash: identity.tokenHash,
      assetId: created.asset.assetId as string,
      expectedAssetVersion: profile.assetVersion,
      correlationId: "review-1",
    });
    const approvalArgs = {
      boundaryKey: BOUNDARY,
      sessionTokenHash: identity.tokenHash,
      assetId: created.asset.assetId as string,
      expectedAssetVersion: submitted.assetVersion,
      correlationId: "approve-1",
    };
    const approved = await t.mutation(api.tokenization.approve, approvalArgs);
    const replay = await t.mutation(api.tokenization.approve, approvalArgs);
    const queue = await t.query(api.tokenization.readyQueue, {
      boundaryKey: BOUNDARY,
      sessionTokenHash: identity.tokenHash,
      paginationOpts: { cursor: null, numItems: 25 },
    });
    const state = await t.run(async (ctx) => ({
      manifests: await ctx.db.query("reviewManifests").collect(),
      decisions: await ctx.db.query("reviewDecisions").collect(),
      events: await ctx.db.query("activityEvents").collect(),
    }));

    expect(approved.replayed).toBe(false);
    expect(replay).toMatchObject({ decisionId: approved.decisionId, replayed: true });
    expect(queue.items).toHaveLength(1);
    expect(queue.items[0]).toMatchObject({ lifecycle: "Ready", profile: { supply: "25.5000000" } });
    expect(state.manifests).toHaveLength(1);
    expect(state.decisions.filter((decision) => decision.decision === "Approved")).toHaveLength(1);
    expect(state.events.filter((event) => event.eventType === "asset.approved")).toHaveLength(1);
  });

  it("keeps foreign assets and Ready rows nondisclosing and immutable", async () => {
    const t = createTest();
    const owner = await seedIdentity(t, "phase3-owner");
    const foreign = await seedIdentity(t, "phase3-foreign");
    const created = await createAsset(t, owner.tokenHash, "70000000-0000-4000-8000-000000000002");
    await expect(
      t.query(api.tokenization.getReviewSnapshot, {
        boundaryKey: BOUNDARY,
        sessionTokenHash: foreign.tokenHash,
        assetId: created.asset.assetId as string,
      }),
    ).rejects.toThrow("ASSET_NOT_FOUND");
    const queue = await t.query(api.tokenization.readyQueue, {
      boundaryKey: BOUNDARY,
      sessionTokenHash: foreign.tokenHash,
      paginationOpts: { cursor: null, numItems: 25 },
    });
    expect(queue.items).toEqual([]);
  });
});
