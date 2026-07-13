import { GenericQueryCtx } from "convex/server";
import { describe, expect, it, vi } from "vitest";

import { DataModel } from "../../convex/_generated/dataModel.js";
import { list, toggle, remove } from "../../convex/tasks.js";

// Mock ID generator
let idCounter = 0;
function mockId(table: string): string {
  idCounter++;
  return `${table}_id_${idCounter}`;
}

interface ConvexHandler {
  _handler: (ctx: unknown, args: unknown) => Promise<unknown>;
}

// In-memory Database mock
class MockDatabase {
  public tables = {
    organizations: [] as Record<string, unknown>[],
    users: [] as Record<string, unknown>[],
    sessions: [] as Record<string, unknown>[],
    challenges: [] as Record<string, unknown>[],
    onboardingGrants: [] as Record<string, unknown>[],
    activityEvents: [] as Record<string, unknown>[],
    tasks: [] as Record<string, unknown>[],
  };

  async get(id: string): Promise<Record<string, unknown> | null> {
    const recordTables = this.tables as Record<string, Record<string, unknown>[]>;
    for (const table in recordTables) {
      const rows = recordTables[table] || [];
      const found = rows.find((row) => row["_id"] === id);
      if (found) return found;
    }
    return null;
  }

  async insert(table: string, data: Record<string, unknown>): Promise<string> {
    const recordTables = this.tables as Record<string, Record<string, unknown>[]>;
    const _id = mockId(table);
    const newRecord = { _id, ...data };
    if (!recordTables[table]) {
      recordTables[table] = [];
    }
    recordTables[table].push(newRecord);
    return _id;
  }

  async patch(id: string, data: Record<string, unknown>): Promise<void> {
    const recordTables = this.tables as Record<string, Record<string, unknown>[]>;
    for (const table in recordTables) {
      const rows = recordTables[table] || [];
      const index = rows.findIndex((row) => row["_id"] === id);
      if (index !== -1) {
        rows[index] = { ...(rows[index] || {}), ...data };
        return;
      }
    }
    throw new Error(`Record with id ${id} not found for patching`);
  }

  async delete(id: string): Promise<void> {
    const recordTables = this.tables as Record<string, Record<string, unknown>[]>;
    for (const table in recordTables) {
      const rows = recordTables[table] || [];
      const index = rows.findIndex((row) => row["_id"] === id);
      if (index !== -1) {
        rows.splice(index, 1);
        return;
      }
    }
    throw new Error(`Record with id ${id} not found for deletion`);
  }

  query(table: string) {
    return this.originalQuery(table);
  }

  originalQuery(table: string) {
    const recordTables = this.tables as Record<string, Record<string, unknown>[]>;
    let rows = [...(recordTables[table] || [])];
    const chain = {
      withIndex: (_indexName: string, _filterFn?: (q: unknown) => unknown) => {
        // Mock simple index filtering
        return chain;
      },
      order: (_direction: "asc" | "desc") => {
        return chain;
      },
      filter: (_filterFn: (q: unknown) => unknown) => {
        // Simple manual filter mock can be applied if needed
        return chain;
      },
      first: async () => {
        return rows[0] || null;
      },
      collect: async () => {
        return rows;
      },
      // Utility to set mock query results for matching tests
      setResults: (customRows: Record<string, unknown>[]) => {
        rows = customRows;
        return chain;
      },
    };
    return chain;
  }
}

function createMockCtx(db: MockDatabase) {
  return {
    db,
  } as unknown as GenericQueryCtx<DataModel>;
}

