import type {
  AssetLifecycle,
  AssetRecord,
  AssetRecordInput,
} from "@repo/backend/domain/asset-record";

export type { AssetLifecycle, AssetRecord, AssetRecordInput };

export interface ActivityEvent {
  id: string;
  eventId: string;
  eventType: string;
  assetId?: string;
  runId?: string;
  actorKind?: "user" | "system";
  subjectType?: string;
  subjectId?: string;
  outcome?: "success" | "failure" | "pending" | string;
  correlationId?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface ActivityListResponse {
  items: ActivityEvent[];
  nextCursor: string | null;
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

export function listAssets(signal: AbortSignal, query = "", cursor?: string, limit = 25) {
  const params = new URLSearchParams({ limit: String(limit) });
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

export function getActivity(
  signal: AbortSignal,
  options: { assetId?: string; runId?: string; cursor?: string; limit?: number } = {},
) {
  const params = new URLSearchParams({ limit: String(options.limit ?? 25) });
  if (options.assetId) params.set("assetId", options.assetId);
  if (options.runId) params.set("runId", options.runId);
  if (options.cursor) params.set("cursor", options.cursor);
  return request<ActivityListResponse>(`/api/activity?${params}`, { signal }).then((response) => ({
    ...response,
    items: response.items.map((event) => ({
      ...event,
      metadata: parseActivityMetadata(event.metadata),
    })),
  }));
}

function parseActivityMetadata(value: unknown): Record<string, unknown> | undefined {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value !== "string") return undefined;
  try {
    const parsed = JSON.parse(value) as unknown;
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

export function formatAssetValue(asset: AssetRecord) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: asset.currency }).format(
    Number(asset.estimatedValue),
  );
}
