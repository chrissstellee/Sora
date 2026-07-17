import {
  MOCK_RECENT_DELIVERIES,
  MOCK_WEBHOOK_EVENT_CATEGORIES,
  MOCK_WEBHOOKS,
} from "../lib/mock-developers";

import type { IWebhookDelivery, IWebhookEndpoint, IWebhookEventCategory } from "../lib/types";

interface IUseWebhooksResult {
  webhooks: IWebhookEndpoint[];
  eventTypes: IWebhookEventCategory[];
  recentDeliveries: IWebhookDelivery[];
  isLoading: boolean;
}

export function useWebhooks(): IUseWebhooksResult {
  // Mock implementation — swap for a real data-fetching hook when the API is available.
  return {
    webhooks: MOCK_WEBHOOKS,
    eventTypes: MOCK_WEBHOOK_EVENT_CATEGORIES,
    recentDeliveries: MOCK_RECENT_DELIVERIES,
    isLoading: false,
  };
}
