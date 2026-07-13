export const ISSUANCE_STATUSES = [
  "pending",
  "submitted",
  "confirmed",
  "failed",
  "ambiguous",
] as const;

export type IssuanceStatus = (typeof ISSUANCE_STATUSES)[number];

export interface TransactionIdentity {
  hash: string;
  sourceAccount: string;
  sequence: string;
  operationPurpose: "trustline" | "issuance-payment";
  submissionIdentity: string;
  submittedAt: string;
  horizonResult?: "success" | "failed" | "unknown";
  ledger?: number;
}

export interface ReconciliationEvidence {
  checkedAt: string;
  methods: Array<"transaction-hash" | "account-sequence">;
  outcome: "confirmed" | "failed" | "unresolved" | "safe-to-retry";
  horizonResult?: "success" | "failed" | "not-found";
  ledger?: number;
  observedSourceSequence?: string;
  transactionSequence?: string;
  detail: string;
}

export interface IssuanceRecord {
  id: string;
  logicalKey: string;
  status: IssuanceStatus;
  transaction?: TransactionIdentity;
  reconciliationEvidence: ReconciliationEvidence[];
  createdAt: string;
  updatedAt: string;
}

export interface AtomicClaimResult {
  record: IssuanceRecord;
  claimed: boolean;
}

export interface IssuanceRepository {
  claim(logicalKey: string, create: () => IssuanceRecord): Promise<AtomicClaimResult>;
  save(record: IssuanceRecord): Promise<IssuanceRecord>;
}

export interface IssuanceSubmitAdapter {
  prepare(logicalKey: string): Promise<TransactionIdentity>;
  submit(record: IssuanceRecord): Promise<TransactionIdentity>;
}

export interface HorizonReconciler {
  reconcile(record: IssuanceRecord): Promise<ReconciliationEvidence>;
}

export interface RequestIssuanceInput {
  logicalKey: string;
  repository: IssuanceRepository;
  submitAdapter: IssuanceSubmitAdapter;
  now?: () => Date;
  createId?: () => string;
}

const ALLOWED_TRANSITIONS: Record<IssuanceStatus, readonly IssuanceStatus[]> = {
  pending: ["submitted", "failed"],
  submitted: ["confirmed", "failed", "ambiguous"],
  ambiguous: ["confirmed", "failed"],
  failed: ["pending"],
  confirmed: [],
};

export function transitionIssuance(
  record: IssuanceRecord,
  status: IssuanceStatus,
  options: { reconciled?: boolean; now?: Date } = {},
): IssuanceRecord {
  if (!ALLOWED_TRANSITIONS[record.status].includes(status)) {
    throw new Error(`Invalid issuance transition: ${record.status} -> ${status}`);
  }
  if (
    (record.status === "ambiguous" || (record.status === "failed" && status === "pending")) &&
    !options.reconciled
  ) {
    throw new Error("This issuance transition requires reconciliation evidence");
  }
  return { ...record, status, updatedAt: (options.now ?? new Date()).toISOString() };
}

export async function requestIssuance(input: RequestIssuanceInput): Promise<IssuanceRecord> {
  const now = input.now ?? (() => new Date());
  const createdAt = now().toISOString();
  const preparedTransaction = await input.submitAdapter.prepare(input.logicalKey);
  const claim = await input.repository.claim(input.logicalKey, () => ({
    id: input.createId?.() ?? crypto.randomUUID(),
    logicalKey: input.logicalKey,
    status: "pending",
    transaction: preparedTransaction,
    reconciliationEvidence: [],
    createdAt,
    updatedAt: createdAt,
  }));

  if (!claim.claimed) return claim.record;

  try {
    const transaction = await input.submitAdapter.submit(claim.record);
    return input.repository.save({
      ...transitionIssuance(claim.record, "submitted", { now: now() }),
      transaction,
    });
  } catch (error) {
    if (error instanceof UncertainSubmissionError) {
      const submitted = transitionIssuance(claim.record, "submitted", { now: now() });
      return input.repository.save({
        ...transitionIssuance(submitted, "ambiguous", { now: now() }),
      });
    }
    return input.repository.save(transitionIssuance(claim.record, "failed", { now: now() }));
  }
}

export class UncertainSubmissionError extends Error {
  constructor() {
    super("Transaction submission result is uncertain; reconciliation is required");
    this.name = "UncertainSubmissionError";
  }
}

export async function reconcileIssuance(input: {
  record: IssuanceRecord;
  repository: IssuanceRepository;
  reconciler: HorizonReconciler;
}): Promise<IssuanceRecord> {
  if (
    input.record.status !== "pending" &&
    input.record.status !== "ambiguous" &&
    input.record.status !== "failed"
  ) {
    throw new Error(`Issuance in ${input.record.status} cannot be reconciled`);
  }
  if (!input.record.transaction) {
    throw new Error("Issuance cannot be reconciled without a precomputed transaction identity");
  }
  const evidence = await input.reconciler.reconcile(input.record);
  validateReconciliationEvidence(evidence);
  const withEvidence = {
    ...input.record,
    reconciliationEvidence: [...input.record.reconciliationEvidence, evidence],
  };
  if (evidence.outcome === "unresolved") return input.repository.save(withEvidence);

  if (input.record.status === "pending" && evidence.outcome === "confirmed") {
    const submitted = transitionIssuance(withEvidence, "submitted", { reconciled: true });
    return input.repository.save(transitionIssuance(submitted, "confirmed", { reconciled: true }));
  }

  const target =
    evidence.outcome === "confirmed"
      ? "confirmed"
      : evidence.outcome === "safe-to-retry"
        ? "pending"
        : "failed";
  if (target === input.record.status) return input.repository.save(withEvidence);
  return input.repository.save(transitionIssuance(withEvidence, target, { reconciled: true }));
}

function validateReconciliationEvidence(evidence: ReconciliationEvidence): void {
  if (evidence.outcome === "unresolved") return;
  const methods = new Set(evidence.methods);
  if (!methods.has("transaction-hash") || !methods.has("account-sequence")) {
    throw new Error(
      "Conclusive reconciliation requires transaction-hash and account-sequence evidence",
    );
  }
  if (evidence.outcome === "safe-to-retry") {
    if (
      evidence.horizonResult !== "not-found" ||
      evidence.observedSourceSequence === undefined ||
      evidence.transactionSequence === undefined ||
      BigInt(evidence.observedSourceSequence) >= BigInt(evidence.transactionSequence)
    ) {
      throw new Error("Safe recovery requires a missing hash and an unconsumed source sequence");
    }
  }
}
