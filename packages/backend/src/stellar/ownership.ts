import { createHash } from "node:crypto";

import { StrKey } from "@stellar/stellar-sdk";

import {
  OWNERSHIP_MAX_HOLDERS,
  OWNERSHIP_MAX_PAGES,
  assertStrictHolderOrder,
  canonicalHolderLine,
  canonicalizeHolderAmount,
  type OwnershipHolder,
} from "../domain/ownership.js";
import { TESTNET_HORIZON_URL } from "./config.js";

export const HORIZON_ACCOUNTS_PATH = "/accounts";
export const HORIZON_OWNERSHIP_PAGE_SIZE = 200;

type FetchLike = (
  input: string,
  init?: RequestInit,
) => Promise<Pick<Response, "ok" | "status" | "json">>;

interface HorizonBalance {
  balance?: unknown;
  asset_code?: unknown;
  asset_issuer?: unknown;
  asset_type?: unknown;
}

interface HorizonAccount {
  account_id?: unknown;
  id?: unknown;
  paging_token?: unknown;
  last_modified_ledger?: unknown;
  balances?: unknown;
}

export interface HorizonOwnershipResult {
  holders: OwnershipHolder[];
  observedUnits: bigint;
  holdersHash: string;
  pageCount: number;
  firstLedger?: number;
  lastLedger?: number;
}

export interface HorizonOwnershipPage {
  pageNumber: number;
  holders: OwnershipHolder[];
}

