"use node";

import { createHash } from "node:crypto";

import { Horizon, Keypair } from "@stellar/stellar-sdk";
import { v } from "convex/values";

import {
  evaluateDemoPreflight,
  type DemoHorizonPreflight,
  type DemoPreflightSnapshot,
} from "../src/domain/demo.js";
import { canonicalHolderLine, formatStellarUnits } from "../src/domain/ownership.js";
import { STELLAR_TESTNET_CONFIG } from "../src/stellar/config.js";
import { internal } from "./_generated/api.js";
import { action } from "./_generated/server.js";
import { assertPrivateDemoAccess } from "./demo.js";

interface PreflightCheck {
  check: string;
  status: "Pass" | "Fail" | "Not Executed";
  safeAction?: string;
}

interface PreflightOutput {
  passed: boolean;
  checks: PreflightCheck[];
}

interface EvidenceSnapshot {
  run: {
    runId: string;
    status: "Prepared" | "Active" | "Completed" | "Failed";
    startedAt: number;
    environment: "demo-testnet";
    browserTarget: string;
    outcome?: "Pass" | "Fail" | "Not Executed";
    durationMs?: number;
  };
  storedManifest?: string;
  checks: Array<{ check: string; status: "Pass" | "Fail" | "Not Executed" }>;
  assets: Array<{ assetId: string; lifecycle: string; version: number }>;
  issuances: Array<{
    issuanceId: string;
    assetId: string;
    status: "Pending" | "Submitted" | "Confirmed" | "Failed";
    network: "Testnet";
    assetCode: string;
    issuerAccount: string;
    distributorAccount: string;
    supply: string;
    paymentHash?: string;
    paymentLedger?: number;
    confirmedAt?: number;
  }>;
  snapshot: null | {
    snapshotId: string;
    runId?: string;
    confirmedSupply: string;
    observedSupply: string;
    holderCount: number;
    holdersHash: string;
    firstLedger?: number;
    lastLedger?: number;
    synchronizedAt: number;
  };
  paymentAttempts: Array<{ hash: string; state: string; attemptNumber: number }>;
  reconciliationCount: number;
  eventTypes: string[];
  faultStatus?: "Armed" | "Consumed" | "Cleared";
}

interface EvidenceOutput {
  runId: string;
  status: "Completed";
  outcome: "Pass";
  durationMs: number;
  manifest: Record<string, unknown>;
}

interface PerformanceTarget {
  issuanceId: string;
  supplyUnits: bigint;
  ledger: number;
  currentSnapshot: null | { snapshotId: string; holderCount: number };
}

export const preflight = action({
  args: { boundaryKey: v.string(), operatorKey: v.string(), runId: v.string() },
  handler: async (ctx, args): Promise<PreflightOutput> => {
    const env = assertPrivateDemoAccess(args.boundaryKey, args.operatorKey);
    const snapshot = (await ctx.runQuery(internal.demo.preflightSnapshot, {
      runId: args.runId,
    })) as DemoPreflightSnapshot;
    const correlationId = crypto.randomUUID();

    const issuerSeed = env.STELLAR_TESTNET_ISSUER_SEED;
    const distributorSeed = env.STELLAR_TESTNET_DISTRIBUTOR_SEED;
    const issuerAccount = env.STELLAR_TESTNET_ISSUER_PUBLIC_KEY;
    const distributorAccount = env.STELLAR_TESTNET_DISTRIBUTOR_PUBLIC_KEY;
    let custodySignerMatches = false;
    try {
      const issuer = Keypair.fromSecret(issuerSeed ?? "");
      const distributor = Keypair.fromSecret(distributorSeed ?? "");
      if (issuer.publicKey() !== issuerAccount || distributor.publicKey() !== distributorAccount) {
        throw new Error("mismatch");
      }
      custodySignerMatches = true;
    } catch {}

    const server = new Horizon.Server(STELLAR_TESTNET_CONFIG.horizonUrl);
    let horizon: DemoHorizonPreflight = { status: "Unavailable" };
    try {
      const [issuer, distributor, ledgers] = await Promise.all([
        server.loadAccount(issuerAccount ?? ""),
        server.loadAccount(distributorAccount ?? ""),
        server.ledgers().order("desc").limit(1).call(),
      ]);
      const funded = [issuer, distributor].every((account) =>
        account.balances.some(
          (balance) => balance.asset_type === "native" && Number(balance.balance) >= 2,
        ),
      );
      const signerReady =
        issuer.signers.some((signer) => signer.key === issuerAccount && signer.weight > 0) &&
        distributor.signers.some(
          (signer) => signer.key === distributorAccount && signer.weight > 0,
        );
      const sequencesReady = [issuer.sequence, distributor.sequence].every((sequence) =>
        /^\d+$/.test(sequence),
      );
      const latest = ledgers.records[0];
      horizon = {
        status: "Available",
        signerReady,
        sequencesReady,
        funded,
        latestLedgerClosedAt: latest ? Date.parse(latest.closed_at) : Number.NaN,
      };
    } catch {}

    let explorerAvailable = false;
    try {
      const response = await fetch(STELLAR_TESTNET_CONFIG.explorerUrl, { redirect: "error" });
      explorerAvailable = response.ok;
    } catch {}

    const checks: PreflightCheck[] = evaluateDemoPreflight({
      snapshot,
      expectedOperatorWallet: env.PHASE5_FREIGHTER_PUBLIC_KEY,
      workerAvailable: true,
      custodySignerMatches,
      horizon,
      explorerAvailable,
      now: Date.now(),
    });

    return (await ctx.runMutation(internal.demo.recordPreflight, {
      runId: args.runId,
      correlationId,
      checks,
    })) as PreflightOutput;
  },
});

