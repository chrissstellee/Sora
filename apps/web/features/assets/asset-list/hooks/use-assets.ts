"use client";

import * as React from "react";

import { listAssets } from "../../lib/workspace-api";

import type { AssetListResponse } from "../../lib/workspace-api";

export function useAssets(query: string) {
  const [debouncedQuery, setDebouncedQuery] = React.useState(query);
  const [data, setData] = React.useState<AssetListResponse>();
  const [error, setError] = React.useState<Error>();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query), 250);
    return () => window.clearTimeout(timeout);
  }, [query]);

  React.useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(undefined);
    listAssets(controller.signal, debouncedQuery)
      .then(setData)
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setError(reason instanceof Error ? reason : new Error("Request failed"));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [debouncedQuery, attempt]);

  const loadMore = async () => {
    if (!data?.nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const page = await listAssets(new AbortController().signal, debouncedQuery, data.nextCursor);
      setData((current) => current && { ...page, items: [...current.items, ...page.items] });
    } catch (reason) {
      setError(reason instanceof Error ? reason : new Error("Request failed"));
    } finally {
      setIsLoadingMore(false);
    }
  };

  return {
    data,
    error,
    isLoading,
    isLoadingMore,
    retry: () => setAttempt((value) => value + 1),
    loadMore,
    debouncedQuery,
  };
}
