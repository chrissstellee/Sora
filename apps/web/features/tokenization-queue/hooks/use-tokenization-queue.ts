"use client";

import * as React from "react";

import {
  MOCK_ISSUANCE_QUEUE,
  MOCK_NETWORK_STATUS,
  MOCK_RECENT_ACTIVITY,
  MOCK_TOKENIZATION_STATS,
  MOCK_TOTAL_QUEUED_ENTRIES,
} from "../lib/mock-issuance-queue";

import type {
  IIssuanceQueueEntry,
  IRecentActivityEntry,
  IStellarNetworkStatus,
  ITokenizationStats,
} from "../lib/types";

interface IUseTokenizationQueueResult {
  entries: IIssuanceQueueEntry[];
  stats: ITokenizationStats;
  activity: IRecentActivityEntry[];
  networkStatus: IStellarNetworkStatus;
  totalQueuedEntries: number;
  isLoading: boolean;
}

/**
 * Fetches (currently mocked) issuance queue data for the Tokenization Queue page.
 * Swap the internals for a real data-fetching hook (e.g. react-query) later —
 * the return shape is designed to stay stable.
 */
export function useTokenizationQueue(): IUseTokenizationQueueResult {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const timeout = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timeout);
  }, []);

  return {
    entries: MOCK_ISSUANCE_QUEUE,
    stats: MOCK_TOKENIZATION_STATS,
    activity: MOCK_RECENT_ACTIVITY,
    networkStatus: MOCK_NETWORK_STATUS,
    totalQueuedEntries: MOCK_TOTAL_QUEUED_ENTRIES,
    isLoading,
  };
}
