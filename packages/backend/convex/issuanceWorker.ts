"use node";

import { BASE_FEE, Horizon, Keypair } from "@stellar/stellar-sdk";
import { v } from "convex/values";

import {
  reconciliationDecision,
  type DurableTransactionIdentity,
  type IssuancePurpose,
} from "../src/domain/issuance.js";
import { canonicalizeSupply } from "../src/domain/tokenization.js";
import { STELLAR_TESTNET_CONFIG } from "../src/stellar/config.js";
import {
  buildIssuancePaymentTransaction,
  buildTrustlineTransaction,
  precomputedHash,
} from "../src/stellar/transactions.js";
import { internal } from "./_generated/api.js";
import { internalAction, type ActionCtx } from "./_generated/server.js";

interface WorkerIssuance {
  issuanceId: string;
  organizationId: string;
  assetId: string;
  status: "Pending" | "Submitted" | "Confirmed" | "Failed";
  assetCode: string;
  supply: string;
  issuerAccount: string;
  distributorAccount: string;
  trustlineState: string;
  paymentState: string;
}

interface WorkerAttempt {
  issuanceId: string;
  purpose: IssuancePurpose;
  attemptNumber: number;
  state: "Prepared" | "Submitted" | "Reconciling" | "Confirmed" | "SafeToRetry" | "NeedsReview";
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
  fencingToken: bigint;
}

interface WorkerSnapshot {
  issuance: WorkerIssuance;
  attempts: WorkerAttempt[];
}

interface Custody {
  issuer: Keypair;
  distributor: Keypair;
}

const server = new Horizon.Server(STELLAR_TESTNET_CONFIG.horizonUrl);

export const process = internalAction({
  args: { issuanceId: v.string() },
  handler: async (ctx, args): Promise<null> => {
    const snapshot: WorkerSnapshot = await ctx.runQuery(internal.issuances.workerSnapshot, args);
    if (snapshot.issuance.status === "Confirmed" || snapshot.issuance.status === "Failed")
      return null;
    let custody: Custody;
    try {
      custody = configuredCustody(snapshot.issuance);
    } catch {
      await ctx.runMutation(internal.issuances.failPreflight, {
        issuanceId: args.issuanceId,
        safeErrorCode: "ISSUANCE_CUSTODY_INVALID",
      });
      return null;
    }
    try {
      await preflightAccounts(snapshot.issuance, custody);
    } catch (error) {
      const terminal =
        httpStatus(error) === 404 ||
        (error instanceof Error && error.message === "SIGNER_REJECTED");
      if (terminal) {
        await ctx.runMutation(internal.issuances.failPreflight, {
          issuanceId: args.issuanceId,
          safeErrorCode: "ISSUANCE_PREFLIGHT_FAILED",
        });
      } else {
        await ctx.scheduler.runAfter(300_000, internal.issuanceWorker.process, args);
      }
      return null;
    }

    try {
      if (snapshot.issuance.trustlineState !== "Confirmed") {
        const distributorAccount = await server.loadAccount(snapshot.issuance.distributorAccount);
        const existing = matchingTrustline(distributorAccount, snapshot.issuance);
        if (existing) {
          const ledger = await latestLedger();
          await ctx.runMutation(internal.issuances.confirmTrustline, {
            issuanceId: snapshot.issuance.issuanceId,
            proofType: "verified-existing",
            ledger: ledger.sequence,
            checkedAt: Date.now(),
            limit: existing.limit,
          });
        } else {
          await processPurpose(ctx, snapshot, custody, "trustline");
          return null;
        }
      }
      const refreshed: WorkerSnapshot = await ctx.runQuery(internal.issuances.workerSnapshot, args);
      if (
        refreshed.issuance.trustlineState === "Confirmed" &&
        refreshed.issuance.paymentState !== "Confirmed"
      ) {
        await processPurpose(ctx, refreshed, custody, "issuance-payment");
      }
    } catch {
      await ctx.scheduler.runAfter(300_000, internal.issuanceWorker.process, args);
    }
    return null;
  },
});

