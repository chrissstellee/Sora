import { MOCK_API_KEYS, MOCK_RECENT_API_ACTIVITY } from "../lib/mock-developers";

import type { IApiActivityEntry, IApiKeyEntry } from "../lib/types";

interface IUseApiKeysResult {
  apiKeys: IApiKeyEntry[];
  recentActivity: IApiActivityEntry[];
  isLoading: boolean;
}

export function useApiKeys(): IUseApiKeysResult {
  // Mock implementation — swap for a real data-fetching hook when the API is available.
  return {
    apiKeys: MOCK_API_KEYS,
    recentActivity: MOCK_RECENT_API_ACTIVITY,
    isLoading: false,
  };
}