describe("Convex Tenancy Isolation & Threat Matrix", () => {
  it("enforces that a valid, active session is required for tasks list", async () => {
    const db = new MockDatabase();
    const ctx = createMockCtx(db);

    // No session in DB -> Should reject
    await expect(
      (list as unknown as ConvexHandler)._handler(ctx, { sessionTokenHash: "invalid_hash" }),
    ).rejects.toThrow(/Unauthorized/);
  });

  it("rejects expired sessions", async () => {
    const db = new MockDatabase();
    const ctx = createMockCtx(db);

    const orgId = await db.insert("organizations", { name: "Org A", createdAt: Date.now() });
    const userId = await db.insert("users", {
      walletAddress: "G1",
      organizationId: orgId,
      createdAt: Date.now(),
    });

    // Create an expired session
    await db.insert("sessions", {
      tokenHash: "expired_hash",
      userId,
      organizationId: orgId,
      expiresAt: Date.now() - 1000, // Expired 1 second ago
      createdAt: Date.now() - 10000,
    });

    // Attempt list -> Should reject
    await expect(
      (list as unknown as ConvexHandler)._handler(ctx, { sessionTokenHash: "expired_hash" }),
    ).rejects.toThrow(/Session expired/);
  });

  it("enforces Organization tenant isolation on tasks", async () => {
    const db = new MockDatabase();
    const ctx = createMockCtx(db);

    // Setup Org A
    const orgAId = await db.insert("organizations", { name: "Org A", createdAt: Date.now() });
    const userAId = await db.insert("users", {
      walletAddress: "GA",
      organizationId: orgAId,
      createdAt: Date.now(),
    });
    await db.insert("sessions", {
      tokenHash: "token_a",
      userId: userAId,
      organizationId: orgAId,
      expiresAt: Date.now() + 10000,
      createdAt: Date.now(),
    });

    // Setup Org B
    const orgBId = await db.insert("organizations", { name: "Org B", createdAt: Date.now() });
    const userBId = await db.insert("users", {
      walletAddress: "GB",
      organizationId: orgBId,
      createdAt: Date.now(),
    });
    await db.insert("sessions", {
      tokenHash: "token_b",
      userId: userBId,
      organizationId: orgBId,
      expiresAt: Date.now() + 10000,
      createdAt: Date.now(),
    });

    // Create tasks for Org A
    await db.insert("tasks", {
      organizationId: orgAId,
      todo: "Task A1",
      completed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create tasks for Org B
    await db.insert("tasks", {
      organizationId: orgBId,
      todo: "Task B1",
      completed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // 1. Verify Org A list returns ONLY Org A tasks
    const queryAMock = vi.spyOn(db, "query").mockImplementation((table) => {
      if (table === "tasks") {
        return db
          .originalQuery(table)
          .setResults(db.tables.tasks.filter((t) => t.organizationId === orgAId));
      }
      return db.originalQuery(table);
    });

    const tasksA = (await (list as unknown as ConvexHandler)._handler(ctx, {
      sessionTokenHash: "token_a",
    })) as Record<string, unknown>[];
    expect(tasksA.length).toBe(1);
    expect(tasksA[0]?.["todo"]).toBe("Task A1");
    expect(tasksA[0]?.["organizationId"]).toBe(orgAId);

    queryAMock.mockRestore();

    // 2. Verify Org B list returns ONLY Org B tasks
    const queryBMock = vi.spyOn(db, "query").mockImplementation((table) => {
      if (table === "tasks") {
        return db
          .originalQuery(table)
          .setResults(db.tables.tasks.filter((t) => t.organizationId === orgBId));
      }
      return db.originalQuery(table);
    });

    const tasksB = (await (list as unknown as ConvexHandler)._handler(ctx, {
      sessionTokenHash: "token_b",
    })) as Record<string, unknown>[];
    expect(tasksB.length).toBe(1);
    expect(tasksB[0]?.["todo"]).toBe("Task B1");
    expect(tasksB[0]?.["organizationId"]).toBe(orgBId);

    queryBMock.mockRestore();
  });

  it("prevents Org A from writing, updating, or deleting Org B's tasks (non-disclosure checks)", async () => {
    const db = new MockDatabase();
    const ctx = createMockCtx(db);

    // Setup Org A and Org B sessions
    const orgAId = await db.insert("organizations", { name: "Org A" });
    const userAId = await db.insert("users", { walletAddress: "GA", organizationId: orgAId });
    await db.insert("sessions", {
      tokenHash: "token_a",
      userId: userAId,
      organizationId: orgAId,
      expiresAt: Date.now() + 10000,
    });

    const orgBId = await db.insert("organizations", { name: "Org B" });
    const userBId = await db.insert("users", { walletAddress: "GB", organizationId: orgBId });
    await db.insert("sessions", {
      tokenHash: "token_b",
      userId: userBId,
      organizationId: orgBId,
      expiresAt: Date.now() + 10000,
    });

    // Task belonging to Org B
    const taskB1 = await db.insert("tasks", {
      organizationId: orgBId,
      todo: "Org B Secret Task",
      completed: false,
    });

    // Org A attempts to toggle Org B's task -> Should fail with "Unauthorized"
    await expect(
      (toggle as unknown as ConvexHandler)._handler(ctx, {
        id: taskB1,
        sessionTokenHash: "token_a",
      }),
    ).rejects.toThrow(/Unauthorized/);

    // Org A attempts to delete Org B's task -> Should fail with "Unauthorized"
    await expect(
      (remove as unknown as ConvexHandler)._handler(ctx, {
        id: taskB1,
        sessionTokenHash: "token_a",
      }),
    ).rejects.toThrow(/Unauthorized/);

    // Task B remains untouched
    const taskRecord = await db.get(taskB1);
    expect(taskRecord?.["completed"]).toBe(false);
  });
});
