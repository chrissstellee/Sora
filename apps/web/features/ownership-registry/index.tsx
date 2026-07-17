"use client";

import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { ErrorState, LoadingState } from "@/features/assets/components/request-state";
import { useRequest } from "@/features/assets/lib/use-request";
import { listAssets } from "@/features/assets/lib/workspace-api";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent } from "@repo/ui/components/ui/card";
import { cn } from "@repo/ui/lib/utils";

import { HolderRegistryTable } from "./components/holder-registry-table";
import { OwnershipFiltersBar } from "./components/ownership-filters-bar";
import { OwnershipRegistryHeader } from "./components/ownership-registry-header";
import { OwnershipStats } from "./components/ownership-stats";
import { useOwnershipRegistry } from "./hooks/use-ownership-registry";

interface OwnershipRegistryPageProps {
  initialAssetId?: string;
}

export function OwnershipRegistryPage({ initialAssetId }: OwnershipRegistryPageProps) {
  const router = useRouter();
  const [selectedAssetId, setSelectedAssetId] = React.useState(initialAssetId);
  const assetsRequest = useRequest((signal) => listAssets(signal, "", undefined, 100), []);
  const ownership = useOwnershipRegistry(selectedAssetId);
  const activeAssets = React.useMemo(
    () =>
      (assetsRequest.data?.items ?? [])
        .filter((asset) => asset.lifecycle === "Active")
        .map((asset) => ({ assetId: asset.assetId, label: `${asset.name} (${asset.assetId})` })),
    [assetsRequest.data?.items],
  );
  const assetOptions = React.useMemo(() => {
    if (!selectedAssetId || activeAssets.some((asset) => asset.assetId === selectedAssetId)) {
      return activeAssets;
    }
    return [{ assetId: selectedAssetId, label: selectedAssetId }, ...activeAssets];
  }, [activeAssets, selectedAssetId]);

  React.useEffect(() => {
    if (selectedAssetId || activeAssets.length === 0) return;
    const firstAssetId = activeAssets[0]!.assetId;
    setSelectedAssetId(firstAssetId);
    router.replace(`/ownership-registry?assetId=${encodeURIComponent(firstAssetId)}`);
  }, [activeAssets, router, selectedAssetId]);

  const selectAsset = (assetId: string) => {
    setSelectedAssetId(assetId);
    router.replace(`/ownership-registry?assetId=${encodeURIComponent(assetId)}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <OwnershipRegistryHeader />

      {assetsRequest.isLoading && <LoadingState label="Loading confirmed assets…" />}
      {assetsRequest.error && (
        <ErrorState error={assetsRequest.error} onRetry={assetsRequest.retry} />
      )}
      {!assetsRequest.isLoading &&
        !assetsRequest.error &&
        activeAssets.length === 0 &&
        !initialAssetId && (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="font-medium">No confirmed Testnet assets are available.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Complete an issuance before requesting an ownership proof.
              </p>
            </CardContent>
          </Card>
        )}

      {(assetOptions.length > 0 || selectedAssetId) && (
        <OwnershipFiltersBar
          assets={assetOptions}
          selectedAssetId={selectedAssetId}
          query={ownership.query}
          onAssetChange={selectAsset}
          onSearch={ownership.search}
        />
      )}

      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {ownership.announcement}
      </div>

      {selectedAssetId && ownership.isLoading && !ownership.data && (
        <LoadingState label="Loading saved ownership proof…" />
      )}

      {selectedAssetId && ownership.error && !ownership.data && (
        <OwnershipFailure errorState={ownership.errorState} onRetry={ownership.retry} />
      )}

      {ownership.data && (
        <>
          <OwnershipState
            state={ownership.state}
            hasRecoverableError={Boolean(ownership.error)}
            isRefreshing={ownership.isRefreshing}
            onRefresh={() => void ownership.refresh("manual")}
          />
          <OwnershipStats data={ownership.data} />
          <HolderRegistryTable
            holders={ownership.data.holders.items}
            isLoading={ownership.isLoading}
            query={ownership.query}
            hasPreviousPage={ownership.hasPreviousPage}
            hasNextPage={Boolean(ownership.data.holders.nextCursor)}
            onPreviousPage={ownership.previousPage}
            onNextPage={ownership.nextPage}
          />
        </>
      )}

      {selectedAssetId && (
        <Card>
          <CardContent className="space-y-2 py-5 text-sm text-muted-foreground">
            <p>
              These balances demonstrate current on-chain token holdings on Stellar Testnet. They do
              not establish legal or beneficial ownership of the underlying asset.
            </p>
            <p>
              Scope includes non-zero Classic account trustline balances only. Liquidity pools,
              claimable balances, liabilities, issuer pseudo-balances, and Soroban-held balances are
              excluded.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function OwnershipFailure({
  errorState,
  onRetry,
}: {
  errorState: ReturnType<typeof useOwnershipRegistry>["errorState"];
  onRetry: () => void;
}) {
  const copy =
    errorState === "not-found"
      ? "This ownership proof was not found or is not available to your Organization."
      : errorState === "rate-limited"
        ? "Ownership requests are rate limited. Wait briefly, then retry."
        : "The saved ownership proof could not be loaded. Retry when the service is available.";
  return (
    <Card role="alert">
      <CardContent className="flex flex-col items-start gap-3 py-6">
        <p>{copy}</p>
        <Button variant="outline" onClick={onRetry}>
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}

function OwnershipState({
  state,
  hasRecoverableError,
  isRefreshing,
  onRefresh,
}: {
  state: ReturnType<typeof useOwnershipRegistry>["state"];
  hasRecoverableError: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  const warning = ["stale", "failed", "mismatch", "unavailable"].includes(state);
  const copy = {
    fresh: "Fresh complete proof — confirmed and observed account-held supply match.",
    refreshing: "Synchronizing now. The last complete saved proof remains displayed.",
    stale:
      "Saved proof is older than 60 seconds. A safe refresh can update it without clearing these rows.",
    failed: "The latest synchronization failed. The last complete saved proof remains displayed.",
    mismatch:
      "Ledger reconciliation is pending because confirmed and observed supply do not match. The last matching proof remains displayed.",
    unavailable:
      "No complete matching ownership proof is available yet. This is not a zero-holder result.",
    "verified-zero": "Complete proof verified zero non-zero account holders.",
  }[state];
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        warning ? "border-warning/60 bg-warning/10" : "border-success/40 bg-success/5",
      )}
    >
      <p className="flex items-start gap-2 text-sm">
        {warning ? (
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        )}
        <span>{hasRecoverableError ? `${copy} The most recent request also failed.` : copy}</span>
      </p>
      <Button
        variant="outline"
        onClick={onRefresh}
        disabled={isRefreshing || state === "refreshing"}
      >
        <RefreshCw className={cn(isRefreshing && "animate-spin")} aria-hidden="true" />
        {isRefreshing || state === "refreshing" ? "Refreshing…" : "Refresh proof"}
      </Button>
    </div>
  );
}
