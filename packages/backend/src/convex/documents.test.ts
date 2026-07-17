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

async function seed(t: ReturnType<typeof convexTest>, suffix: string) {
  const identity = await t.run(async (ctx) => {
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
  const created = await t.mutation(api.assets.create, {
    boundaryKey: BOUNDARY,
    sessionTokenHash: identity.tokenHash,
    createRequestId: `90000000-0000-4000-8000-${suffix.padStart(12, "0").slice(-12)}`,
    correlationId: `create-${suffix}`,
    input: {
      name: `Document Asset ${suffix}`,
      category: "Energy",
      description: "A utility-scale renewable energy installation.",
      estimatedValue: "1000000",
      currency: "USD",
      countryCode: "PH",
      legalOwner: "Sora Energy Inc.",
      registrationNumber: `DOC-${suffix}`,
      ownershipType: "Organization",
      contactEmail: `${suffix}@example.com`,
    },
  });
  return { ...identity, assetId: created.asset.assetId as string };
}

describe("authorized stored-byte document workflow", () => {
  beforeEach(() => {
    process.env.CONVEX_SERVER_BOUNDARY_KEY = BOUNDARY;
  });

  it("validates stored bytes, persists safe metadata, and replays finalization exactly once", async () => {
    const t = createTest();
    const owner = await seed(t, "000000000001");
    const intent = await t.mutation(api.documents.createUploadIntent, {
      boundaryKey: BOUNDARY,
      sessionTokenHash: owner.tokenHash,
      assetId: owner.assetId,
      expectedAssetVersion: 1,
    });
    const storageId = await t.run(async (ctx) =>
      ctx.storage.store(new Blob(["%PDF-1.7\nfixture"])),
    );
    const args = {
      boundaryKey: BOUNDARY,
      sessionTokenHash: owner.tokenHash,
      intentId: intent.intentId,
      storageId,
      filename: "evidence.pdf",
      correlationId: "document-upload-1",
    };
    const first = await t.action(api.documentActions.finalize, args);
    const replay = await t.action(api.documentActions.finalize, args);
    const documents = await t.query(api.documents.list, {
      boundaryKey: BOUNDARY,
      sessionTokenHash: owner.tokenHash,
      assetId: owner.assetId,
    });
    const state = await t.run(async (ctx) => ({
      documents: await ctx.db.query("supportingDocuments").collect(),
      events: await ctx.db.query("activityEvents").collect(),
    }));
    expect(first.replayed).toBe(false);
    expect(replay).toMatchObject({
      replayed: true,
      document: { documentId: first.document.documentId },
    });
    expect(documents).toHaveLength(1);
    expect(documents[0]).not.toHaveProperty("storageId");
    expect(state.documents).toHaveLength(1);
    expect(state.events.filter((event) => event.eventType === "document.uploaded")).toHaveLength(1);
  });

  it("rejects spoofed extensions without active metadata", async () => {
    const t = createTest();
    const owner = await seed(t, "000000000002");
    const intent = await t.mutation(api.documents.createUploadIntent, {
      boundaryKey: BOUNDARY,
      sessionTokenHash: owner.tokenHash,
      assetId: owner.assetId,
      expectedAssetVersion: 1,
    });
    const storageId = await t.run(async (ctx) =>
      ctx.storage.store(new Blob(["%PDF-1.7\nfixture"])),
    );
    await expect(
      t.action(api.documentActions.finalize, {
        boundaryKey: BOUNDARY,
        sessionTokenHash: owner.tokenHash,
        intentId: intent.intentId,
        storageId,
        filename: "spoofed.png",
        correlationId: "document-spoof",
      }),
    ).rejects.toThrow("DOCUMENT_EXTENSION_MISMATCH");
    const rows = await t.run(async (ctx) => ctx.db.query("supportingDocuments").collect());
    expect(rows).toEqual([]);
  });

  it("does not disclose owner documents to another Organization", async () => {
    const t = createTest();
    const owner = await seed(t, "000000000003");
    const foreign = await seed(t, "000000000004");
    await expect(
      t.query(api.documents.list, {
        boundaryKey: BOUNDARY,
        sessionTokenHash: foreign.tokenHash,
        assetId: owner.assetId,
      }),
    ).rejects.toThrow("ASSET_NOT_FOUND");
  });
});
