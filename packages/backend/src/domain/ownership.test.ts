import { describe, expect, it } from "vitest";

import {
  assertStrictHolderOrder,
  canonicalHolderLine,
  canonicalizeHolderAmount,
  normalizeAccountSearch,
  ownershipShare,
} from "./ownership.js";

describe("ownership amount contracts", () => {
  it("canonicalizes zero and seven-decimal holder balances without Number", () => {
    expect(canonicalizeHolderAmount("0")).toEqual({ units: 0n, amount: "0.0000000" });
    expect(canonicalizeHolderAmount("001.2")).toEqual({
      units: 12_000_000n,
      amount: "1.2000000",
    });
    expect(canonicalizeHolderAmount("922337203685.4775807").units).toBe(9_223_372_036_854_775_807n);
  });

  it.each(["-1", "+1", "1e2", "1.00000001", "922337203685.4775808", "NaN"])(
    "rejects malformed or unsafe balance %s",
    (value) => expect(() => canonicalizeHolderAmount(value)).toThrow("INVALID_HOLDER_BALANCE"),
  );

  it("derives four-place percentages with round-half-up integer arithmetic", () => {
    expect(ownershipShare(1n, 3n)).toBe("33.3333");
    expect(ownershipShare(2n, 3n)).toBe("66.6667");
    expect(ownershipShare(1n, 32_000n)).toBe("0.0031");
    expect(ownershipShare(1n, 16_000n)).toBe("0.0063");
    expect(ownershipShare(0n, 1n)).toBe("0.0000");
    expect(ownershipShare(1n, 1n)).toBe("100.0000");
  });

  it("rejects impossible shares", () => {
    expect(() => ownershipShare(1n, 0n)).toThrow("INVALID_OWNERSHIP_SHARE");
    expect(() => ownershipShare(2n, 1n)).toThrow("INVALID_OWNERSHIP_SHARE");
  });
});

describe("canonical ownership corpus", () => {
  const holder = (account: string, balanceUnits = 1n) => ({
    account,
    balanceUnits,
    balance: "0.0000001",
    ledger: 1,
  });

  it("hashes newline-delimited account and canonical balance rows", () => {
    expect(canonicalHolderLine(holder("GABC"))).toBe("GABC|0.0000001\n");
  });

  it("requires globally strict account order, including page boundaries", () => {
    expect(() => assertStrictHolderOrder([holder("GB"), holder("GC")], "GA")).not.toThrow();
    expect(() => assertStrictHolderOrder([holder("GB"), holder("GB")])).toThrow(
      "HORIZON_ACCOUNT_ORDER_INVALID",
    );
    expect(() => assertStrictHolderOrder([holder("GA")], "GB")).toThrow(
      "HORIZON_ACCOUNT_ORDER_INVALID",
    );
  });

  it("normalizes bounded public-key prefix searches", () => {
    expect(normalizeAccountSearch("  gabc2 ")).toBe("GABC2");
    expect(() => normalizeAccountSearch("GABC?cursor=x")).toThrow("INVALID_ACCOUNT_SEARCH");
  });
});