export const evidence = action({
  args: { boundaryKey: v.string(), operatorKey: v.string(), runId: v.string() },
  handler: async (ctx, args): Promise<EvidenceOutput> => {
    assertPrivateDemoAccess(args.boundaryKey, args.operatorKey);
    const snapshot = (await ctx.runQuery(internal.demo.evidenceSnapshot, {
      runId: args.runId,
    })) as EvidenceSnapshot;
    if (
      snapshot.run.status === "Completed" &&
      snapshot.run.outcome === "Pass" &&
      snapshot.run.durationMs !== undefined &&
      snapshot.storedManifest
    ) {
      return {
        runId: snapshot.run.runId,
        status: "Completed",
        outcome: "Pass",
        durationMs: snapshot.run.durationMs,
        manifest: JSON.parse(snapshot.storedManifest) as Record<string, unknown>,
      };
    }
    const failures: string[] = [];
    if (snapshot.run.status !== "Active") failures.push("run-not-active");
    if (Date.now() - snapshot.run.startedAt >= 10 * 60_000)
      failures.push("duration-over-ten-minutes");
    if (!snapshot.checks.length || snapshot.checks.some((check) => check.status !== "Pass")) {
      failures.push("preflight-incomplete");
    }
    if (snapshot.assets.length !== 1 || snapshot.assets[0]?.lifecycle !== "Active") {
      failures.push("one-active-asset-required");
    }
    const issuance = snapshot.issuances.length === 1 ? snapshot.issuances[0] : undefined;
    if (
      !issuance ||
      issuance.status !== "Confirmed" ||
      !issuance.paymentHash ||
      !issuance.paymentLedger
    ) {
      failures.push("one-confirmed-payment-required");
    }
    const uniquePaymentHashes = new Set(snapshot.paymentAttempts.map((attempt) => attempt.hash));
    if (
      uniquePaymentHashes.size !== 1 ||
      !issuance ||
      !uniquePaymentHashes.has(issuance.paymentHash ?? "")
    ) {
      failures.push("payment-attempt-identity-invalid");
    }
    if (
      !snapshot.snapshot ||
      snapshot.snapshot.runId !== snapshot.run.runId ||
      snapshot.snapshot.confirmedSupply !== snapshot.snapshot.observedSupply ||
      snapshot.snapshot.holderCount < 1
    ) {
      failures.push("ownership-reconciliation-invalid");
    }
    const requiredEvents = [
      "demo.run_prepared",
      "demo.preflight_completed",
      "asset.created",
      "document.uploaded",
      "asset.token_proposal_updated",
      "asset.review_submitted",
      "asset.review_approved",
      "issuance.requested",
      "issuance.trustline_confirmed",
      "issuance.submitted",
      "issuance.confirmed",
      "ownership.proof_published",
    ];
    for (const eventType of requiredEvents) {
      if (!snapshot.eventTypes.includes(eventType)) failures.push(`activity-missing:${eventType}`);
    }
    const recovered = snapshot.faultStatus === "Consumed";
    if (recovered && snapshot.reconciliationCount < 1)
      failures.push("reconciliation-evidence-missing");

    if (issuance?.paymentHash) {
      try {
        const transaction = await new Horizon.Server(STELLAR_TESTNET_CONFIG.horizonUrl)
          .transactions()
          .transaction(issuance.paymentHash)
          .call();
        if (!transaction.successful || transaction.ledger_attr !== issuance.paymentLedger) {
          failures.push("testnet-payment-proof-mismatch");
        }
      } catch {
        failures.push("testnet-payment-proof-unavailable");
      }
    }
    if (failures.length) throw new Error(`DEMO_EVIDENCE_GATE_FAILED:${failures.join(",")}`);

    const manifest = {
      schemaVersion: 1,
      runId: snapshot.run.runId,
      outcome: "Pass",
      environment: snapshot.run.environment,
      browserTarget: snapshot.run.browserTarget,
      asset: {
        assetId: issuance!.assetId,
        code: issuance!.assetCode,
        issuerAccount: issuance!.issuerAccount,
        distributorAccount: issuance!.distributorAccount,
        supply: issuance!.supply,
      },
      payment: { hash: issuance!.paymentHash!, ledger: issuance!.paymentLedger! },
      ownership: snapshot.snapshot,
      recoveryScenario: recovered ? "after-submit-before-result-persist" : "none",
      activityEventCount: snapshot.eventTypes.length,
      finalizedAt: new Date().toISOString(),
    };
    const finalized = (await ctx.runMutation(internal.demo.finalizeEvidence, {
      runId: snapshot.run.runId,
      evidenceManifest: JSON.stringify(manifest),
      recoveryScenario: recovered ? "after-submit-before-result-persist" : undefined,
    })) as Omit<EvidenceOutput, "manifest">;
    return { ...finalized, manifest };
  },
});

