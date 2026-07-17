"use client";

import * as React from "react";

import { WorkspaceApiError } from "@/features/assets/lib/workspace-api";
import { normalizeAccountSearch } from "@repo/backend/domain/ownership";

import { getOwnership, requestOwnershipRefresh } from "../lib/ownership-api";

import type {
  OwnershipRefreshReason,
  OwnershipResponse,
  OwnershipSyncState,
} from "../lib/ownership-api";

const FRESHNESS_MS = 60_000;
const POLL_MS = 1_500;

export function effectiveOwnershipState(
  data: OwnershipResponse | undefined,
  now = Date.now(),
): OwnershipSyncState | "mismatch" | "verified-zero" {
  if (!data) return "unavailable";
  if (data.sync.safeErrorCode?.includes("MISMATCH")) return "mismatch";
  if (data.sync.state === "refreshing" || data.sync.state === "failed") return data.sync.state;
  if (!data.snapshot) return "unavailable";
  if (data.snapshot.holderCount === 0) return "verified-zero";
  if (now - data.snapshot.synchronizedAt > FRESHNESS_MS) return "stale";
  return data.sync.state;
}

export function ownershipErrorState(error: Error | undefined) {
  if (!(error instanceof WorkspaceApiError)) return error ? "recoverable" : null;
  if (error.status === 401 || error.status === 404) return "not-found";
  if (error.status === 429) return "rate-limited";
  return "recoverable";
}

export function useOwnershipRegistry(assetId?: string) {
  const [data, setData] = React.useState<OwnershipResponse>();
  const [error, setError] = React.useState<Error>();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [cursor, setCursor] = React.useState<string>();
  const [cursorHistory, setCursorHistory] = React.useState<Array<string | undefined>>([]);
  const [announcement, setAnnouncement] = React.useState("");
  const [now, setNow] = React.useState(() => Date.now());
  const requestNumber = React.useRef(0);
  const autoRefreshSnapshot = React.useRef<string | undefined>(undefined);

  const load = React.useCallback(
    async (options?: { cursor?: string; query?: string; preserveData?: boolean }) => {
      if (!assetId) return;
      const currentRequest = ++requestNumber.current;
      setIsLoading(true);
      setError(undefined);
      if (!options?.preserveData) setData(undefined);
      try {
        const result = await getOwnership(assetId, {
          cursor: options?.cursor,
          q: options?.query,
          limit: 25,
        });
        if (requestNumber.current === currentRequest) setData(result);
      } catch (reason) {
        if (requestNumber.current === currentRequest) {
          setError(reason instanceof Error ? reason : new Error("Ownership request failed"));
        }
      } finally {
        if (requestNumber.current === currentRequest) setIsLoading(false);
      }
    },
    [assetId],
  );

  React.useEffect(() => {
    setQuery("");
    setCursor(undefined);
    setCursorHistory([]);
    setData(undefined);
    setError(undefined);
    if (assetId) void load();
  }, [assetId, load]);

  React.useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 5_000);
    return () => window.clearInterval(timer);
  }, []);

  const refresh = React.useCallback(
    async (reason: OwnershipRefreshReason) => {
      if (!assetId || isRefreshing) return;
      setIsRefreshing(true);
      setError(undefined);
      try {
        const result = await requestOwnershipRefresh(assetId, reason, crypto.randomUUID());
        if (result.status === "throttled") {
          const seconds = Math.max(1, Math.ceil((result.retryAfterMs ?? 1_000) / 1_000));
          setAnnouncement(`Refresh is rate limited. Try again in ${seconds} seconds.`);
        } else {
          setAnnouncement(
            result.status === "accepted"
              ? "Ownership refresh requested. Saved proof remains visible while synchronization runs."
              : "A refresh is already running. Saved proof remains visible.",
          );
          await load({ cursor, query, preserveData: true });
        }
      } catch (reason) {
        const nextError = reason instanceof Error ? reason : new Error("Refresh request failed");
        setError(nextError);
        setAnnouncement(
          "Ownership refresh failed. Any displayed proof is still saved; retry when the service is available.",
        );
      } finally {
        setIsRefreshing(false);
      }
    },
    [assetId, cursor, isRefreshing, load, query],
  );

  const state = effectiveOwnershipState(data, now);

  React.useEffect(() => {
    if (data?.sync.state !== "refreshing" || isLoading) return;
    const timer = window.setTimeout(
      () => void load({ cursor, query, preserveData: true }),
      POLL_MS,
    );
    return () => window.clearTimeout(timer);
  }, [cursor, data?.sync.state, isLoading, load, query]);

  React.useEffect(() => {
    if (state !== "stale" || !data?.snapshot || document.visibilityState !== "visible") return;
    if (autoRefreshSnapshot.current === data.snapshot.snapshotId) return;
    autoRefreshSnapshot.current = data.snapshot.snapshotId;
    void refresh("visible-stale");
  }, [data?.snapshot, refresh, state]);

  React.useEffect(() => {
    const onFocus = () => {
      if (effectiveOwnershipState(data) === "stale") void refresh("focus-stale");
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [data, refresh]);

  const search = React.useCallback(
    (value: string) => {
      const trimmed = value.trim();
      try {
        const normalized = trimmed ? normalizeAccountSearch(trimmed) : "";
        setQuery(normalized);
        setCursor(undefined);
        setCursorHistory([]);
        void load({ query: normalized });
      } catch {
        setAnnouncement("Enter a Stellar public account or account prefix beginning with G.");
      }
    },
    [load],
  );

  const nextPage = React.useCallback(() => {
    const nextCursor = data?.holders.nextCursor;
    if (!nextCursor) return;
    setCursorHistory((history) => [...history, cursor]);
    setCursor(nextCursor);
    void load({ cursor: nextCursor, query });
  }, [cursor, data?.holders.nextCursor, load, query]);

  const previousPage = React.useCallback(() => {
    const previousCursor = cursorHistory.at(-1);
    setCursorHistory((history) => history.slice(0, -1));
    setCursor(previousCursor);
    void load({ cursor: previousCursor, query });
  }, [cursorHistory, load, query]);

  return {
    data,
    error,
    errorState: ownershipErrorState(error),
    isLoading,
    isRefreshing,
    state,
    query,
    announcement,
    refresh,
    retry: () => void load({ cursor, query, preserveData: Boolean(data) }),
    search,
    nextPage,
    previousPage,
    hasPreviousPage: cursorHistory.length > 0,
  };
}
