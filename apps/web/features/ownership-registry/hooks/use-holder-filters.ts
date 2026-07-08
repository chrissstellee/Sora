"use client";

import * as React from "react";

import type { IHolderEntry, THolderType } from "../lib/types";

export interface HolderFiltersState {
  assetCode: string;
  holderType: THolderType;
  showConcentratedOnly: boolean;
}

const DEFAULT_FILTERS: HolderFiltersState = {
  assetCode: "all",
  holderType: "Institutional",
  showConcentratedOnly: false,
};

interface IUseHolderFiltersResult {
  filters: HolderFiltersState;
  setAssetCode: (value: string) => void;
  setHolderType: (value: THolderType) => void;
  setShowConcentratedOnly: (value: boolean) => void;
  filteredHolders: IHolderEntry[];
}

const CONCENTRATION_THRESHOLD = 5;

export function useHolderFilters(holders: IHolderEntry[]): IUseHolderFiltersResult {
  const [filters, setFilters] = React.useState<HolderFiltersState>(DEFAULT_FILTERS);

  const setAssetCode = (value: string) => setFilters((prev) => ({ ...prev, assetCode: value }));
  const setHolderType = (value: THolderType) =>
    setFilters((prev) => ({ ...prev, holderType: value }));
  const setShowConcentratedOnly = (value: boolean) =>
    setFilters((prev) => ({ ...prev, showConcentratedOnly: value }));

  const filteredHolders = React.useMemo(() => {
    return holders.filter((holder) => {
      const matchesAsset = filters.assetCode === "all" || holder.assetCode === filters.assetCode;
      const matchesHolderType = holder.holderType === filters.holderType;
      const matchesConcentration =
        !filters.showConcentratedOnly || holder.ownershipPercent > CONCENTRATION_THRESHOLD;

      return matchesAsset && matchesHolderType && matchesConcentration;
    });
  }, [holders, filters]);

  return { filters, setAssetCode, setHolderType, setShowConcentratedOnly, filteredHolders };
}