async function processPurpose(
  ctx: ActionCtx,
  snapshot: WorkerSnapshot,
  custody: Custody,
  purpose: IssuancePurpose,
): Promise<void> {
  const attempts = snapshot.attempts
    .filter((attempt) => attempt.purpose === purpose)
    .sort((a, b) => b.attemptNumber - a.attemptNumber);
  const latest = attempts[0];
  if (latest?.state === "Confirmed" || latest?.state === "NeedsReview") return;
  if (latest && latest.state !== "SafeToRetry") {
    await reconcileAttempt(ctx, snapshot.issuance, custody, latest);
    return;
  }

  const source =
    purpose === "trustline"
      ? snapshot.issuance.distributorAccount
      : snapshot.issuance.issuerAccount;
  const holderId = crypto.randomUUID();
  const lock: { fencingToken: bigint; leaseExpiresAt: number } | null = await ctx.runMutation(
    internal.issuances.acquireLock,
    { sourceAccount: source, holderId },
  );
  if (!lock) {
    await ctx.scheduler.runAfter(15_000, internal.issuanceWorker.process, {
      issuanceId: snapshot.issuance.issuanceId,
    });
    return;
  }
  const sourceAccount = await server.loadAccount(source);
  const minTime = Math.floor(Date.now() / 1000);
  const maxTime = minTime + 300;
  const transaction =
    purpose === "trustline"
      ? buildTrustlineTransaction({
          sourceAccount: source,
          sourceSequence: sourceAccount.sequence,
          minTime,
          maxTime,
          assetCode: snapshot.issuance.assetCode,
          issuerAccount: snapshot.issuance.issuerAccount,
          limit: snapshot.issuance.supply,
        })
      : buildIssuancePaymentTransaction({
          sourceAccount: source,
          sourceSequence: sourceAccount.sequence,
          minTime,
          maxTime,
          assetCode: snapshot.issuance.assetCode,
          distributorAccount: snapshot.issuance.distributorAccount,
          amount: snapshot.issuance.supply,
        });
  const hash = precomputedHash(transaction);
  const persisted = await ctx.runMutation(internal.issuances.prepareAttempt, {
    issuanceId: snapshot.issuance.issuanceId,
    purpose,
    attemptNumber: (latest?.attemptNumber ?? 0) + 1,
    sourceAccount: source,
    sequence: transaction.sequence,
    baseFee: BASE_FEE,
    minTime,
    maxTime,
    hash,
    fencingToken: lock.fencingToken,
  });
  if (persisted.hash !== hash) throw new Error("ATTEMPT_IDENTITY_CONFLICT");
  transaction.sign(purpose === "trustline" ? custody.distributor : custody.issuer);
  await ctx.runQuery(internal.issuances.authorizeSubmission, {
    hash,
    fencingToken: lock.fencingToken,
  });
  try {
    await server.submitTransaction(transaction);
  } catch {
    await ctx.runMutation(internal.issuances.markSubmitted, {
      hash,
      fencingToken: lock.fencingToken,
    });
    await ctx.runMutation(internal.issuances.scheduleRetry, {
      hash,
      fencingToken: lock.fencingToken,
    });
    return;
  }
  await ctx.runMutation(internal.issuances.markSubmitted, {
    hash,
    fencingToken: lock.fencingToken,
  });
  try {
    await confirmAttempt(ctx, snapshot.issuance, persisted, lock.fencingToken);
  } catch {
    await ctx.runMutation(internal.issuances.scheduleRetry, {
      hash,
      fencingToken: lock.fencingToken,
    });
  }
}

