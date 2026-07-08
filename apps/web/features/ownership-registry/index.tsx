"use client";

import { HolderRegistryTable } from "./components/holder-registry-table";
import { OwnershipFiltersBar } from "./components/ownership-filters-bar";
import { OwnershipRegistryHeader } from "./components/ownership-registry-header";
import { OwnershipStats } from "./components/ownership-stats";
import { RecentTransferTable } from "./components/recent-transfer-table";
import { useHolderFilters } from "./hooks/use-holder-filters";
import { useOwnershipRegistry } from "./hooks/use-ownership-registry";

export function OwnershipRegistryPage() {
  const { holders, stats, transferFeed, isLoading } = useOwnershipRegistry();
  const { filters, setAssetCode, setHolderType, setShowConcentratedOnly, filteredHolders } =
    useHolderFilters(holders);

  const handleViewHolder = (_holder: (typeof holders)[number]) => {
    // TODO: wire up to a holder details drawer once designed.
  };

  return (
    <div className="flex flex-col gap-6">
      <OwnershipRegistryHeader />

      <OwnershipStats stats={stats} />

      <OwnershipFiltersBar
        filters={filters}
        onAssetChange={setAssetCode}
        onHolderTypeChange={setHolderType}
        onShowConcentratedOnlyChange={setShowConcentratedOnly}
      />

      <HolderRegistryTable
        holders={filteredHolders}
        isLoading={isLoading}
        onViewHolder={handleViewHolder}
      />

      <RecentTransferTable transfers={transferFeed} />
    </div>
  );
}
