"use client";

import * as React from "react";

import {
  MOCK_HOLDERS,
  MOCK_OWNERSHIP_STATS,
  MOCK_TOTAL_HOLDER_ENTITIES,
  MOCK_TRANSFER_FEED,
} from "../lib/mock-ownership-registry";

import type { IHolderEntry, IOwnershipStats, ITransferFeedEntry } from "../lib/types";

interface IUseOwnershipRegistryResult {
  holders: IHolderEntry[];
  stats: IOwnershipStats;
  transferFeed: ITransferFeedEntry[];
  totalHolderEntities: number;
  isLoading: boolean;
}

/**
 * Fetches (currently mocked) ownership registry data for the Owner Registry page.
 * Swap the internals for a real data-fetching hook (e.g. react-query) later —
 * the return shape is designed to stay stable.
 */
export function useOwnershipRegistry(): IUseOwnershipRegistryResult {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const timeout = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timeout);
  }, []);

  return {
    holders: MOCK_HOLDERS,
    stats: MOCK_OWNERSHIP_STATS,
    transferFeed: MOCK_TRANSFER_FEED,
    totalHolderEntities: MOCK_TOTAL_HOLDER_ENTITIES,
    isLoading,
  };
}
