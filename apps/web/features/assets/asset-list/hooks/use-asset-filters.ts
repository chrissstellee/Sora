"use client";

import * as React from "react";

import type { IAsset } from "../lib/types";

export interface AssetFiltersState {
  search: string;
  type: string;
  status: string;
  country: string;
}

const DEFAULT_FILTERS: AssetFiltersState = {
  search: "",
  type: "all",
  status: "all",
  country: "all",
};

export interface UseAssetFiltersResult {
  filters: AssetFiltersState;
  setSearch: (value: string) => void;
  setType: (value: string) => void;
  setStatus: (value: string) => void;
  setCountry: (value: string) => void;
  filteredAssets: IAsset[];
}

/** Owns the toolbar's filter state and derives the filtered row set for the table. */
export function useAssetFilters(assets: IAsset[]): UseAssetFiltersResult {
  const [filters, setFilters] = React.useState<AssetFiltersState>(DEFAULT_FILTERS);

  const setSearch = (value: string) => setFilters((f) => ({ ...f, search: value }));
  const setType = (value: string) => setFilters((f) => ({ ...f, type: value }));
  const setStatus = (value: string) => setFilters((f) => ({ ...f, status: value }));
  const setCountry = (value: string) => setFilters((f) => ({ ...f, country: value }));

  const filteredAssets = React.useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    return assets.filter((asset) => {
      const matchesSearch =
        query.length === 0 ||
        asset.name.toLowerCase().includes(query) ||
        asset.assetId.toLowerCase().includes(query) ||
        asset.owner.toLowerCase().includes(query);

      const matchesType = filters.type === "all" || asset.type === filters.type;
      const matchesStatus = filters.status === "all" || asset.status === filters.status;
      const matchesCountry = filters.country === "all" || asset.country === filters.country;

      return matchesSearch && matchesType && matchesStatus && matchesCountry;
    });
  }, [assets, filters]);

  return { filters, setSearch, setType, setStatus, setCountry, filteredAssets };
}