export const seedPerformanceOwnership = action({
  args: { boundaryKey: v.string(), operatorKey: v.string(), assetId: v.string() },
  handler: async (ctx, args): Promise<{ snapshotId: string; holderCount: number }> => {
    assertPrivateDemoAccess(args.boundaryKey, args.operatorKey);
    const target = (await ctx.runQuery(internal.demo.performanceFixtureTarget, {
      assetId: args.assetId,
    })) as PerformanceTarget;
    if (target.currentSnapshot) return target.currentSnapshot;
    const holderCount = 5_000;
    if (target.supplyUnits < BigInt(holderCount)) {
      throw new Error("PERFORMANCE_ASSET_SUPPLY_TOO_SMALL");
    }
    const attemptId = (await ctx.runMutation(internal.ownership.preparePerformanceFixture, {
      issuanceId: target.issuanceId,
      requestId: "phase5-performance-ownership-v1",
    })) as string;
    const holderId = crypto.randomUUID();
    const start = (await ctx.runMutation(internal.ownership.beginAttempt, {
      attemptId,
      holderId,
    })) as { busy: boolean; fencingToken?: bigint; retryAfterMs?: number } | null;
    if (!start || start.busy || start.fencingToken === undefined) {
      throw new Error(`PERFORMANCE_FIXTURE_LEASE_BUSY:${start?.retryAfterMs ?? 0}`);
    }

    const baseUnits = target.supplyUnits / BigInt(holderCount);
    const remainder = target.supplyUnits % BigInt(holderCount);
    const holders = Array.from({ length: holderCount }, (_, index) => {
      const seed = createHash("sha256").update(`sora-phase5-holder:${index}`).digest();
      const account = Keypair.fromRawEd25519Seed(seed).publicKey();
      const balanceUnits = baseUnits + (BigInt(index) < remainder ? 1n : 0n);
      return {
        account,
        balanceUnits,
        balance: formatStellarUnits(balanceUnits),
        ledger: target.ledger,
      };
    }).sort((left, right) => left.account.localeCompare(right.account));
    const hash = createHash("sha256");
    for (let offset = 0; offset < holders.length; offset += 100) {
      const page = holders.slice(offset, offset + 100);
      for (const holder of page) hash.update(canonicalHolderLine(holder));
      await ctx.runMutation(internal.ownership.stagePage, {
        attemptId,
        fencingToken: start.fencingToken,
        pageNumber: offset / 100 + 1,
        holders: page,
      });
    }
    const result = (await ctx.runMutation(internal.ownership.completeAttempt, {
      attemptId,
      fencingToken: start.fencingToken,
      pageCount: 50,
      holderCount,
      observedUnits: target.supplyUnits,
      holdersHash: hash.digest("hex"),
      firstLedger: target.ledger,
      lastLedger: target.ledger,
    })) as { snapshotId: string };
    return { snapshotId: result.snapshotId, holderCount };
  },
});
