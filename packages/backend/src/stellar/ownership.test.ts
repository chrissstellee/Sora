import { Keypair } from "@stellar/stellar-sdk";
import { describe, expect, it, vi } from "vitest";

import { collectHorizonOwnership } from "./ownership.js";

const issuer = Keypair.random().publicKey();

function account(accountId: string, balance: string, ledger = 100, code = "SORA") {
  return {
    id: accountId,
    account_id: accountId,
    paging_token: String(BigInt(ledger) * 10_000n),
    last_modified_ledger: ledger,
    balances: [{ asset_type: "credit_alphanum4", asset_code: code, asset_issuer: issuer, balance }],
  };
}

function response(records: unknown[], nextHref?: string) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      _embedded: { records },
      _links: nextHref === undefined ? {} : { next: { href: nextHref } },
    }),
  };
}

function next(cursor: string, origin = "https://horizon-testnet.stellar.org") {
  return `${origin}/accounts?asset=SORA%3A${issuer}&order=asc&limit=200&cursor=${cursor}`;
}

describe("fixed-origin Horizon ownership collection", () => {
  it("validates zero balances but excludes them from the canonical holder corpus", async () => {
    const accounts = [Keypair.random().publicKey(), Keypair.random().publicKey()].sort();
    const fetcher = vi.fn(async () =>
      response([account(accounts[0]!, "0"), account(accounts[1]!, "2.5")]),
    );
    const result = await collectHorizonOwnership({
      assetCode: "SORA",
      issuerAccount: issuer,
      fetcher,
    });
    expect(result.holders).toEqual([
      expect.objectContaining({
        account: accounts[1],
        balance: "2.5000000",
        balanceUnits: 25_000_000n,
      }),
    ]);
    expect(result.observedUnits).toBe(25_000_000n);
    expect(result.holdersHash).toMatch(/^[a-f0-9]{64}$/);
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringMatching(/^https:\/\/horizon-testnet\.stellar\.org\/accounts\?/),
      expect.objectContaining({ method: "GET", redirect: "error" }),
    );
  });

  it("collects and stages strictly ordered multipage results", async () => {
    const accounts = Array.from({ length: 201 }, () => Keypair.random().publicKey()).sort();
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        response(
          accounts.slice(0, 200).map((id) => account(id, "0.0000001")),
          next("200"),
        ),
      )
      .mockResolvedValueOnce(response([account(accounts[200]!, "0.0000001", 101)]));
    const onPage = vi.fn(async () => undefined);
    const result = await collectHorizonOwnership({
      assetCode: "SORA",
      issuerAccount: issuer,
      fetcher,
      onPage,
    });
    expect(result).toMatchObject({
      pageCount: 2,
      observedUnits: 201n,
      firstLedger: 100,
      lastLedger: 101,
    });
    expect(result.holders).toHaveLength(201);
    expect(onPage).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[1]?.[0]).toBe(next("200"));
  });

  it("rejects duplicate or descending accounts across a page boundary", async () => {
    const accounts = Array.from({ length: 200 }, () => Keypair.random().publicKey()).sort();
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        response(
          accounts.map((id) => account(id, "1")),
          next("same"),
        ),
      )
      .mockResolvedValueOnce(response([account(accounts[199]!, "1")]));
    await expect(
      collectHorizonOwnership({ assetCode: "SORA", issuerAccount: issuer, fetcher }),
    ).rejects.toThrow("HORIZON_ACCOUNT_ORDER_INVALID");
  });

  it("rejects a cursor loop even when subsequent account ordering is valid", async () => {
    const accounts = Array.from({ length: 400 }, () => Keypair.random().publicKey()).sort();
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        response(
          accounts.slice(0, 200).map((id) => account(id, "1")),
          next("loop"),
        ),
      )
      .mockResolvedValueOnce(
        response(
          accounts.slice(200).map((id) => account(id, "1")),
          next("loop"),
        ),
      );
    await expect(
      collectHorizonOwnership({ assetCode: "SORA", issuerAccount: issuer, fetcher }),
    ).rejects.toThrow("HORIZON_CURSOR_LOOP");
  });

  it.each([
    ["foreign origin", next("1", "https://evil.test"), "HORIZON_PAGINATION_INVALID"],
    [
      "missing cursor",
      `https://horizon-testnet.stellar.org/accounts?asset=SORA%3A${issuer}&order=asc&limit=200`,
      "HORIZON_PAGINATION_INVALID",
    ],
    [
      "changed identity",
      `https://horizon-testnet.stellar.org/accounts?asset=EVIL%3A${issuer}&order=asc&limit=200&cursor=1`,
      "HORIZON_PAGINATION_INVALID",
    ],
  ])("rejects a %s pagination link", async (_name, href, error) => {
    const accounts = Array.from({ length: 200 }, () => Keypair.random().publicKey()).sort();
    await expect(
      collectHorizonOwnership({
        assetCode: "SORA",
        issuerAccount: issuer,
        fetcher: async () =>
          response(
            accounts.map((id) => account(id, "1")),
            href,
          ),
      }),
    ).rejects.toThrow(error);
  });

  it("rejects malformed balances and mismatched asset identities", async () => {
    const id = Keypair.random().publicKey();
    await expect(
      collectHorizonOwnership({
        assetCode: "SORA",
        issuerAccount: issuer,
        fetcher: async () => response([account(id, "1.00000001")]),
      }),
    ).rejects.toThrow("INVALID_HOLDER_BALANCE");
    await expect(
      collectHorizonOwnership({
        assetCode: "SORA",
        issuerAccount: issuer,
        fetcher: async () => response([account(id, "1", 100, "OTHER")]),
      }),
    ).rejects.toThrow("HORIZON_ASSET_IDENTITY_INVALID");
  });

  it("maps rate limits and other non-success responses to safe errors", async () => {
    await expect(
      collectHorizonOwnership({
        assetCode: "SORA",
        issuerAccount: issuer,
        fetcher: async () => ({ ok: false, status: 429, json: async () => ({ secret: "no" }) }),
      }),
    ).rejects.toThrow("HORIZON_RATE_LIMITED");
    await expect(
      collectHorizonOwnership({
        assetCode: "SORA",
        issuerAccount: issuer,
        fetcher: async () => ({ ok: false, status: 503, json: async () => ({ secret: "no" }) }),
      }),
    ).rejects.toThrow("HORIZON_UNAVAILABLE");
    await expect(
      collectHorizonOwnership({
        assetCode: "SORA",
        issuerAccount: issuer,
        fetcher: async () => {
          throw new DOMException("Timed out", "TimeoutError");
        },
      }),
    ).rejects.toThrow("HORIZON_UNAVAILABLE");
  });
});
