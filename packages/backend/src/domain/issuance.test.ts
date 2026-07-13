import { describe, expect, it, vi } from "vitest";

import {
  ISSUANCE_STATUSES,
  UncertainSubmissionError,
  reconcileIssuance,
  requestIssuance,
  transitionIssuance,
  type IssuanceRecord,
  type IssuanceRepository,
  type TransactionIdentity,
} from "./issuance.js";

const NOW = "2026-07-13T00:00:00.000Z";
const transaction: TransactionIdentity = {
  hash: "a".repeat(64),
  sourceAccount: "GACCOUNT",
  sequence: "42",
  operationPurpose: "issuance-payment",
  submissionIdentity: "payment:42",
  submittedAt: NOW,
  horizonResult: "unknown",
};
const record = (status: IssuanceRecord["status"]): IssuanceRecord => ({
  id: "issue-1",
  logicalKey: "asset-1:v1",
  status,
  reconciliationEvidence: [],
  createdAt: NOW,
  updatedAt: NOW,
  transaction,
});

const allowed = [
  ["pending", "submitted"],
  ["pending", "failed"],
  ["submitted", "confirmed"],
  ["submitted", "failed"],
  ["submitted", "ambiguous"],
  ["ambiguous", "confirmed"],
  ["ambiguous", "failed"],
  ["failed", "pending"],
] as const;

describe("issuance state contract", () => {
  it.each(allowed)("permits %s -> %s under its reconciliation rule", (from, to) => {
    expect(transitionIssuance(record(from), to, { reconciled: true }).status).toBe(to);
  });
  for (const status of ISSUANCE_STATUSES) {
    it(`rejects duplicate ${status} transitions`, () => {
      expect(() => transitionIssuance(record(status), status)).toThrow(/Invalid/);
    });
  }
  it("keeps confirmed terminal and requires reconciliation for recovery edges", () => {
    expect(() => transitionIssuance(record("confirmed"), "failed")).toThrow(/Invalid/);
    expect(() => transitionIssuance(record("ambiguous"), "confirmed")).toThrow(/reconciliation/);
    expect(() => transitionIssuance(record("failed"), "pending")).toThrow(/reconciliation/);
  });
});

function repository() {
  const records = new Map<string, IssuanceRecord>();
  const repo: IssuanceRepository = {
    async claim(key, create) {
      const existing = records.get(key);
      if (existing) return { record: existing, claimed: false };
      const next = create();
      records.set(key, next);
      return { record: next, claimed: true };
    },
    async save(next) {
      records.set(next.logicalKey, next);
      return next;
    },
  };
  return repo;
}

describe("idempotent issuance orchestration", () => {
  it("atomically replays duplicate and concurrent logical keys without a second submit", async () => {
    const repo = repository();
    const prepare = vi.fn(async () => transaction);
    const submit = vi.fn(async () => transaction);
    const input = {
      logicalKey: "asset-1:v1",
      repository: repo,
      submitAdapter: { prepare, submit },
      now: () => new Date(NOW),
      createId: () => "issue-1",
    };
    const [first, second] = await Promise.all([requestIssuance(input), requestIssuance(input)]);
    expect(submit).toHaveBeenCalledTimes(1);
    expect(prepare).toHaveBeenCalledTimes(2);
    expect(first.transaction).toEqual(transaction);
    expect(first.id).toBe(second.id);
  });
  it("records timeout-after-submit as ambiguous and prohibits blind retry", async () => {
    const repo = repository();
    const prepare = vi.fn(async () => transaction);
    const submit = vi.fn(async () => {
      throw new UncertainSubmissionError();
    });
    const input = {
      logicalKey: "asset-2:v1",
      repository: repo,
      submitAdapter: { prepare, submit },
      now: () => new Date(NOW),
    };
    expect((await requestIssuance(input)).status).toBe("ambiguous");
    expect((await requestIssuance(input)).status).toBe("ambiguous");
    expect(submit).toHaveBeenCalledTimes(1);
  });
  it("resolves ambiguous records only from Horizon reconciliation evidence", async () => {
    const repo = repository();
    const result = await reconcileIssuance({
      record: record("ambiguous"),
      repository: repo,
      reconciler: {
        async reconcile() {
          return {
            checkedAt: NOW,
            methods: ["transaction-hash", "account-sequence"],
            outcome: "confirmed",
            horizonResult: "success",
            ledger: 123,
            detail: "hash found",
          };
        },
      },
    });
    expect(result.status).toBe("confirmed");
    expect(result.reconciliationEvidence).toHaveLength(1);
  });

  it("reconciles a crash-window pending record whose identity was atomically persisted", async () => {
    const repo = repository();
    const result = await reconcileIssuance({
      record: record("pending"),
      repository: repo,
      reconciler: {
        async reconcile() {
          return {
            checkedAt: NOW,
            methods: ["transaction-hash", "account-sequence"],
            outcome: "confirmed",
            horizonResult: "success",
            ledger: 124,
            detail: "broadcast succeeded before process termination",
          };
        },
      },
    });
    expect(result.status).toBe("confirmed");
  });

  it("rejects safe-to-retry claims without both hash and unconsumed-sequence evidence", async () => {
    const repo = repository();
    await expect(
      reconcileIssuance({
        record: record("failed"),
        repository: repo,
        reconciler: {
          async reconcile() {
            return {
              checkedAt: NOW,
              methods: ["transaction-hash"],
              outcome: "safe-to-retry",
              horizonResult: "not-found",
              detail: "incomplete evidence",
            };
          },
        },
      }),
    ).rejects.toThrow(/transaction-hash and account-sequence/);
  });
});
