import type {
  IApiActivityEntry,
  IApiEndpointCategory,
  IApiEndpointGroup,
  IApiKeyEntry,
  IDevelopersStats,
  IWebhookDelivery,
  IWebhookEndpoint,
  IWebhookEventCategory,
} from "./types";

export const MOCK_STATS: IDevelopersStats = {
  totalApiKeys: 12,
  totalApiKeysDelta: "+4.2% (30d)",
  apiRequestsToday: 14292,
  apiRequestsGrowth: "+12% growth trend",
  avgResponseTime: "124ms",
  avgResponseCaption: "Avg. response time: 4.2s",
  apiStatus: "OPERATIONAL",
  apiStatusCaption: "Active",
};

export const MOCK_API_KEYS: IApiKeyEntry[] = [
  {
    id: "key_1",
    name: "Production Main",
    maskedKey: "[API KEY REMOVED]",
    environment: "Production",
    permissions: "Read/Write",
    createdBy: "S. Nakamoto",
    status: "Active",
  },
  {
    id: "key_2",
    name: "Staging Integration",
    maskedKey: "sk_test_****5L1P",
    environment: "Sandbox",
    permissions: "Read Only",
    createdBy: "V. Buterin",
    status: "Active",
  },
];

export const MOCK_RECENT_API_ACTIVITY: IApiActivityEntry[] = [
  {
    id: "act_1",
    timestamp: "2023-11-24 14:22:01",
    endpoint: "/v1/assets/tokenize",
    method: "POST",
    status: "200 OK",
    result: "success",
  },
  {
    id: "act_2",
    timestamp: "2023-11-24 14:21:58",
    endpoint: "/v1/user/auth",
    method: "POST",
    status: "401 Auth",
    result: "error",
  },
  {
    id: "act_3",
    timestamp: "2023-11-24 14:21:45",
    endpoint: "/v1/ledger/query",
    method: "GET",
    status: "200 OK",
    result: "success",
  },
];

export const MOCK_WEBHOOKS: IWebhookEndpoint[] = [
  {
    id: "hook_1",
    name: "Production Analytics",
    url: "https://api.analytics.sora/hooks/v1/...",
    event: "Tokenization",
    status: "Active",
    createdAgo: "3 days ago",
  },
  {
    id: "hook_2",
    name: "Internal Audit Log",
    url: "https://hooks.internal.org/audit/...",
    event: "Documents",
    status: "Active",
    createdAgo: "12 days ago",
  },
];

export const MOCK_WEBHOOK_EVENT_CATEGORIES: IWebhookEventCategory[] = [
  { id: "assets", label: "Assets", eventCount: 3 },
  { id: "documents", label: "Documents", eventCount: 2 },
  { id: "tokenization", label: "Tokenization", eventCount: 4 },
  { id: "ownership", label: "Ownership", eventCount: 2 },
];

export const MOCK_RECENT_DELIVERIES: IWebhookDelivery[] = [
  {
    id: "del_1",
    timestamp: "2026-07-10 14:32:01",
    eventType: "asset.issued",
    endpoint: "Production Analytics",
    httpStatus: "200 OK",
    latency: "142ms",
    result: "success",
  },
  {
    id: "del_2",
    timestamp: "2026-07-09 09:14:07",
    eventType: "doc.uploaded",
    endpoint: "Internal Audit Log",
    httpStatus: "500 Err",
    latency: "3.1s",
    result: "fail",
  },
  {
    id: "del_3",
    timestamp: "2026-07-08 22:05:44",
    eventType: "tokenization.confirmed",
    endpoint: "Production Analytics",
    httpStatus: "200 OK",
    latency: "98ms",
    result: "success",
  },
];

export const MOCK_ENDPOINT_CATEGORIES: IApiEndpointCategory[] = [
  { id: "assets", label: "Assets", endpointCount: 12 },
  { id: "documents", label: "Documents", endpointCount: 8 },
  { id: "tokenization", label: "Tokenization", endpointCount: 6 },
  { id: "registry", label: "Registry", endpointCount: 4 },
  { id: "orgs", label: "Orgs", endpointCount: 4 },
];

export const MOCK_ENDPOINT_GROUPS: IApiEndpointGroup[] = [
  {
    id: "assets-api",
    title: "Assets API",
    defaultOpen: true,
    endpoints: [
      {
        id: "assets-create",
        method: "POST",
        path: "/v1/assets",
        description: "Create a new RWA asset definition",
      },
      {
        id: "assets-list",
        method: "GET",
        path: "/v1/assets",
        description: "List all assets in your workspace",
      },
    ],
  },
  {
    id: "tokenization-api",
    title: "Tokenization API",
    defaultOpen: true,
    endpoints: [
      {
        id: "tokenization-issue",
        method: "POST",
        path: "/v1/tokenization/issue",
        description: "Issue a tokenized representation of an asset on Stellar",
      },
    ],
  },
];

export const TOKENIZATION_REQUEST_SAMPLE = `{
  "asset_id": "AST-9921",
  "amount": "1000000",
  "destination": "G...2K"
}`;

export const TOKENIZATION_CURL_SNIPPET = `curl -X POST https://api.sora.com/v1/tokenization/issue \\
  -H "Authorization: Bearer [API KEY]" \\
  -d '{"asset_id": "AST-9921"}'`;
