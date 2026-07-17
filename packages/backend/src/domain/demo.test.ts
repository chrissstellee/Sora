import { describe, expect, it } from "vitest";

import {
  TESTNET_EXPLORER_URL,
  TESTNET_HORIZON_URL,
  TESTNET_PASSPHRASE,
} from "../stellar/config.js";
import {
  CONTROLLED_FAULT_BOUNDARY,
  allocateDemoAssetCode,
  assertControlledFault,
  assertDemoTestnetEnvironment,
  canonicalPreflightResult,
  deriveDemoAssetCode,
  evaluateDemoPreflight,
} from "./demo.js";

const environment = {
  deploymentTier: "demo-testnet",
  networkPassphrase: TESTNET_PASSPHRASE,
  horizonUrl: TESTNET_HORIZON_URL,
  explorerUrl: TESTNET_EXPLORER_URL,
  faultsEnabled: true,
};

const now = Date.parse("2026-07-15T00:00:00.000Z");
const healthyPreflight = {
  snapshot: {
    activeSessionCount: 1,
    operatorWallet: "GOPERATOR",
    activeLocks: 0,
    activeIssuances: 0,
  },
  expectedOperatorWallet: "GOPERATOR",
  workerAvailable: true,
  custodySignerMatches: true,
  horizon: {
    status: "Available" as const,
    signerReady: true,
    sequencesReady: true,
    funded: true,
    latestLedgerClosedAt: now - 1_000,
  },
  explorerAvailable: true,
  now,
};

function status(checks: ReturnType<typeof evaluateDemoPreflight>, name: string) {
  return checks.find((check) => check.check === name)?.status;
}

describe("Phase 5 demo contracts", () => {
  it("derives a deterministic valid unique-code candidate", async () => {
    const runId = "123e4567-e89b-42d3-a456-426614174000";
    const first = await deriveDemoAssetCode(runId, 0);
    expect(first).toMatch(/^S5[A-F0-9]{10}$/);
    expect(first).toHaveLength(12);
    expect(await deriveDemoAssetCode(runId, 0)).toBe(first);
    expect(await deriveDemoAssetCode(runId, 1)).not.toBe(first);
  });

  it("skips reserved code collisions and fails closed after the bounded namespace", async () => {
    const runId = "123e4567-e89b-42d3-a456-426614174000";
    const candidates = await Promise.all(
      [0, 1, 2].map((nonce) => deriveDemoAssetCode(runId, nonce)),
    );
    await expect(
      allocateDemoAssetCode(runId, async (candidate) => candidates.slice(0, 2).includes(candidate)),
    ).resolves.toEqual({ assetCode: candidates[2], assetCodeNonce: 2 });
    await expect(allocateDemoAssetCode(runId, async () => true)).rejects.toThrow(
      "DEMO_ASSET_CODE_EXHAUSTED",
    );
  });

  it("rejects non-demo networks and disabled faults", () => {
    expect(() => assertDemoTestnetEnvironment(environment, true)).not.toThrow();
    expect(() =>
      assertDemoTestnetEnvironment({
        ...environment,
        networkPassphrase: "Public Global Stellar Network ; September 2015",
      }),
    ).toThrow("DEMO_ENVIRONMENT_REJECTED");
    expect(() =>
      assertDemoTestnetEnvironment({ ...environment, faultsEnabled: false }, true),
    ).toThrow("DEMO_FAULTS_DISABLED");
    for (const rejected of [
      { ...environment, deploymentTier: "production" },
      { ...environment, horizonUrl: "https://example.test" },
      { ...environment, explorerUrl: "https://example.test" },
    ]) {
      expect(() => assertDemoTestnetEnvironment(rejected)).toThrow("DEMO_ENVIRONMENT_REJECTED");
    }
  });

  it("allows only the one allowlisted ambiguity boundary", () => {
    expect(() =>
      assertControlledFault({
        boundary: CONTROLLED_FAULT_BOUNDARY,
        runId: "run-1",
        organizationId: "org-1",
        allowedRunId: "run-1",
        allowedOrganizationId: "org-1",
      }),
    ).not.toThrow();
    expect(() =>
      assertControlledFault({
        boundary: "arbitrary-code",
        runId: "run-1",
        organizationId: "org-1",
        allowedRunId: "run-1",
        allowedOrganizationId: "org-1",
      }),
    ).toThrow("DEMO_FAULT_BOUNDARY_REJECTED");
  });

  it("keeps preflight output sanitized", () => {
    expect(canonicalPreflightResult({ check: "Horizon origin", status: "Pass" })).toEqual({
      check: "Horizon origin",
      status: "Pass",
      safeAction: undefined,
    });
    expect(() =>
      canonicalPreflightResult({
        check: "Signer",
        status: "Fail",
        safeAction: "Print the private key",
      }),
    ).toThrow("PREFLIGHT_CONTENT_UNSAFE");
    const seed = `S${"A".repeat(55)}`;
    const sanitized = canonicalPreflightResult({
      check: "Custody configuration",
      status: "Fail",
      safeAction: `Replace ${seed} through the private operator boundary.`,
    });
    expect(sanitized.safeAction).toContain("[REDACTED]");
    expect(sanitized.safeAction).not.toContain(seed);
  });

  it("covers every local readiness and active-work failure branch", () => {
    const cases = [
      ["Convex worker action health", { workerAvailable: false }],
      [
        "Demo Organization session readiness",
        { snapshot: { ...healthyPreflight.snapshot, activeSessionCount: 0 } },
      ],
      [
        "Freighter operator wallet target",
        { snapshot: { ...healthyPreflight.snapshot, operatorWallet: "GFOREIGN" } },
      ],
      [
        "No active source or ownership lease",
        { snapshot: { ...healthyPreflight.snapshot, activeLocks: 1 } },
      ],
      ["No active issuance", { snapshot: { ...healthyPreflight.snapshot, activeIssuances: 1 } }],
      ["Custody signer and public-key match", { custodySignerMatches: false }],
    ] as const;
    for (const [check, override] of cases) {
      const checks = evaluateDemoPreflight({ ...healthyPreflight, ...override });
      expect(status(checks, check), check).toBe("Fail");
      expect(checks.find((item) => item.check === check)?.safeAction).toBeTruthy();
    }
  });

  it("covers missing signer, sequence conflict, insufficient funding, and stale ledger", () => {
    const cases = [
      ["On-chain signer state", { signerReady: false }],
      ["Source sequence readiness", { sequencesReady: false }],
      ["Demo accounts funded and reserve-ready", { funded: false }],
      ["Horizon ledger and clock freshness", { latestLedgerClosedAt: now - 5 * 60_000 - 1 }],
    ] as const;
    for (const [check, horizonOverride] of cases) {
      const checks = evaluateDemoPreflight({
        ...healthyPreflight,
        horizon: { ...healthyPreflight.horizon, ...horizonOverride },
      });
      expect(status(checks, check), check).toBe("Fail");
    }
  });

  it("reports Horizon branches as not executed and explorer outage as a failure", () => {
    const unavailable = evaluateDemoPreflight({
      ...healthyPreflight,
      horizon: { status: "Unavailable" },
      explorerAvailable: false,
    });
    for (const check of [
      "On-chain signer state",
      "Source sequence readiness",
      "Demo accounts funded and reserve-ready",
      "Horizon ledger and clock freshness",
    ]) {
      expect(status(unavailable, check), check).toBe("Not Executed");
    }
    expect(status(unavailable, "StellarExpert Testnet availability")).toBe("Fail");
    expect(unavailable).toHaveLength(13);
  });
});