async function reconcileAttempt(
  ctx: ActionCtx,
  issuance: WorkerIssuance,
  custody: Custody,
  attempt: WorkerAttempt,
): Promise<void> {
  const lock: { fencingToken: bigint; leaseExpiresAt: number } | null = await ctx.runMutation(
    internal.issuances.acquireLock,
    { sourceAccount: attempt.sourceAccount, holderId: crypto.randomUUID() },
  );
  if (!lock) {
    await ctx.scheduler.runAfter(15_000, internal.issuanceWorker.process, {
      issuanceId: issuance.issuanceId,
    });
    return;
  }
  const adopted: WorkerAttempt = await ctx.runMutation(internal.issuances.adoptAttemptFence, {
    hash: attempt.hash,
    fencingToken: lock.fencingToken,
  });
  let transactionRecord;
  try {
    transactionRecord = await transactionByHash(adopted.hash);
  } catch {
    await record(ctx, adopted, lock.fencingToken, {
      hashResult: "Unavailable",
      outcome: "Unresolved",
      correlationId: crypto.randomUUID(),
    });
    await ctx.runMutation(internal.issuances.scheduleRetry, {
      hash: adopted.hash,
      fencingToken: lock.fencingToken,
    });
    return;
  }
  if (transactionRecord?.successful) {
    await confirmAttempt(ctx, issuance, adopted, lock.fencingToken, transactionRecord);
    return;
  }
  if (transactionRecord && !transactionRecord.successful) {
    await record(ctx, adopted, lock.fencingToken, {
      hashResult: "Found",
      outcome: "SafeToRetry",
      correlationId: crypto.randomUUID(),
    });
    return;
  }
  const [account, ledger] = await Promise.all([
    server.loadAccount(adopted.sourceAccount),
    latestLedger(),
  ]);
  const identity = attemptIdentity(adopted);
  const decision = reconciliationDecision({
    identity,
    hash: { result: "Missing" },
    observedSourceSequence: account.sequence,
    latestClosedLedgerTime: ledger.closedAt,
  });
  if (decision === "IdenticalResubmission") {
    const transaction = reconstruct(adopted);
    if (precomputedHash(transaction) !== adopted.hash) throw new Error("ATTEMPT_HASH_MISMATCH");
    transaction.sign(adopted.purpose === "trustline" ? custody.distributor : custody.issuer);
    await ctx.runQuery(internal.issuances.authorizeSubmission, {
      hash: adopted.hash,
      fencingToken: lock.fencingToken,
    });
    try {
      await server.submitTransaction(transaction);
    } catch {
      await ctx.runMutation(internal.issuances.markSubmitted, {
        hash: adopted.hash,
        fencingToken: lock.fencingToken,
      });
      await ctx.runMutation(internal.issuances.scheduleRetry, {
        hash: adopted.hash,
        fencingToken: lock.fencingToken,
      });
      return;
    }
    await ctx.runMutation(internal.issuances.markSubmitted, {
      hash: adopted.hash,
      fencingToken: lock.fencingToken,
    });
    await confirmAttempt(ctx, issuance, adopted, lock.fencingToken);
    return;
  }
  const outcome =
    decision === "SafeToRetry"
      ? "SafeToRetry"
      : decision === "NeedsReview"
        ? "NeedsReview"
        : "Unresolved";
  await record(ctx, adopted, lock.fencingToken, {
    hashResult: "Missing",
    observedSequence: account.sequence,
    latestClosedLedger: ledger.sequence,
    latestClosedLedgerTime: ledger.closedAt,
    outcome,
    correlationId: crypto.randomUUID(),
  });
  if (outcome === "Unresolved") {
    await ctx.runMutation(internal.issuances.scheduleRetry, {
      hash: adopted.hash,
      fencingToken: lock.fencingToken,
    });
  }
}

