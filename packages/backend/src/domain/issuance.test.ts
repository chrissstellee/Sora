import { describe, expect, it } from "vitest";

import {
  ISSUANCE_STATUSES,
  reconciliationDecision,
  retryDelaySeconds,
  transitionIssuanceStatus,
  validateDurableIdentity,
  type DurableTransactionIdentity,
} from "./issuance.js";

const identity: DurableTransactionIdentity = {
  network: "Testnet",
  purpose: "issuance-payment",
  attemptNumber: 1,
  sourceAccount: "GISSUER",
  sequence: "42",
  baseFee: "100",
  minTime: 1_000,
  maxTime: 1_300,
  assetCode: "SORA1",
  issuerAccount: "GISSUER",
  distributorAccount: "GDISTRIBUTOR",
  amount: "25.0000000",
  hash: "a".repeat(64),
};

describe("durable issuance identity", () => {
  it("requires Testnet, an exact hash, sequence, attempt, and five-minute bounds", () => {
    expect(() => validateDurableIdentity(identity)).not.toThrow();
    expect(() => validateDurableIdentity({ ...identity, maxTime: 1_301 })).toThrow(
      "INVALID_TRANSACTION_TIME_BOUNDS",
    );
    expect(() => validateDurableIdentity({ ...identity, hash: "signed-xdr" })).toThrow(
      "INVALID_TRANSACTION_HASH",
    );
  });
});

describe("evidence-driven reconciliation", () => {
  it("accepts authoritative success and failure by hash", () => {
    expect(
      reconciliationDecision({
        identity,
        hash: { result: "FoundSuccess", ledger: 100, ledgerCloseTime: 1_100 },
      }),
    ).toBe("Confirmed");
    expect(
      reconciliationDecision({
        identity,
        hash: { result: "FoundFailed", ledger: 100, ledgerCloseTime: 1_100 },
      }),
    ).toBe("Failed");
  });

  it("resubmits only the identical still-valid transaction", () => {
    expect(
      reconciliationDecision({
        identity,
        hash: { result: "Missing" },
        observedSourceSequence: "41",
        latestClosedLedgerTime: 1_250,
      }),
    ).toBe("IdenticalResubmission");
  });

  it("permits replacement only after ledger expiry and an unconsumed sequence", () => {
    expect(
      reconciliationDecision({
        identity,
        hash: { result: "Missing" },
        observedSourceSequence: "41",
        latestClosedLedgerTime: 1_301,
      }),
    ).toBe("SafeToRetry");
  });

  it.each(["42", "43", "40"])("sends sequence conflict %s to NeedsReview", (sequence) => {
    expect(
      reconciliationDecision({
        identity,
        hash: { result: "Missing" },
        observedSourceSequence: sequence,
        latestClosedLedgerTime: 1_301,
      }),
    ).toBe("NeedsReview");
  });

  it("keeps unavailable or incomplete evidence reconciling", () => {
    expect(reconciliationDecision({ identity, hash: { result: "Unavailable" } })).toBe(
      "Reconciling",
    );
    expect(reconciliationDecision({ identity, hash: { result: "Missing" } })).toBe("Reconciling");
  });
});

describe("public issuance lifecycle", () => {
  it.each([
    ["Pending", "Submitted"],
    ["Pending", "Failed"],
    ["Submitted", "Confirmed"],
    ["Submitted", "Failed"],
  ] as const)("permits %s -> %s", (from, to) => {
    expect(transitionIssuanceStatus(from, to)).toBe(to);
  });
  for (const status of ISSUANCE_STATUSES) {
    it(`rejects duplicate ${status}`, () => {
      expect(() => transitionIssuanceStatus(status, status)).toThrow("Invalid issuance transition");
    });
  }
  it("uses bounded retry delays and settles at five minutes", () => {
    expect([1, 2, 3, 4, 5, 6].map(retryDelaySeconds)).toEqual([15, 30, 60, 120, 300, 300]);
  });
});
