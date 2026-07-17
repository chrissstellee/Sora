import { WorkspaceApiError } from "@/features/assets/lib/workspace-api";

export type OwnershipSyncState = "unavailable" | "refreshing" | "fresh" | "stale" | "failed";
export type OwnershipRefreshReason = "manual" | "visible-stale" | "focus-stale";

export interface OwnershipHolder {
  account: string;
  balance: string;
  share: string;
  ledger: number;
}

export interface OwnershipResponse {
  asset: {
    assetId: string;
    assetCode: string;
    issuerAccount: string;
    network: "Testnet";
    confirmedSupply: string;
  };
  snapshot: null | {
    snapshotId: string;
    confirmedSupply: string;
    observedSupply: string;
    holderCount: number;
    holdersHash: string;
    firstLedger?: number;
    lastLedger?: number;
    synchronizedAt: number;
  };
  sync: {
    state: OwnershipSyncState;
    safeErrorCode?: string;
    lastAttemptAt?: number;
  };
  holders: { items: OwnershipHolder[]; nextCursor: string | null };
}

export interface OwnershipRefreshResponse {
  status: "accepted" | "deduplicated" | "throttled";
  attemptId?: string;
  retryAfterMs?: number;
}

interface ApiErrorBody {
  error?: { code?: string; message?: string; correlationId?: string };
}

async function responseBody<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as T & ApiErrorBody;
  if (!response.ok) throw new WorkspaceApiError(response.status, body);
  return body;
}

export function getOwnership(
  assetId: string,
  options: { cursor?: string; limit?: number; q?: string } = {},
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({ limit: String(options.limit ?? 25) });
  if (options.cursor) params.set("cursor", options.cursor);
  if (options.q) params.set("q", options.q.trim().toUpperCase());
  return fetch(`/api/assets/${encodeURIComponent(assetId)}/ownership?${params}`, {
    cache: "no-store",
    signal,
  }).then((response) => responseBody<OwnershipResponse>(response));
}

export function requestOwnershipRefresh(
  assetId: string,
  reason: OwnershipRefreshReason,
  requestId: string,
) {
  return fetch(`/api/assets/${encodeURIComponent(assetId)}/ownership/refresh`, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason, requestId }),
  }).then((response) => responseBody<OwnershipRefreshResponse>(response));
}
