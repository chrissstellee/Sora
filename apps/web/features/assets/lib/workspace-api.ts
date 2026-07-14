import type {
  AssetLifecycle,
  AssetRecord,
  AssetRecordInput,
} from "@repo/backend/domain/asset-record";

export type { AssetLifecycle, AssetRecord, AssetRecordInput };

export interface ActivityEvent {
  eventId: string;
  eventType: string;
  assetId?: string;
  timestamp: number;
  metadata?: { status?: string; changedFields?: string[] };
}

export interface AssetListResponse {
  items: AssetRecord[];
  nextCursor: string | null;
  mode: "list" | "search";
}

export interface WorkspaceSummary {
  counts: Record<AssetLifecycle, number> & { total: number };
  recentAssets: AssetRecord[];
  recentEvents?: ActivityEvent[];
}

export interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
    correlationId?: string;
    fieldErrors?: Record<string, string[]>;
  };
}

export class WorkspaceApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly correlationId?: string;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(status: number, body: ApiErrorBody) {
    const error = body.error;
    super(error?.message ?? "The workspace request failed. Please try again.");
    this.name = "WorkspaceApiError";
    this.status = status;
    this.code = error?.code ?? "WORKSPACE_REQUEST_FAILED";
    this.correlationId = error?.correlationId;
    this.fieldErrors = error?.fieldErrors;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: init?.body ? { "Content-Type": "application/json", ...init.headers } : init?.headers,
  });
  const body = (await response.json().catch(() => ({}))) as T & ApiErrorBody;
  if (!response.ok) throw new WorkspaceApiError(response.status, body);
  return body;
}

export function listAssets(signal: AbortSignal, query = "", cursor?: string) {
  const params = new URLSearchParams({ limit: "25" });
  if (query.trim()) params.set("q", query.trim());
  if (cursor) params.set("cursor", cursor);
  return request<AssetListResponse>(`/api/assets?${params}`, { signal });
}

export function getAsset(assetId: string, signal?: AbortSignal) {
  return request<{ asset: AssetRecord }>(`/api/assets/${encodeURIComponent(assetId)}`, { signal });
}

export function createAsset(input: AssetRecordInput, requestId: string) {
  return request<{ asset: AssetRecord; replayed: boolean }>("/api/assets", {
    method: "POST",
    body: JSON.stringify({ ...input, requestId }),
  });
}

export function updateAsset(assetId: string, input: AssetRecordInput, expectedVersion: number) {
  return request<{ asset: AssetRecord; outcome: "updated" | "unchanged" }>(
    `/api/assets/${encodeURIComponent(assetId)}`,
    { method: "PATCH", body: JSON.stringify({ ...input, expectedVersion }) },
  );
}

export function getWorkspaceSummary(signal: AbortSignal) {
  return request<WorkspaceSummary>("/api/workspace/summary", { signal });
}

export function getActivity(signal: AbortSignal, assetId?: string, limit = 25) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (assetId) params.set("assetId", assetId);
  return request<{ items: ActivityEvent[] }>(`/api/activity?${params}`, { signal });
}

export function formatAssetValue(asset: AssetRecord) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: asset.currency }).format(
    Number(asset.estimatedValue),
  );
}
