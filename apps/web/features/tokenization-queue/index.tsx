"use client";

import * as React from "react";

import { ConfigureDigitalAssetDialog } from "./components/configure-digital-asset-dialog";
import { TokenizationHeader } from "./components/tokenization-header";
import { TokenizationQueueTable } from "./components/tokenization-queue-table";
import { TokenizationStats } from "./components/tokenization-stats";
import { TokenizationToolbar } from "./components/tokenization-toolbar";
import { useConfigureAssetDialog } from "./hooks/use-configure-asset-dialog";
import { useTokenizationFilters } from "./hooks/use-tokenization-filters";
import { useTokenizationQueue } from "./hooks/use-tokenization-queue";

export function TokenizationQueuePage() {
  const { entries, stats, isLoading, error, refetch } = useTokenizationQueue();
  const { filters, setSearch, setType, setStatus, setCountry, filteredEntries } =
    useTokenizationFilters(entries);

  const { open, activeEntry, openForEntry, onOpenChange } = useConfigureAssetDialog();

  const handleExport = React.useCallback(() => {
    // TODO: Wire actual export behavior when backend support is available.
    console.log("Export tokenization queue CSV");
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <TokenizationHeader />

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-error/40 bg-error/10 p-4 text-sm text-error"
        >
          {error}{" "}
          <button className="underline" onClick={() => void refetch()}>
            Retry
          </button>
        </div>
      )}

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

      <ConfigureDigitalAssetDialog
        open={open}
        onOpenChange={onOpenChange}
        entry={activeEntry}
        onProgress={refetch}
      />
    </div>
  );
}