export async function collectHorizonOwnership(input: {
  assetCode: string;
  issuerAccount: string;
  fetcher?: FetchLike;
  onPage?: (page: HorizonOwnershipPage) => Promise<void>;
}): Promise<HorizonOwnershipResult> {
  if (!/^[A-Z0-9]{1,12}$/.test(input.assetCode)) throw new Error("HORIZON_ASSET_IDENTITY_INVALID");
  if (!StrKey.isValidEd25519PublicKey(input.issuerAccount)) {
    throw new Error("HORIZON_ASSET_IDENTITY_INVALID");
  }
  const fetcher = input.fetcher ?? fetch;
  const asset = `${input.assetCode}:${input.issuerAccount}`;
  let nextUrl = ownershipPageUrl(asset);
  let previousUrl: string | undefined;
  let previousAccount: string | undefined;
  let pageCount = 0;
  let observedUnits = 0n;
  let firstLedger: number | undefined;
  let lastLedger: number | undefined;
  const holders: OwnershipHolder[] = [];
  const hash = createHash("sha256");

  while (nextUrl !== null) {
    pageCount += 1;
    if (pageCount > OWNERSHIP_MAX_PAGES) throw new Error("HORIZON_PAGE_LIMIT_EXCEEDED");
    let response;
    try {
      response = await fetcher(nextUrl, {
        method: "GET",
        headers: { accept: "application/hal+json, application/json" },
        redirect: "error",
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      throw new Error("HORIZON_UNAVAILABLE");
    }
    if (!response.ok) {
      if (response.status === 429) throw new Error("HORIZON_RATE_LIMITED");
      throw new Error("HORIZON_UNAVAILABLE");
    }
    const payload = await response.json();
    const page = parsePage(payload, input.assetCode, input.issuerAccount);
    assertStrictHolderOrder(page.allAccounts, previousAccount);
    previousAccount = page.allAccounts.at(-1)?.account ?? previousAccount;

    const nonzero = page.allAccounts.filter((holder) => holder.balanceUnits > 0n);
    if (holders.length + nonzero.length > OWNERSHIP_MAX_HOLDERS) {
      throw new Error("HORIZON_HOLDER_LIMIT_EXCEEDED");
    }
    for (const holder of nonzero) {
      observedUnits += holder.balanceUnits;
      holders.push(holder);
      hash.update(canonicalHolderLine(holder), "utf8");
    }
    if (page.allAccounts.length > 0) {
      const ledgers = page.allAccounts.map((holder) => holder.ledger);
      const pageFirst = Math.min(...ledgers);
      const pageLast = Math.max(...ledgers);
      firstLedger = firstLedger === undefined ? pageFirst : Math.min(firstLedger, pageFirst);
      lastLedger = lastLedger === undefined ? pageLast : Math.max(lastLedger, pageLast);
    }
    await input.onPage?.({ pageNumber: pageCount, holders: nonzero });

    if (page.allAccounts.length < HORIZON_OWNERSHIP_PAGE_SIZE) break;
    if (pageCount === OWNERSHIP_MAX_PAGES) throw new Error("HORIZON_PAGE_LIMIT_EXCEEDED");
    const candidate = page.nextHref;
    if (!candidate) throw new Error("HORIZON_PAGINATION_INVALID");
    nextUrl = validateNextUrl(candidate, asset);
    if (nextUrl === previousUrl || nextUrl === ownershipPageUrl(asset)) {
      throw new Error("HORIZON_CURSOR_LOOP");
    }
    previousUrl = nextUrl;
  }

  return {
    holders,
    observedUnits,
    holdersHash: hash.digest("hex"),
    pageCount,
    firstLedger,
    lastLedger,
  };
}

function ownershipPageUrl(asset: string): string {
  const url = new URL(HORIZON_ACCOUNTS_PATH, TESTNET_HORIZON_URL);
  url.searchParams.set("asset", asset);
  url.searchParams.set("order", "asc");
  url.searchParams.set("limit", String(HORIZON_OWNERSHIP_PAGE_SIZE));
  return url.toString();
}

function validateNextUrl(value: unknown, asset: string): string {
  if (typeof value !== "string") throw new Error("HORIZON_PAGINATION_INVALID");
  let provided: URL;
  try {
    provided = new URL(value);
  } catch {
    throw new Error("HORIZON_PAGINATION_INVALID");
  }
  if (
    provided.origin !== TESTNET_HORIZON_URL ||
    provided.pathname !== HORIZON_ACCOUNTS_PATH ||
    provided.username ||
    provided.password ||
    provided.hash
  ) {
    throw new Error("HORIZON_PAGINATION_INVALID");
  }
  const allowed = new Set(["asset", "order", "limit", "cursor"]);
  if ([...provided.searchParams.keys()].some((key) => !allowed.has(key))) {
    throw new Error("HORIZON_PAGINATION_INVALID");
  }
  if (
    provided.searchParams.get("asset") !== asset ||
    provided.searchParams.get("order") !== "asc" ||
    provided.searchParams.get("limit") !== String(HORIZON_OWNERSHIP_PAGE_SIZE) ||
    !provided.searchParams.get("cursor")
  ) {
    throw new Error("HORIZON_PAGINATION_INVALID");
  }
  // Reconstruct rather than trusting any serialized link details.
  const reconstructed = new URL(HORIZON_ACCOUNTS_PATH, TESTNET_HORIZON_URL);
  reconstructed.searchParams.set("asset", asset);
  reconstructed.searchParams.set("order", "asc");
  reconstructed.searchParams.set("limit", String(HORIZON_OWNERSHIP_PAGE_SIZE));
  reconstructed.searchParams.set("cursor", provided.searchParams.get("cursor")!);
  return reconstructed.toString();
}

function parsePage(
  value: unknown,
  assetCode: string,
  issuerAccount: string,
): { allAccounts: OwnershipHolder[]; nextHref?: unknown } {
  if (!isRecord(value) || !isRecord(value._embedded) || !Array.isArray(value._embedded.records)) {
    throw new Error("HORIZON_RESPONSE_INVALID");
  }
  if (value._embedded.records.length > HORIZON_OWNERSHIP_PAGE_SIZE) {
    throw new Error("HORIZON_RESPONSE_INVALID");
  }
  const allAccounts = value._embedded.records.map((record) =>
    parseAccount(record, assetCode, issuerAccount),
  );
  const nextHref =
    isRecord(value._links) && isRecord(value._links.next) ? value._links.next.href : undefined;
  return { allAccounts, nextHref };
}

function parseAccount(value: unknown, assetCode: string, issuerAccount: string): OwnershipHolder {
  if (!isRecord(value)) throw new Error("HORIZON_ACCOUNT_INVALID");
  const account = value as HorizonAccount;
  if (
    typeof account.account_id !== "string" ||
    account.id !== account.account_id ||
    !StrKey.isValidEd25519PublicKey(account.account_id) ||
    typeof account.paging_token !== "string" ||
    !/^[0-9]+$/.test(account.paging_token) ||
    !Number.isSafeInteger(account.last_modified_ledger) ||
    Number(account.last_modified_ledger) < 0 ||
    !Array.isArray(account.balances)
  ) {
    throw new Error("HORIZON_ACCOUNT_INVALID");
  }
  const matching = (account.balances as HorizonBalance[]).filter(
    (balance) => balance.asset_code === assetCode && balance.asset_issuer === issuerAccount,
  );
  if (matching.length !== 1 || typeof matching[0]?.balance !== "string") {
    throw new Error("HORIZON_ASSET_IDENTITY_INVALID");
  }
  const canonical = canonicalizeHolderAmount(matching[0].balance);
  return {
    account: account.account_id,
    balanceUnits: canonical.units,
    balance: canonical.amount,
    ledger: Number(account.last_modified_ledger),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
