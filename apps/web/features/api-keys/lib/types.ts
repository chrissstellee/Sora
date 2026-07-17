export type TApiKeyEnvironment = "Sandbox" | "Production";

export type TApiKeyStatus = "Active" | "Revoked";

export type TApiMethod = "GET" | "POST" | "PUT" | "DELETE";

export type TActivityResult = "success" | "error";

export type TWebhookStatus = "Active" | "Paused";

export type TDeliveryResult = "success" | "fail";

export interface IApiKeyEntry {
  id: string;
  name: string;
  maskedKey: string;
  environment: TApiKeyEnvironment;
  permissions: string;
  createdBy: string;
  status: TApiKeyStatus;
}

export interface IApiActivityEntry {
  id: string;
  timestamp: string;
  endpoint: string;
  method: TApiMethod;
  status: string;
  result: TActivityResult;
}

export interface IWebhookEndpoint {
  id: string;
  name: string;
  url: string;
  event: string;
  status: TWebhookStatus;
  createdAgo: string;
}

export interface IWebhookEventCategory {
  id: string;
  label: string;
  eventCount: number;
}

export interface IWebhookDelivery {
  id: string;
  timestamp: string;
  eventType: string;
  endpoint: string;
  httpStatus: string;
  latency: string;
  result: TDeliveryResult;
}

export interface IDevelopersStats {
  totalApiKeys: number;
  totalApiKeysDelta: string;
  apiRequestsToday: number;
  apiRequestsGrowth: string;
  avgResponseTime: string;
  avgResponseCaption: string;
  apiStatus: string;
  apiStatusCaption: string;
}

export interface IApiEndpointCategory {
  id: string;
  label: string;
  endpointCount: number;
}

export interface IApiEndpoint {
  id: string;
  method: TApiMethod;
  path: string;
  description: string;
}

export interface IApiEndpointGroup {
  id: string;
  title: string;
  defaultOpen?: boolean;
  endpoints: IApiEndpoint[];
}

export interface IPermissionScopeOption {
  value: string;
  label: string;
}
