import {
  TESTNET_EXPLORER_URL,
  TESTNET_HORIZON_URL,
  TESTNET_PASSPHRASE,
} from "../stellar/config.js";
import { redactText } from "../stellar/redaction.js";
import { sha256Hex } from "./tokenization.js";

export const DEMO_DEPLOYMENT_TIER = "demo-testnet";
export const CONTROLLED_FAULT_BOUNDARY = "after-submit-before-result-persist";
export const PREFLIGHT_STATUSES = ["Pass", "Fail", "Not Executed"] as const;
export type PreflightStatus = (typeof PREFLIGHT_STATUSES)[number];

export interface DemoPreflightCheck {
  check: string;
  status: PreflightStatus;
  safeAction?: string;
}

export interface DemoPreflightSnapshot {
  activeSessionCount: number;
  operatorWallet?: string;
  activeLocks: number;
  activeIssuances: number;
}

export type DemoHorizonPreflight =
  | { status: "Unavailable" }
  | {
      status: "Available";
      signerReady: boolean;
      sequencesReady: boolean;
      funded: boolean;
      latestLedgerClosedAt: number;
    };

export interface DemoEnvironment {
  deploymentTier?: string;
  networkPassphrase?: string;
  horizonUrl?: string;
  explorerUrl?: string;
  faultsEnabled?: string | boolean;
}

export function assertDemoTestnetEnvironment(environment: DemoEnvironment, requireFaults = false) {
  if (
    environment.deploymentTier !== DEMO_DEPLOYMENT_TIER ||
    environment.networkPassphrase !== TESTNET_PASSPHRASE ||
    environment.horizonUrl !== TESTNET_HORIZON_URL ||
    environment.explorerUrl !== TESTNET_EXPLORER_URL
  ) {
    throw new Error("DEMO_ENVIRONMENT_REJECTED");
  }
  if (requireFaults && environment.faultsEnabled !== true && environment.faultsEnabled !== "true") {
    throw new Error("DEMO_FAULTS_DISABLED");
  }
}

export async function deriveDemoAssetCode(runId: string, nonce = 0): Promise<string> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(runId)) {
    throw new Error("DEMO_RUN_ID_INVALID");
  }
  if (!Number.isInteger(nonce) || nonce < 0 || nonce >= 100) throw new Error("DEMO_NONCE_INVALID");
  return `S5${(await sha256Hex(`${runId}:${nonce}`)).slice(0, 10).toUpperCase()}`;
}

export async function allocateDemoAssetCode(
  runId: string,
  isReserved: (candidate: string) => Promise<boolean>,
): Promise<{ assetCode: string; assetCodeNonce: number }> {
  for (let assetCodeNonce = 0; assetCodeNonce < 100; assetCodeNonce += 1) {
    const assetCode = await deriveDemoAssetCode(runId, assetCodeNonce);
    if (!(await isReserved(assetCode))) return { assetCode, assetCodeNonce };
  }
  throw new Error("DEMO_ASSET_CODE_EXHAUSTED");
}

export function assertControlledFault(input: {
  boundary: string;
  runId: string;
  organizationId: string;
  allowedRunId: string;
  allowedOrganizationId: string;
}) {
  if (input.boundary !== CONTROLLED_FAULT_BOUNDARY) throw new Error("DEMO_FAULT_BOUNDARY_REJECTED");
  if (input.runId !== input.allowedRunId || input.organizationId !== input.allowedOrganizationId) {
    throw new Error("DEMO_FAULT_NOT_ALLOWLISTED");
  }
}

export function canonicalPreflightResult(input: {
  check: string;
  status: PreflightStatus;
  safeAction?: string;
}) {
  const check = redactText(input.check).trim();
  const safeAction = input.safeAction ? redactText(input.safeAction).trim() : undefined;
  if (!check || check.length > 120) throw new Error("PREFLIGHT_CHECK_INVALID");
  if (safeAction && safeAction.length > 500) throw new Error("PREFLIGHT_ACTION_INVALID");
  if (
    /(?:secret|seed|private key|session cookie|boundary key|signed xdr|envelope)/i.test(
      `${check} ${safeAction ?? ""}`,
    )
  ) {
    throw new Error("PREFLIGHT_CONTENT_UNSAFE");
  }
  return { check, status: input.status, safeAction };
}

