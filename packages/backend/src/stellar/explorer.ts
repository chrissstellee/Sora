import { StrKey } from "@stellar/stellar-sdk";

const TESTNET_EXPLORER_URL = "https://stellar.expert/explorer/testnet";

export type StellarExplorerResource = "account" | "tx" | "ledger" | "asset";

export type StellarExplorerTarget =
  | { resource: "account"; id: string }
  | { resource: "tx"; id: string }
  | { resource: "ledger"; id: number | string }
  | { resource: "asset"; code: string; issuer: string };

export function stellarExpertUrl(target: StellarExplorerTarget): string | null {
  let segment: string;
  if (target.resource === "account") {
    if (!StrKey.isValidEd25519PublicKey(target.id)) return null;
    segment = `account/${target.id}`;
  } else if (target.resource === "tx") {
    if (!/^[a-fA-F0-9]{64}$/.test(target.id)) return null;
    segment = `tx/${target.id.toLowerCase()}`;
  } else if (target.resource === "ledger") {
    const ledger = typeof target.id === "number" ? String(target.id) : target.id;
    if (!/^[1-9]\d*$/.test(ledger) || !Number.isSafeInteger(Number(ledger))) return null;
    segment = `ledger/${ledger}`;
  } else {
    if (!/^[A-Z0-9]{1,12}$/.test(target.code)) return null;
    if (!StrKey.isValidEd25519PublicKey(target.issuer)) return null;
    segment = `asset/${target.code}-${target.issuer}`;
  }
  const url = new URL(`${TESTNET_EXPLORER_URL}/${segment}`);
  if (
    url.origin !== "https://stellar.expert" ||
    !url.pathname.startsWith("/explorer/testnet/") ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  ) {
    return null;
  }
  return url.toString();
}