async function confirmAttempt(
  ctx: ActionCtx,
  issuance: WorkerIssuance,
  attempt: WorkerAttempt,
  fencingToken: bigint,
  suppliedRecord?: Awaited<ReturnType<typeof transactionByHash>>,
): Promise<void> {
  const record = suppliedRecord ?? (await transactionByHash(attempt.hash));
  if (!record?.successful) throw new Error("TRANSACTION_NOT_CONFIRMED");
  const checkedAt = Date.now();
  const ledgerCloseTime = Math.floor(Date.parse(record.created_at) / 1000);
  if (attempt.purpose === "trustline") {
    const account = await server.loadAccount(issuance.distributorAccount);
    const trustline = matchingTrustline(account, issuance);
    if (!trustline) throw new Error("TRUSTLINE_PROOF_MISMATCH");
    await ctx.runMutation(internal.issuances.confirmTrustline, {
      issuanceId: issuance.issuanceId,
      hash: attempt.hash,
      fencingToken,
      proofType: "transaction",
      ledger: record.ledger_attr,
      checkedAt,
      limit: trustline.limit,
    });
    await ctx.scheduler.runAfter(0, internal.issuanceWorker.process, {
      issuanceId: issuance.issuanceId,
    });
    return;
  }
  const operations = await server.operations().forTransaction(attempt.hash).limit(10).call();
  const matches = operations.records.some((operation) => {
    if (operation.type !== "payment" || !("asset_code" in operation)) return false;
    return (
      operation.from === issuance.issuerAccount &&
      operation.to === issuance.distributorAccount &&
      operation.asset_code === issuance.assetCode &&
      operation.asset_issuer === issuance.issuerAccount &&
      operation.amount === issuance.supply
    );
  });
  if (!matches) throw new Error("PAYMENT_PROOF_MISMATCH");
  const distributor = await server.loadAccount(issuance.distributorAccount);
  if (!hasExactIssuedBalance(distributor, issuance)) throw new Error("PAYMENT_BALANCE_MISMATCH");
  await ctx.runMutation(internal.issuances.confirmPayment, {
    hash: attempt.hash,
    fencingToken,
    ledger: record.ledger_attr,
    ledgerCloseTime,
    confirmedAt: checkedAt,
  });
}

function configuredCustody(issuance: WorkerIssuance): Custody {
  const issuerSeed = globalThis.process.env.STELLAR_TESTNET_ISSUER_SEED;
  const distributorSeed = globalThis.process.env.STELLAR_TESTNET_DISTRIBUTOR_SEED;
  if (!issuerSeed || !distributorSeed) throw new Error("ISSUANCE_CUSTODY_NOT_CONFIGURED");
  const issuer = Keypair.fromSecret(issuerSeed);
  const distributor = Keypair.fromSecret(distributorSeed);
  if (
    issuer.publicKey() !== issuance.issuerAccount ||
    distributor.publicKey() !== issuance.distributorAccount ||
    issuer.publicKey() === distributor.publicKey()
  ) {
    throw new Error("ISSUANCE_CUSTODY_MISMATCH");
  }
  return { issuer, distributor };
}

async function preflightAccounts(issuance: WorkerIssuance, custody: Custody): Promise<void> {
  const [issuerAccount, distributorAccount] = await Promise.all([
    server.loadAccount(issuance.issuerAccount),
    server.loadAccount(issuance.distributorAccount),
  ]);
  assertSigner(issuerAccount, custody.issuer.publicKey());
  assertSigner(distributorAccount, custody.distributor.publicKey());
}

function assertSigner(
  account: Awaited<ReturnType<typeof server.loadAccount>>,
  publicKey: string,
): void {
  const signer = account.signers.find((candidate) => candidate.key === publicKey);
  if (!signer || signer.weight < account.thresholds.med_threshold)
    throw new Error("SIGNER_REJECTED");
}

