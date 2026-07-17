const STELLAR_AMOUNT_SCALE = 10_000_000n;
const MAX_SIGNED_INT64 = 9_223_372_036_854_775_807n;

export const OWNERSHIP_PERCENT_SCALE = 10_000n;
export const OWNERSHIP_MAX_PAGES = 50;
export const OWNERSHIP_MAX_HOLDERS = 10_000;

export interface CanonicalHolderAmount {
  units: bigint;
  amount: string;
}

export interface OwnershipHolder {
  account: string;
  balanceUnits: bigint;
  balance: string;
  ledger: number;
}

export function canonicalizeHolderAmount(value: string): CanonicalHolderAmount {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d{1,7})?$/.test(normalized)) {
    throw new Error("INVALID_HOLDER_BALANCE");
  }
  const [integer = "0", fraction = ""] = normalized.split(".");
  const units = BigInt(integer) * STELLAR_AMOUNT_SCALE + BigInt(fraction.padEnd(7, "0") || "0");
  if (units < 0n || units > MAX_SIGNED_INT64) throw new Error("INVALID_HOLDER_BALANCE");
  return { units, amount: formatStellarUnits(units) };
}

export function formatStellarUnits(units: bigint): string {
  if (units < 0n || units > MAX_SIGNED_INT64) throw new Error("INVALID_HOLDER_BALANCE");
  const whole = units / STELLAR_AMOUNT_SCALE;
  const fraction = (units % STELLAR_AMOUNT_SCALE).toString().padStart(7, "0");
  return `${whole}.${fraction}`;
}

export function ownershipShare(balanceUnits: bigint, totalUnits: bigint): string {
  if (balanceUnits < 0n || totalUnits <= 0n || balanceUnits > totalUnits) {
    throw new Error("INVALID_OWNERSHIP_SHARE");
  }
  // Percentage scaled to four decimal places. Adding half the denominator gives
  // deterministic round-half-up behavior without crossing through Number.
  const scaled = (balanceUnits * 100n * OWNERSHIP_PERCENT_SCALE + totalUnits / 2n) / totalUnits;
  const whole = scaled / OWNERSHIP_PERCENT_SCALE;
  const fraction = (scaled % OWNERSHIP_PERCENT_SCALE).toString().padStart(4, "0");
  return `${whole}.${fraction}`;
}

export function canonicalHolderLine(holder: Pick<OwnershipHolder, "account" | "balance">): string {
  return `${holder.account}|${holder.balance}\n`;
}

export function assertStrictHolderOrder(
  holders: readonly OwnershipHolder[],
  previousAccount?: string,
): void {
  let last = previousAccount;
  for (const holder of holders) {
    if (last !== undefined && holder.account <= last)
      throw new Error("HORIZON_ACCOUNT_ORDER_INVALID");
    last = holder.account;
  }
}

export function normalizeAccountSearch(value: string): string {
  const normalized = value.normalize("NFKC").trim().toUpperCase();
  if (!/^G[A-Z2-7]{0,55}$/.test(normalized)) throw new Error("INVALID_ACCOUNT_SEARCH");
  return normalized;
}
