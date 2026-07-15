/// <reference types="vite/client" />

import aggregateTest from "@convex-dev/aggregate/test";
import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";

import { api, internal } from "../../convex/_generated/api.js";
import { assetLifecycleCounts } from "../../convex/assetAggregates.js";
import schema from "../../convex/schema.js";

const modules = import.meta.glob("../../convex/**/*.ts");
const BOUNDARY = "test-boundary-secret";

function createTest() {
  const t = convexTest(schema, modules);
  aggregateTest.register(t, "assetLifecycleCounts");
  return t;
}

const input = {
  name: "Solar Farm Alpha",
  category: "Energy" as const,
  description: "A utility-scale renewable energy installation.",
  estimatedValue: "1000000",
  currency: "USD" as const,
  countryCode: "PH",
  legalOwner: "Sora Energy Inc.",
  registrationNumber: "SEC-123-ABC",
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
    const sessionId = await ctx.db.insert("sessions", {
      tokenHash,
      userId,
      organizationId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 60_000,
    });
    return { organizationId, userId, sessionId, tokenHash };
  });
}

describe("persisted asset workspace", () => {
  beforeEach(() => {
    process.env.CONVEX_SERVER_BOUNDARY_KEY = BOUNDARY;
  });

  it("rejects direct calls without the server boundary", async () => {
    const t = createTest();
    const identity = await seedIdentity(t, "A");
    await expect(
      t.query(api.assets.list, {
        boundaryKey: "forged",
        sessionTokenHash: identity.tokenHash,
        paginationOpts: { cursor: null, numItems: 25 },
      }),
    ).rejects.toThrow(/Invalid server boundary/);
  });

  it("creates atomically and replays an identical request", async () => {
    const t = createTest();
    const identity = await seedIdentity(t, "A");
    const args = {
      boundaryKey: BOUNDARY,
      sessionTokenHash: identity.tokenHash,
      createRequestId: "11111111-1111-4111-8111-111111111111",
      correlationId: "create-correlation",
      input,
    };
    const created = await t.mutation(api.assets.create, args);
    const replay = await t.mutation(api.assets.create, args);
    expect(created.replayed).toBe(false);
    expect(replay.replayed).toBe(true);
    expect(replay.asset.assetId).toBe(created.asset.assetId);
    expect(created.asset.assetId).not.toBe(args.createRequestId);
    const state = await t.run(async (ctx) => ({
      assets: await ctx.db.query("assets").collect(),
      events: await ctx.db.query("activityEvents").collect(),
    }));
    expect(state.assets).toHaveLength(1);
    expect(state.events).toHaveLength(1);
    expect(state.events[0]?.assetId).toBe(created.asset.assetId);
  });

  it("rolls back asset, aggregate, and Activity Event writes after an injected create fault", async () => {
    const t = createTest();
    const identity = await seedIdentity(t, "create-fault");

    await expect(
      t.mutation(internal.phase2Faults.createThenFail, {
        boundaryKey: BOUNDARY,
        sessionTokenHash: identity.tokenHash,
        createRequestId: "51111111-1111-4111-8111-111111111111",
        correlationId: "create-fault",
        input,
      }),
    ).rejects.toThrow(/INJECTED_POST_CREATE_FAILURE/);

    const state = await t.run(async (ctx) => ({
      assets: await ctx.db.query("assets").collect(),
      events: await ctx.db.query("activityEvents").collect(),
      count: await assetLifecycleCounts.count(ctx, { namespace: identity.organizationId }),
    }));
    expect(state).toMatchObject({ assets: [], events: [], count: 0 });
  });

  it("rolls back an Asset update and Activity Event after an injected update fault", async () => {
    const t = createTest();
    const identity = await seedIdentity(t, "update-fault");
    const created = await t.mutation(api.assets.create, {
      boundaryKey: BOUNDARY,
      sessionTokenHash: identity.tokenHash,
      createRequestId: "52222222-2222-4222-8222-222222222222",
      correlationId: "before-update-fault",
      input,
    });

    await expect(
      t.mutation(internal.phase2Faults.updateThenFail, {
        boundaryKey: BOUNDARY,
        sessionTokenHash: identity.tokenHash,
        assetId: created.asset.assetId as string,
        correlationId: "update-fault",
        input: { ...input, name: "Should Roll Back", expectedVersion: 1 },
      }),
    ).rejects.toThrow(/INJECTED_POST_UPDATE_FAILURE/);

    const state = await t.run(async (ctx) => ({
      asset: (await ctx.db.query("assets").first())!,
      events: await ctx.db.query("activityEvents").collect(),
      count: await assetLifecycleCounts.count(ctx, { namespace: identity.organizationId }),
    }));
    expect(state.asset).toMatchObject({ name: input.name, version: 1 });
    expect(state.events.map((event) => event.eventType)).toEqual(["asset.created"]);
    expect(state.count).toBe(1);
  });

  it("enforces idempotency and registration uniqueness per organization", async () => {
    const t = createTest();
    const a = await seedIdentity(t, "A");
    const b = await seedIdentity(t, "B");
    const baseArgs = {
      boundaryKey: BOUNDARY,
      sessionTokenHash: a.tokenHash,
      createRequestId: "11111111-1111-4111-8111-111111111111",
      correlationId: "one",
      input,
    };
    await t.mutation(api.assets.create, baseArgs);
    await expect(
      t.mutation(api.assets.create, { ...baseArgs, input: { ...input, name: "Different Asset" } }),
    ).rejects.toThrow(/CREATE_REQUEST_CONFLICT/);
    await expect(
      t.mutation(api.assets.create, {
        ...baseArgs,
        createRequestId: "22222222-2222-4222-8222-222222222222",
      }),
    ).rejects.toThrow(/REGISTRATION_NUMBER_CONFLICT/);
    await expect(
      t.mutation(api.assets.create, {
        ...baseArgs,
        sessionTokenHash: b.tokenHash,
        createRequestId: "33333333-3333-4333-8333-333333333333",
      }),
    ).resolves.toMatchObject({ replayed: false });
  });

  it("isolates reads and applies optimistic updates without no-op events", async () => {
    const t = createTest();
    const a = await seedIdentity(t, "A");
    const b = await seedIdentity(t, "B");
    const created = await t.mutation(api.assets.create, {
      boundaryKey: BOUNDARY,
      sessionTokenHash: a.tokenHash,
      createRequestId: "11111111-1111-4111-8111-111111111111",
      correlationId: "one",
      input,
    });
    await expect(
      t.query(api.assets.get, {
        boundaryKey: BOUNDARY,
        sessionTokenHash: b.tokenHash,
        assetId: created.asset.assetId as string,
      }),
    ).rejects.toThrow(/ASSET_NOT_FOUND/);
    await expect(
      t.query(api.assets.get, {
        boundaryKey: BOUNDARY,
        sessionTokenHash: b.tokenHash,
        assetId: "00000000-0000-4000-8000-000000000000",
      }),
    ).rejects.toThrow(/ASSET_NOT_FOUND/);
    const unchanged = await t.mutation(api.assets.update, {
      boundaryKey: BOUNDARY,
      sessionTokenHash: a.tokenHash,
      assetId: created.asset.assetId as string,
      correlationId: "noop",
      input: { ...input, expectedVersion: 1 },
    });
    expect(unchanged.outcome).toBe("unchanged");
    const updated = await t.mutation(api.assets.update, {
      boundaryKey: BOUNDARY,
      sessionTokenHash: a.tokenHash,
      assetId: created.asset.assetId as string,
      correlationId: "update",
      input: { ...input, name: "Solar Farm Beta", expectedVersion: 1 },
    });
    expect(updated).toMatchObject({ outcome: "updated", asset: { version: 2 } });
    await expect(
      t.mutation(api.assets.update, {
        boundaryKey: BOUNDARY,
        sessionTokenHash: a.tokenHash,
        assetId: created.asset.assetId as string,
        correlationId: "stale",
        input: { ...input, expectedVersion: 1 },
      }),
    ).rejects.toThrow(/ASSET_VERSION_CONFLICT/);
    const events = await t.run(async (ctx) => await ctx.db.query("activityEvents").collect());
    expect(events.map((event) => event.eventType)).toEqual(["asset.created", "asset.updated"]);
  });

  it("keeps concurrent updates and their Activity Events atomic", async () => {
    const t = createTest();
    const identity = await seedIdentity(t, "concurrent-updates");
    const created = [];
    for (let index = 0; index < 12; index += 1) {
      const suffix = String(index).padStart(12, "0");
      created.push(
        await t.mutation(api.assets.create, {
          boundaryKey: BOUNDARY,
          sessionTokenHash: identity.tokenHash,
          createRequestId: `60000000-0000-4000-8000-${suffix}`,
          correlationId: `concurrent-create-${index}`,
          input: {
            ...input,
            name: `Concurrent ${index}`,
            registrationNumber: `CONCURRENT-${index}`,
          },
        }),
      );
    }

    const updated = await Promise.all(
      created.map((result, index) =>
        t.mutation(api.assets.update, {
          boundaryKey: BOUNDARY,
          sessionTokenHash: identity.tokenHash,
          assetId: result.asset.assetId as string,
          correlationId: `concurrent-update-${index}`,
          input: {
            ...input,
            name: `Concurrent updated ${index}`,
            registrationNumber: `CONCURRENT-${index}`,
            expectedVersion: 1,
          },
        }),
      ),
    );
    const state = await t.run(async (ctx) => ({
      assets: await ctx.db.query("assets").collect(),
      events: await ctx.db.query("activityEvents").collect(),
    }));

    expect(updated.every((result) => result.asset.version === 2)).toBe(true);
    expect(state.assets.every((asset) => asset.version === 2)).toBe(true);
    expect(state.events.filter((event) => event.eventType === "asset.updated")).toHaveLength(12);
  });

  it("keeps update, dashboard, recency, and activity results isolated by Organization", async () => {
    const t = createTest();
    const a = await seedIdentity(t, "A-matrix");
    const b = await seedIdentity(t, "B-matrix");
    const create = async (
      identity: typeof a,
      requestId: string,
      name: string,
      registrationNumber: string,
    ) =>
      await t.mutation(api.assets.create, {
        boundaryKey: BOUNDARY,
        sessionTokenHash: identity.tokenHash,
        createRequestId: requestId,
        correlationId: `event-${requestId}`,
        input: { ...input, name, registrationNumber },
      });

    const assetA = await create(
      a,
      "41111111-1111-4111-8111-111111111111",
      "Organization A Solar",
      "ORG-A-1",
    );
    const assetB = await create(
      b,
      "42222222-2222-4222-8222-222222222222",
      "Organization B Solar",
      "ORG-B-1",
    );

    await expect(
      t.mutation(api.assets.update, {
        boundaryKey: BOUNDARY,
        sessionTokenHash: b.tokenHash,
        assetId: assetA.asset.assetId as string,
        correlationId: "foreign-update",
        input: { ...input, name: "Forbidden update", expectedVersion: 1 },
      }),
    ).rejects.toThrow(/ASSET_NOT_FOUND/);

    const [summaryA, summaryB, activityA, activityB, foreignAssetActivity] = await Promise.all([
      t.query(api.assets.workspaceSummary, {
        boundaryKey: BOUNDARY,
        sessionTokenHash: a.tokenHash,
      }),
      t.query(api.assets.workspaceSummary, {
        boundaryKey: BOUNDARY,
        sessionTokenHash: b.tokenHash,
      }),
      t.query(api.activity.list, {
        boundaryKey: BOUNDARY,
        sessionTokenHash: a.tokenHash,
        limit: 25,
      }),
      t.query(api.activity.list, {
        boundaryKey: BOUNDARY,
        sessionTokenHash: b.tokenHash,
        limit: 25,
      }),
      t.query(api.activity.list, {
        boundaryKey: BOUNDARY,
        sessionTokenHash: b.tokenHash,
        assetId: assetA.asset.assetId as string,
        limit: 25,
      }),
    ]);

    expect(summaryA.counts).toMatchObject({ total: 1, Draft: 1 });
    expect(summaryB.counts).toMatchObject({ total: 1, Draft: 1 });
    expect(summaryA.recentAssets.map((asset) => asset.assetId)).toEqual([assetA.asset.assetId]);
    expect(summaryB.recentAssets.map((asset) => asset.assetId)).toEqual([assetB.asset.assetId]);
    expect(activityA.map((event) => event.assetId)).toEqual([assetA.asset.assetId]);
    expect(activityB.map((event) => event.assetId)).toEqual([assetB.asset.assetId]);
    expect(foreignAssetActivity).toEqual([]);
  });

  it("rejects revoked, deleted, disabled, and organization-inconsistent identities", async () => {
    const scenarios = ["revoked", "deleted", "disabled", "inconsistent"] as const;

    for (const scenario of scenarios) {
      const t = createTest();
      const identity = await seedIdentity(t, scenario);
      await t.run(async (ctx) => {
        if (scenario === "revoked") {
          await ctx.db.patch(identity.sessionId, { revokedAt: Date.now() });
        } else if (scenario === "deleted") {
          await ctx.db.delete(identity.userId);
        } else if (scenario === "disabled") {
          await ctx.db.patch(identity.organizationId, { disabledAt: Date.now() });
        } else {
          const otherOrganizationId = await ctx.db.insert("organizations", {
            name: "Other Org",
            createdAt: Date.now(),
          });
          await ctx.db.patch(identity.userId, { organizationId: otherOrganizationId });
        }
      });

      await expect(
        t.query(api.assets.list, {
          boundaryKey: BOUNDARY,
          sessionTokenHash: identity.tokenHash,
          paginationOpts: { cursor: null, numItems: 25 },
        }),
      ).rejects.toThrow(/Unauthorized/);
    }
  });

  it("revokes logout sessions once and rejects replayed use", async () => {
    const t = createTest();
    const identity = await seedIdentity(t, "logout");

    await expect(
      t.mutation(api.auth.revokeSession, {
        boundaryKey: BOUNDARY,
        tokenHash: identity.tokenHash,
      }),
    ).resolves.toBe(true);
    await expect(
      t.mutation(api.auth.revokeSession, {
        boundaryKey: BOUNDARY,
        tokenHash: identity.tokenHash,
      }),
    ).resolves.toBe(false);
    await expect(
      t.query(api.assets.list, {
        boundaryKey: BOUNDARY,
        sessionTokenHash: identity.tokenHash,
        paginationOpts: { cursor: null, numItems: 25 },
      }),
    ).rejects.toThrow(/Unauthorized/);
  });

  it("searches indexed name and registration prefixes with stable deduplication and isolation", async () => {
    const t = createTest();
    const a = await seedIdentity(t, "A");
    const b = await seedIdentity(t, "B");
    const create = async (
      identity: typeof a,
      requestId: string,
      name: string,
      registrationNumber: string,
    ) =>
      await t.mutation(api.assets.create, {
        boundaryKey: BOUNDARY,
        sessionTokenHash: identity.tokenHash,
        createRequestId: requestId,
        correlationId: requestId,
        input: { ...input, name, registrationNumber },
      });

    await create(a, "11111111-1111-4111-8111-111111111111", "Alpha Harbor", "ALPHA-01");
    await create(a, "22222222-2222-4222-8222-222222222222", "Alpha Solar", "SOL-02");
    await create(b, "33333333-3333-4333-8333-333333333333", "Alpha Foreign", "ALPHA-03");

    const result = await t.query(api.assets.list, {
      boundaryKey: BOUNDARY,
      sessionTokenHash: a.tokenHash,
      paginationOpts: { cursor: null, numItems: 50 },
      search: "alpha",
    });

    expect(result.mode).toBe("search");
    expect(result.items.map((asset) => asset.name)).toEqual(["Alpha Harbor", "Alpha Solar"]);
    expect(new Set(result.items.map((asset) => asset.assetId)).size).toBe(2);
  });

  it("paginates without overlap and derives lifecycle counts including Archived", async () => {
    const t = createTest();
    const identity = await seedIdentity(t, "A");
    for (let index = 0; index < 7; index += 1) {
      await t.mutation(api.assets.create, {
        boundaryKey: BOUNDARY,
        sessionTokenHash: identity.tokenHash,
        createRequestId: `0000000${index}-0000-4000-8000-00000000000${index}`,
        correlationId: `create-${index}`,
        input: {
          ...input,
          name: `Asset Number ${index}`,
          registrationNumber: `REG-${index}`,
        },
      });
    }
    await t.run(async (ctx) => {
      const assets = await ctx.db.query("assets").collect();
      const oldAsset = assets[0]!;
      await ctx.db.patch(oldAsset._id, { lifecycle: "Archived" });
      const newAsset = (await ctx.db.get(oldAsset._id))!;
      await assetLifecycleCounts.replace(ctx, oldAsset, newAsset);
    });

    const first = await t.query(api.assets.list, {
      boundaryKey: BOUNDARY,
      sessionTokenHash: identity.tokenHash,
      paginationOpts: { cursor: null, numItems: 3 },
    });
    const second = await t.query(api.assets.list, {
      boundaryKey: BOUNDARY,
      sessionTokenHash: identity.tokenHash,
      paginationOpts: { cursor: first.nextCursor, numItems: 3 },
    });
    const summary = await t.query(api.assets.workspaceSummary, {
      boundaryKey: BOUNDARY,
      sessionTokenHash: identity.tokenHash,
    });

    expect(first.mode).toBe("list");
    expect(first.nextCursor).toBeTruthy();
    const firstIds = new Set(first.items.map((asset) => asset.assetId));
    expect(second.items.every((asset) => !firstIds.has(asset.assetId))).toBe(true);
    expect(summary.counts).toMatchObject({ total: 7, Draft: 6, Archived: 1, Active: 0 });
    await expect(
      t.query(api.assets.list, {
        boundaryKey: BOUNDARY,
        sessionTokenHash: identity.tokenHash,
        paginationOpts: { cursor: "not-a-convex-cursor", numItems: 3 },
      }),
    ).rejects.toThrow();
  });

  it("uses the indexed descending asset ID tie-breaker for lists and recency", async () => {
    const t = createTest();
    const identity = await seedIdentity(t, "stable-order");
    const assetIds: string[] = [];
    for (let index = 0; index < 7; index += 1) {
      const created = await t.mutation(api.assets.create, {
        boundaryKey: BOUNDARY,
        sessionTokenHash: identity.tokenHash,
        createRequestId: `7000000${index}-0000-4000-8000-00000000000${index}`,
        correlationId: `stable-${index}`,
        input: { ...input, name: `Stable ${index}`, registrationNumber: `STABLE-${index}` },
      });
      assetIds.push(created.asset.assetId as string);
    }
    await t.run(async (ctx) => {
      const assets = await ctx.db.query("assets").collect();
      await Promise.all(assets.map((asset) => ctx.db.patch(asset._id, { updatedAt: 123_456_789 })));
    });

    const first = await t.query(api.assets.list, {
      boundaryKey: BOUNDARY,
      sessionTokenHash: identity.tokenHash,
      paginationOpts: { cursor: null, numItems: 4 },
    });
    const second = await t.query(api.assets.list, {
      boundaryKey: BOUNDARY,
      sessionTokenHash: identity.tokenHash,
      paginationOpts: { cursor: first.nextCursor, numItems: 4 },
    });
    const summary = await t.query(api.assets.workspaceSummary, {
      boundaryKey: BOUNDARY,
      sessionTokenHash: identity.tokenHash,
    });
    const expected = [...assetIds].sort().reverse();

    expect([...first.items, ...second.items].map((asset) => asset.assetId)).toEqual(expected);
    expect(summary.recentAssets.map((asset) => asset.assetId)).toEqual(expected.slice(0, 5));
  });

  it("limits Activity before returning the indexed timestamp and event ID order", async () => {
    const t = createTest();
    const identity = await seedIdentity(t, "activity-order");
    await t.run(async (ctx) => {
      for (const eventId of ["event-a", "event-b", "event-c", "event-d", "event-e"]) {
        await ctx.db.insert("activityEvents", {
          organizationId: identity.organizationId,
          userId: identity.userId,
          eventType: "asset.updated",
          timestamp: 123_456_789,
          outcome: "success",
          correlationId: eventId,
          metadata: "{}",
          eventId,
        });
      }
    });

    const events = await t.query(api.activity.list, {
      boundaryKey: BOUNDARY,
      sessionTokenHash: identity.tokenHash,
      limit: 3,
    });

    expect(events.map((event) => event.eventId)).toEqual(["event-e", "event-d", "event-c"]);
  });

  it("backfills pre-aggregate assets across pages and remains idempotent", async () => {
    const t = createTest();
    const a = await seedIdentity(t, "backfill-a");
    const b = await seedIdentity(t, "backfill-b");
    await t.run(async (ctx) => {
      const rows = [
        ...Array.from({ length: 3 }, (_, index) => ({ identity: a, lifecycle: "Draft", index })),
        ...Array.from({ length: 2 }, (_, index) => ({
          identity: a,
          lifecycle: "Archived",
          index: index + 3,
        })),
        ...Array.from({ length: 2 }, (_, index) => ({
          identity: b,
          lifecycle: "Ready",
          index: index + 5,
        })),
      ];
      for (const { identity, lifecycle, index } of rows) {
        const suffix = String(index).padStart(12, "0");
        await ctx.db.insert("assets", {
          assetId: `90000000-0000-4000-8000-${suffix}`,
          organizationId: identity.organizationId,
          createdBy: identity.userId,
          name: `Backfill ${index}`,
          normalizedName: `backfill ${index}`,
          category: input.category,
          description: input.description,
          estimatedValue: input.estimatedValue,
          currency: input.currency,
          countryCode: input.countryCode,
          legalOwner: input.legalOwner,
          registrationNumber: `BACKFILL-${index}`,
          normalizedRegistrationNumber: `backfill-${index}`,
          ownershipType: input.ownershipType,
          contactEmail: input.contactEmail,
          lifecycle,
          createdAt: index,
          updatedAt: index,
          version: 1,
          createRequestId: `91000000-0000-4000-8000-${suffix}`,
          createFingerprint: `fingerprint-${index}`,
        });
      }
    });

    const runBackfill = async () => {
      let cursor: string | null = null;
      let pages = 0;
      do {
        const result: { continueCursor: string; isDone: boolean; processed: number } =
          await t.mutation(api.assets.backfillLifecycleCounts, {
            boundaryKey: BOUNDARY,
            paginationOpts: { cursor, numItems: 2 },
          });
        cursor = result.isDone ? null : result.continueCursor;
        pages += 1;
        if (result.isDone) break;
      } while (cursor !== null);
      return pages;
    };

    expect(await runBackfill()).toBeGreaterThan(1);
    expect(await runBackfill()).toBeGreaterThan(1);
    const [summaryA, summaryB] = await Promise.all([
      t.query(api.assets.workspaceSummary, {
        boundaryKey: BOUNDARY,
        sessionTokenHash: a.tokenHash,
      }),
      t.query(api.assets.workspaceSummary, {
        boundaryKey: BOUNDARY,
        sessionTokenHash: b.tokenHash,
      }),
    ]);
    expect(summaryA.counts).toMatchObject({ total: 5, Draft: 3, Archived: 2 });
    expect(summaryB.counts).toMatchObject({ total: 2, Ready: 2 });
  });
});
