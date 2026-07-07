"use client";

import * as React from "react";

import { ConfigureDigitalAssetDialog } from "./components/configure-digital-asset-dialog";
import { RecentIssuanceActivity } from "./components/recent-issuance-activity";
import { StellarNetworkStatus } from "./components/stellar-network-status";
import { TokenizationHeader } from "./components/tokenization-header";
import { TokenizationQueueTable } from "./components/tokenization-queue-table";
import { TokenizationStats } from "./components/tokenization-stats";
import { TokenizationToolbar } from "./components/tokenization-toolbar";
import { useConfigureAssetDialog } from "./hooks/use-configure-asset-dialog";
import { useTokenizationFilters } from "./hooks/use-tokenization-filters";
import { useTokenizationQueue } from "./hooks/use-tokenization-queue";

export function TokenizationQueuePage() {
  const { entries, stats, activity, networkStatus, isLoading } = useTokenizationQueue();
  const { filters, setSearch, setType, setStatus, setCountry, filteredEntries } =
    useTokenizationFilters(entries);

  const { open, activeEntry, openForEntry, openBlank, onOpenChange } = useConfigureAssetDialog();

  const handleExport = React.useCallback(() => {
    // TODO: Wire actual export behavior when backend support is available.
    console.log("Export tokenization queue CSV");
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <TokenizationHeader onOpenNewAsset={openBlank} />

      <TokenizationStats stats={stats} />

      <TokenizationToolbar
        filters={filters}
        onSearchChange={setSearch}
        onTypeChange={setType}
        onStatusChange={setStatus}
        onCountryChange={setCountry}
        onExport={handleExport}
      />

      <TokenizationQueueTable
        entries={filteredEntries}
        isLoading={isLoading}
        onConfigure={openForEntry}
        onExport={handleExport}
      />

      <div className="grid gap-4 xl:grid-cols-[1.6fr_0.9fr]">
        <RecentIssuanceActivity activity={activity} />
        <StellarNetworkStatus networkStatus={networkStatus} />
      </div>

      <ConfigureDigitalAssetDialog open={open} onOpenChange={onOpenChange} entry={activeEntry} />
    </div>
  );
}
