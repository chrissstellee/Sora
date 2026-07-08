"use client";

import * as React from "react";

import {
  MOCK_DOCUMENTS,
  MOCK_DOCUMENTS_STATS,
  MOCK_TOTAL_QUEUED_DOCUMENTS,
} from "../lib/mock-documents";

import type { IDocumentEntry, IDocumentsStats } from "../lib/types";

interface IUseDocumentsResult {
  documents: IDocumentEntry[];
  stats: IDocumentsStats;
  totalQueuedDocuments: number;
  isLoading: boolean;
}

/**
 * Fetches (currently mocked) document registry data for the Documents page.
 * Swap the internals for a real data-fetching hook (e.g. react-query) later —
 * the return shape is designed to stay stable.
 */
export function useDocuments(): IUseDocumentsResult {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const timeout = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timeout);
  }, []);

  return {
    documents: MOCK_DOCUMENTS,
    stats: MOCK_DOCUMENTS_STATS,
    totalQueuedDocuments: MOCK_TOTAL_QUEUED_DOCUMENTS,
    isLoading,
  };
}
