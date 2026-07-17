import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WorkspaceApiError } from "../assets/lib/workspace-api";
import { HolderRegistryTable } from "./components/holder-registry-table";
import { effectiveOwnershipState, ownershipErrorState } from "./hooks/use-ownership-registry";

const PUBLIC_ACCOUNT = "GCFIRY65OQE7DFP5KLNS2PF2LVZMUZYJX4OZIEQ36N2IQANUB5XVYOJR";

describe("ownership proof UI", () => {
  it("derives stale and mismatch states without discarding the snapshot", () => {
    const base = {
      asset: {
        assetId: "asset-1",
        assetCode: "S5DEMO",
        issuerAccount: PUBLIC_ACCOUNT,
        network: "Testnet" as const,
        confirmedSupply: "10.0000000",
      },
      snapshot: {
        snapshotId: "snapshot-1",
        confirmedSupply: "10.0000000",
        observedSupply: "10.0000000",
        holderCount: 1,
        holdersHash: "a".repeat(64),
        synchronizedAt: 1_000,
      },
      sync: { state: "fresh" as const },
      holders: { items: [], nextCursor: null },
    };
    expect(effectiveOwnershipState(base, 61_001)).toBe("stale");
    expect(
      effectiveOwnershipState({
        ...base,
        sync: { state: "failed", safeErrorCode: "OWNERSHIP_SUPPLY_MISMATCH" },
      }),
    ).toBe("mismatch");
  });

  it("renders exact string values and safe external proof attributes", () => {
    render(
      <HolderRegistryTable
        holders={[{ account: PUBLIC_ACCOUNT, balance: "1.2345678", share: "12.3457", ledger: 123 }]}
        isLoading={false}
        hasPreviousPage={false}
        hasNextPage={false}
        query=""
        onPreviousPage={() => undefined}
        onNextPage={() => undefined}
      />,
    );

    expect(screen.getByText("1.2345678")).toBeInTheDocument();
    expect(screen.getByText("12.3457%")).toBeInTheDocument();
    const proof = screen.getByRole("link", { name: /view account/i });
    expect(proof).toHaveAttribute("target", "_blank");
    expect(proof).toHaveAttribute("rel", "noopener noreferrer");
    expect(proof.getAttribute("href")).toContain("/explorer/testnet/account/");
  });

  it("shows proof unavailable for an invalid account instead of constructing a URL", () => {
    render(
      <HolderRegistryTable
        holders={[{ account: "GINVALID", balance: "1.0000000", share: "100.0000", ledger: 123 }]}
        isLoading={false}
        hasPreviousPage={false}
        hasNextPage={false}
        query=""
        onPreviousPage={() => undefined}
        onNextPage={() => undefined}
      />,
    );
    expect(screen.getByText("Proof unavailable")).toBeInTheDocument();
  });

  it("enumerates fresh, refreshing, failed, unavailable, zero, mismatch, permission, throttle, and retry states", () => {
    const data = {
      asset: {
        assetId: "asset-1",
        assetCode: "S5DEMO",
        issuerAccount: PUBLIC_ACCOUNT,
        network: "Testnet" as const,
        confirmedSupply: "10.0000000",
      },
      snapshot: {
        snapshotId: "snapshot-1",
        confirmedSupply: "10.0000000",
        observedSupply: "10.0000000",
        holderCount: 1,
        holdersHash: "a".repeat(64),
        synchronizedAt: 10_000,
      },
      sync: { state: "fresh" as const },
      holders: { items: [], nextCursor: null },
    };
    expect(effectiveOwnershipState(data, 10_001)).toBe("fresh");
    expect(effectiveOwnershipState({ ...data, sync: { state: "refreshing" } }, 10_001)).toBe(
      "refreshing",
    );
    expect(effectiveOwnershipState({ ...data, sync: { state: "failed" } }, 10_001)).toBe("failed");
    expect(effectiveOwnershipState({ ...data, snapshot: null }, 10_001)).toBe("unavailable");
    expect(
      effectiveOwnershipState({ ...data, snapshot: { ...data.snapshot, holderCount: 0 } }, 10_001),
    ).toBe("verified-zero");
    expect(
      effectiveOwnershipState({
        ...data,
        sync: { state: "failed", safeErrorCode: "OWNERSHIP_SUPPLY_MISMATCH" },
      }),
    ).toBe("mismatch");
    expect(ownershipErrorState(new WorkspaceApiError(404, {}))).toBe("not-found");
    expect(ownershipErrorState(new WorkspaceApiError(429, {}))).toBe("rate-limited");
    expect(ownershipErrorState(new WorkspaceApiError(503, {}))).toBe("recoverable");
  });
});
