"use client";

import * as React from "react";

import { AssetDetailsSheet } from "./components/asset-details-sheet";
import { AssetsHeader } from "./components/assets-header";
import { AssetsStats } from "./components/assets-stats";
import { AssetsTable } from "./components/assets-table";
import { AssetsToolbar } from "./components/assets-toolbar";
import { useAssetFilters } from "./hooks/use-asset-filters";
import { useAssets } from "./hooks/use-assets";

import type { IAsset } from "./lib/types";

export function AssetsPage() {
  const { assets, stats, isLoading } = useAssets();
  const { filters, setSearch, setType, setStatus, setCountry, filteredAssets } =
    useAssetFilters(assets);

  const [selectedAsset, setSelectedAsset] = React.useState<IAsset | null>(null);
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  const handleRowClick = (asset: IAsset) => {
    setSelectedAsset(asset);
    setDetailsOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <AssetsHeader />
      <AssetsStats stats={stats} />
      <AssetsToolbar
        filters={filters}
        onSearchChange={setSearch}
        onTypeChange={setType}
        onStatusChange={setStatus}
        onCountryChange={setCountry}
      />
      <AssetsTable assets={filteredAssets} isLoading={isLoading} onRowClick={handleRowClick} />

      <AssetDetailsSheet asset={selectedAsset} open={detailsOpen} onOpenChange={setDetailsOpen} />
    </div>
  );
}
