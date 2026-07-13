import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { Horizon, Keypair, type Transaction } from "@stellar/stellar-sdk";

import { STELLAR_TESTNET_CONFIG } from "./config.js";
import { sanitizeForEvidence, sanitizedError } from "./redaction.js";
import {
  buildIssuancePaymentTransaction,
  buildTrustlineTransaction,
  precomputedHash,
} from "./transactions.js";

const ASSET_AMOUNT = "25";
const TRUST_LIMIT = "1000";
const outputPath = fileURLToPath(
  new URL("../../../../docs/phase-0/evidence/testnet-issuance.json", import.meta.url),
);

interface SubmissionProof {
  hash: string;
  ledger: number;
  successful: boolean;
  reconciledAfterUncertainSubmission: boolean;
}

async function submitOnceOrReconcile(
  server: Horizon.Server,
  transaction: Transaction,
  hash: string,
): Promise<SubmissionProof> {
  try {
    const result = await server.submitTransaction(transaction);
    return {
      hash: result.hash,
      ledger: result.ledger,
      successful: result.successful,
      reconciledAfterUncertainSubmission: false,
    };
  } catch (submissionError) {
    try {
      const found = await server.transactions().transaction(hash).call();
      return {
        hash: found.hash,
        ledger: found.ledger_attr,
        successful: found.successful,
        reconciledAfterUncertainSubmission: true,
      };
    } catch (hashLookupError) {
      const account = await server.loadAccount(transaction.source);
      const sequenceConsumed = BigInt(account.sequence) >= BigInt(transaction.sequence);
      throw new Error(
        JSON.stringify(
          sanitizeForEvidence({
            message: "Submission is ambiguous; no retry was attempted",
            transactionHash: hash,
            sourceAccount: transaction.source,
            transactionSequence: transaction.sequence,
            observedAccountSequence: account.sequence,
            sequenceConsumed,
            submissionError: sanitizedError(submissionError),
            hashLookupError: sanitizedError(hashLookupError),
          }),
        ),
      );
    }
  }
}

async function run() {
  const startedAt = new Date().toISOString();
  const server = new Horizon.Server(STELLAR_TESTNET_CONFIG.horizonUrl);
  const issuer = Keypair.random();
  const distributor = Keypair.random();
  const assetCode = `SORA${Date.now().toString(36).slice(-7).toUpperCase()}`.slice(0, 12);

  await Promise.all([
    server.friendbot(issuer.publicKey()).call(),
    server.friendbot(distributor.publicKey()).call(),
  ]);

  const [issuerBefore, distributorBefore] = await Promise.all([
    server.loadAccount(issuer.publicKey()),
    server.loadAccount(distributor.publicKey()),
  ]);

  const trustline = buildTrustlineTransaction({
    sourceAccount: distributor.publicKey(),
    sourceSequence: distributorBefore.sequence,
    assetCode,
    issuerAccount: issuer.publicKey(),
    limit: TRUST_LIMIT,
  });
  const trustlineHash = precomputedHash(trustline);
  trustline.sign(distributor);
  const trustlineResult = await submitOnceOrReconcile(server, trustline, trustlineHash);

  const issuerForPayment = await server.loadAccount(issuer.publicKey());
  const payment = buildIssuancePaymentTransaction({
    sourceAccount: issuer.publicKey(),
    sourceSequence: issuerForPayment.sequence,
    assetCode,
    distributorAccount: distributor.publicKey(),
    amount: ASSET_AMOUNT,
  });
  const paymentHash = precomputedHash(payment);
  payment.sign(issuer);
  const paymentResult = await submitOnceOrReconcile(server, payment, paymentHash);

  const distributorAfter = await server.loadAccount(distributor.publicKey());
  const balance = distributorAfter.balances.find(
    (line) =>
      "asset_code" in line &&
      line.asset_code === assetCode &&
      line.asset_issuer === issuer.publicKey(),
  );
  if (!balance || !("limit" in balance) || balance.balance !== `${ASSET_AMOUNT}.0000000`) {
    throw new Error("Post-issuance Trustline balance verification failed");
  }

  const evidence = sanitizeForEvidence({
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    startedAt,
    network: STELLAR_TESTNET_CONFIG.uiLabel,
    asset: {
      code: assetCode,
      amount: ASSET_AMOUNT,
      trustLimit: TRUST_LIMIT,
      issuer: issuer.publicKey(),
    },
    accounts: { issuer: issuer.publicKey(), distributor: distributor.publicKey() },
    preState: {
      issuerSequence: issuerBefore.sequence,
      distributorSequence: distributorBefore.sequence,
      trustlineExists: false,
    },
    operations: {
      changeTrust: {
        ...trustlineResult,
        precomputedHash: trustlineHash,
        source: distributor.publicKey(),
        purpose: "trustline",
      },
      issuancePayment: {
        ...paymentResult,
        precomputedHash: paymentHash,
        source: issuer.publicKey(),
        purpose: "issuance-payment",
      },
    },
    postState: {
      trustlineExists: true,
      authorized: balance.is_authorized,
      authorizationToMaintainLiabilities: balance.is_authorized_to_maintain_liabilities,
      limit: balance.limit,
      balance: balance.balance,
      lastModifiedLedger: balance.last_modified_ledger,
    },
    explorer: {
      issuer: `${STELLAR_TESTNET_CONFIG.explorerUrl}/account/${issuer.publicKey()}`,
      distributor: `${STELLAR_TESTNET_CONFIG.explorerUrl}/account/${distributor.publicKey()}`,
      changeTrustTransaction: `${STELLAR_TESTNET_CONFIG.explorerUrl}/tx/${trustlineHash}`,
      issuanceTransaction: `${STELLAR_TESTNET_CONFIG.explorerUrl}/tx/${paymentHash}`,
    },
    policy: "Ephemeral accounts; secrets were kept in memory and are not present in this evidence.",
  });

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, {
    encoding: "utf8",
    flag: "w",
  });
  console.log(`Sanitized Testnet evidence written to ${outputPath}`);
}

run().catch((error) => {
  console.error(JSON.stringify(sanitizedError(error)));
  process.exitCode = 1;
});