function matchingTrustline(
  account: Awaited<ReturnType<typeof server.loadAccount>>,
  issuance: WorkerIssuance,
): { limit: string } | null {
  for (const balance of account.balances) {
    if (
      balance.asset_type !== "native" &&
      "asset_code" in balance &&
      "limit" in balance &&
      balance.asset_code === issuance.assetCode &&
      balance.asset_issuer === issuance.issuerAccount &&
      balance.is_authorized !== false &&
      balance.balance === "0.0000000" &&
      balance.buying_liabilities === "0.0000000" &&
      balance.selling_liabilities === "0.0000000" &&
      canonicalizeSupply(balance.limit).units >= canonicalizeSupply(issuance.supply).units
    ) {
      return { limit: balance.limit };
    }
  }
  return null;
}

function hasExactIssuedBalance(
  account: Awaited<ReturnType<typeof server.loadAccount>>,
  issuance: WorkerIssuance,
): boolean {
  return account.balances.some(
    (balance) =>
      balance.asset_type !== "native" &&
      "asset_code" in balance &&
      balance.asset_code === issuance.assetCode &&
      balance.asset_issuer === issuance.issuerAccount &&
      balance.is_authorized !== false &&
      balance.balance === issuance.supply,
  );
}

async function latestLedger(): Promise<{ sequence: number; closedAt: number }> {
  const response = await server.ledgers().order("desc").limit(1).call();
  const ledger = response.records[0];
  if (!ledger) throw new Error("LEDGER_UNAVAILABLE");
  return { sequence: ledger.sequence, closedAt: Math.floor(Date.parse(ledger.closed_at) / 1000) };
}

async function transactionByHash(hash: string) {
  try {
    return await server.transactions().transaction(hash).call();
  } catch (error) {
    if (httpStatus(error) === 404) return null;
    throw error;
  }
}

function httpStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const response = "response" in error ? error.response : undefined;
  if (!response || typeof response !== "object" || !("status" in response)) return undefined;
  return typeof response.status === "number" ? response.status : undefined;
}

function reconstruct(attempt: WorkerAttempt) {
  const sourceSequence = (BigInt(attempt.sequence) - 1n).toString();
  return attempt.purpose === "trustline"
    ? buildTrustlineTransaction({
        sourceAccount: attempt.sourceAccount,
        sourceSequence,
        minTime: attempt.minTime,
        maxTime: attempt.maxTime,
        assetCode: attempt.assetCode,
        issuerAccount: attempt.issuerAccount,
        limit: attempt.amount,
      })
    : buildIssuancePaymentTransaction({
        sourceAccount: attempt.sourceAccount,
        sourceSequence,
        minTime: attempt.minTime,
        maxTime: attempt.maxTime,
        assetCode: attempt.assetCode,
        distributorAccount: attempt.distributorAccount,
        amount: attempt.amount,
      });
}

function attemptIdentity(attempt: WorkerAttempt): DurableTransactionIdentity {
  return {
    network: "Testnet",
    purpose: attempt.purpose,
    attemptNumber: attempt.attemptNumber,
    sourceAccount: attempt.sourceAccount,
    sequence: attempt.sequence,
    baseFee: attempt.baseFee,
    minTime: attempt.minTime,
    maxTime: attempt.maxTime,
    assetCode: attempt.assetCode,
    issuerAccount: attempt.issuerAccount,
    distributorAccount: attempt.distributorAccount,
    amount: attempt.amount,
    hash: attempt.hash,
  };
}

async function record(
  ctx: ActionCtx,
  attempt: WorkerAttempt,
  fencingToken: bigint,
  evidence: {
    hashResult: "Found" | "Missing" | "Unavailable";
    observedSequence?: string;
    latestClosedLedger?: number;
    latestClosedLedgerTime?: number;
    outcome: "Confirmed" | "Failed" | "Unresolved" | "SafeToRetry" | "NeedsReview";
    correlationId: string;
  },
) {
  return await ctx.runMutation(internal.issuances.recordReconciliation, {
    hash: attempt.hash,
    fencingToken,
    checkedAt: Date.now(),
    ...evidence,
  });
}
