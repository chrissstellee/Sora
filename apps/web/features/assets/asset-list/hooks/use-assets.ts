"use client";

import { MOCK_ASSET_STATS, MOCK_ASSETS } from "../lib/mock-assets";

import type { IAsset, IAssetStats } from "../lib/types";

export interface UseAssetsResult {
  assets: IAsset[];
  stats: IAssetStats;
  isLoading: boolean;
}

/**
 * Returns the asset list + summary stats for the Assets page.
 * Backed by mock data for now; swap the body for a real fetch.
 */
export function useAssets(): UseAssetsResult {
  return {
    assets: MOCK_ASSETS,
    stats: MOCK_ASSET_STATS,
    isLoading: false,
  };
}