export function evaluateDemoPreflight(input: {
  snapshot: DemoPreflightSnapshot;
  expectedOperatorWallet?: string;
  workerAvailable: boolean;
  custodySignerMatches: boolean;
  horizon: DemoHorizonPreflight;
  explorerAvailable: boolean;
  now: number;
}): DemoPreflightCheck[] {
  const checks: DemoPreflightCheck[] = [
    { check: "Testnet environment", status: "Pass" },
    input.workerAvailable
      ? { check: "Convex worker action health", status: "Pass" }
      : {
          check: "Convex worker action health",
          status: "Fail",
          safeAction: "Restore the deployed worker action before the run.",
        },
    { check: "Run and asset identity unique", status: "Pass" },
    input.snapshot.activeSessionCount > 0
      ? { check: "Demo Organization session readiness", status: "Pass" }
      : {
          check: "Demo Organization session readiness",
          status: "Fail",
          safeAction: "Create a fresh authenticated Organization session, then rerun preflight.",
        },
    input.snapshot.operatorWallet && input.snapshot.operatorWallet === input.expectedOperatorWallet
      ? { check: "Freighter operator wallet target", status: "Pass" }
      : {
          check: "Freighter operator wallet target",
          status: "Fail",
          safeAction: "Configure the allowlisted operator user and matching Freighter public key.",
        },
    input.snapshot.activeLocks === 0
      ? { check: "No active source or ownership lease", status: "Pass" }
      : {
          check: "No active source or ownership lease",
          status: "Fail",
          safeAction: "Wait for active work to finish, then rerun preflight.",
        },
    input.snapshot.activeIssuances === 0
      ? { check: "No active issuance", status: "Pass" }
      : {
          check: "No active issuance",
          status: "Fail",
          safeAction: "Reconcile the current issuance before starting another formal run.",
        },
    input.custodySignerMatches
      ? { check: "Custody signer and public-key match", status: "Pass" }
      : {
          check: "Custody signer and public-key match",
          status: "Fail",
          safeAction: "Correct the private Convex custody configuration.",
        },
  ];

  if (input.horizon.status === "Unavailable") {
    for (const check of [
      "On-chain signer state",
      "Source sequence readiness",
      "Demo accounts funded and reserve-ready",
      "Horizon ledger and clock freshness",
    ]) {
      checks.push({
        check,
        status: "Not Executed",
        safeAction: "Restore Horizon access and rerun preflight.",
      });
    }
  } else {
    checks.push(
      input.horizon.signerReady
        ? { check: "On-chain signer state", status: "Pass" }
        : {
            check: "On-chain signer state",
            status: "Fail",
            safeAction: "Restore the approved account signer state before the run.",
          },
      input.horizon.sequencesReady
        ? { check: "Source sequence readiness", status: "Pass" }
        : {
            check: "Source sequence readiness",
            status: "Fail",
            safeAction: "Reconcile source sequences and rerun preflight.",
          },
      input.horizon.funded
        ? { check: "Demo accounts funded and reserve-ready", status: "Pass" }
        : {
            check: "Demo accounts funded and reserve-ready",
            status: "Fail",
            safeAction: "Fund the approved public accounts before the run.",
          },
      Number.isFinite(input.horizon.latestLedgerClosedAt) &&
        Math.abs(input.now - input.horizon.latestLedgerClosedAt) <= 5 * 60_000
        ? { check: "Horizon ledger and clock freshness", status: "Pass" }
        : {
            check: "Horizon ledger and clock freshness",
            status: "Fail",
            safeAction: "Wait for Horizon or correct the operator clock, then retry.",
          },
    );
  }

  checks.push(
    input.explorerAvailable
      ? { check: "StellarExpert Testnet availability", status: "Pass" }
      : {
          check: "StellarExpert Testnet availability",
          status: "Fail",
          safeAction: "Use the documented explorer-outage branch.",
        },
  );
  return checks.map(canonicalPreflightResult);
}
