export const ISSUANCE_STATUSES = ["Pending", "Submitted", "Confirmed", "Failed"] as const;
export const ISSUANCE_STEP_STATES = [
  "Prepared",
  "Submitted",
  "Reconciling",
  "Confirmed",
  "SafeToRetry",
  "NeedsReview",
] as const;
export const ISSUANCE_RETRY_DELAYS_SECONDS = [15, 30, 60, 120, 300] as const;

export type IssuanceStatus = (typeof ISSUANCE_STATUSES)[number];
export type IssuanceStepState = (typeof ISSUANCE_STEP_STATES)[number];
export type IssuancePurpose = "trustline" | "issuance-payment";

export interface DurableTransactionIdentity {
  network: "Testnet";
  purpose: IssuancePurpose;
  attemptNumber: number;
  sourceAccount: string;
  sequence: string;
  baseFee: string;
  minTime: number;
  maxTime: number;
  assetCode: string;
  issuerAccount: string;
  distributorAccount: string;
  amount: string;
  hash: string;
}

export type HashEvidence =
  | { result: "FoundSuccess"; ledger: number; ledgerCloseTime: number }
  | { result: "FoundFailed"; ledger: number; ledgerCloseTime: number }
  | { result: "Missing" }
  | { result: "Unavailable" };

export type ReconciliationDecision =
  | "Confirmed"
  | "Failed"
  | "IdenticalResubmission"
  | "SafeToRetry"
  | "Reconciling"
  | "NeedsReview";

export function reconciliationDecision(input: {
  identity: DurableTransactionIdentity;
  hash: HashEvidence;
  observedSourceSequence?: string;
  latestClosedLedgerTime?: number;
}): ReconciliationDecision {
  if (input.hash.result === "FoundSuccess") return "Confirmed";
  if (input.hash.result === "FoundFailed") return "Failed";
  if (input.hash.result === "Unavailable") return "Reconciling";
  if (input.observedSourceSequence === undefined || input.latestClosedLedgerTime === undefined) {
    return "Reconciling";
  }
  const observed = BigInt(input.observedSourceSequence);
  const expected = BigInt(input.identity.sequence);
  if (observed >= expected) return "NeedsReview";
  if (observed !== expected - 1n) return "NeedsReview";
  if (input.latestClosedLedgerTime <= input.identity.maxTime) return "IdenticalResubmission";
  return "SafeToRetry";
}

export function validateDurableIdentity(identity: DurableTransactionIdentity): void {
  if (identity.network !== "Testnet") throw new Error("ISSUANCE_NETWORK_MISMATCH");
  if (!/^[a-f0-9]{64}$/.test(identity.hash)) throw new Error("INVALID_TRANSACTION_HASH");
  if (!/^\d+$/.test(identity.sequence) || BigInt(identity.sequence) <= 0n) {
    throw new Error("INVALID_TRANSACTION_SEQUENCE");
  }
  if (identity.minTime <= 0 || identity.maxTime - identity.minTime !== 300) {
    throw new Error("INVALID_TRANSACTION_TIME_BOUNDS");
  }
  if (identity.attemptNumber < 1 || !Number.isInteger(identity.attemptNumber)) {
    throw new Error("INVALID_ATTEMPT_NUMBER");
  }
}

export function retryDelaySeconds(attemptNumber: number): number {
  return ISSUANCE_RETRY_DELAYS_SECONDS[
    Math.min(Math.max(attemptNumber - 1, 0), ISSUANCE_RETRY_DELAYS_SECONDS.length - 1)
  ]!;
}

const STATUS_TRANSITIONS: Record<IssuanceStatus, readonly IssuanceStatus[]> = {
  Pending: ["Submitted", "Failed"],
  Submitted: ["Confirmed", "Failed"],
  Confirmed: [],
  Failed: [],
};

export function transitionIssuanceStatus(from: IssuanceStatus, to: IssuanceStatus): IssuanceStatus {
  if (!STATUS_TRANSITIONS[from].includes(to)) {
    throw new Error(`Invalid issuance transition: ${from} -> ${to}`);
  }
  return to;
}
