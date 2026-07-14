import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";

import { api } from "../../convex/_generated/api.js";
import schema from "../../convex/schema.js";

declare global {
  interface ImportMeta {
    glob(pattern: string): Record<string, () => Promise<unknown>>;
  }
}

const modules = (
  import.meta as ImportMeta & {
    glob: (pattern: string) => Record<string, () => Promise<unknown>>;
  }
).glob("../../convex/**/*.ts");
const BOUNDARY = "test-boundary-secret";

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
    const t = convexTest(schema, modules);
    const identity = await seedIdentity(t, "A");
    await expect(
      t.query(api.assets.list, {
        boundaryKey: "forged",
        sessionTokenHash: identity.tokenHash,
        limit: 25,
      }),
    ).rejects.toThrow(/Invalid server boundary/);
  });

  it("creates atomically and replays an identical request", async () => {
    const t = convexTest(schema, modules);
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

  it("enforces idempotency and registration uniqueness per organization", async () => {
    const t = convexTest(schema, modules);
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
    const t = convexTest(schema, modules);
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

  it("rejects revoked, deleted, disabled, and organization-inconsistent identities", async () => {
    const scenarios = ["revoked", "deleted", "disabled", "inconsistent"] as const;

    for (const scenario of scenarios) {
      const t = convexTest(schema, modules);
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
          limit: 25,
        }),
      ).rejects.toThrow(/Unauthorized/);
    }
  });

  it("revokes logout sessions once and rejects replayed use", async () => {
    const t = convexTest(schema, modules);
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
        limit: 25,
      }),
    ).rejects.toThrow(/Unauthorized/);
  });

  it("searches indexed name and registration prefixes with stable deduplication and isolation", async () => {
    const t = convexTest(schema, modules);
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
      limit: 50,
      search: "alpha",
    });

    expect(result.mode).toBe("search");
    expect(result.items.map((asset) => asset.name)).toEqual(["Alpha Harbor", "Alpha Solar"]);
    expect(new Set(result.items.map((asset) => asset.assetId)).size).toBe(2);
  });

  it("paginates without overlap and derives lifecycle counts including Archived", async () => {
    const t = convexTest(schema, modules);
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
      await ctx.db.patch(assets[0]!._id, { lifecycle: "Archived" });
    });

    const first = await t.query(api.assets.list, {
      boundaryKey: BOUNDARY,
      sessionTokenHash: identity.tokenHash,
      limit: 3,
    });
    const second = await t.query(api.assets.list, {
      boundaryKey: BOUNDARY,
      sessionTokenHash: identity.tokenHash,
      limit: 3,
      cursor: first.nextCursor ?? undefined,
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
        limit: 3,
        cursor: "not-an-asset",
      }),
    ).rejects.toThrow(/INVALID_CURSOR/);
  });
});
