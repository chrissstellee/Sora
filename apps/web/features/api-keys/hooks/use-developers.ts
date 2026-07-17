import { MOCK_STATS } from "../lib/mock-developers";

import type { IDevelopersStats } from "../lib/types";

interface IUseDevelopersResult {
  stats: IDevelopersStats;
  isLoading: boolean;
}

export function useDevelopers(): IUseDevelopersResult {
  // Mock implementation — swap for a real data-fetching hook when the API is available.
  return {
    stats: MOCK_STATS,
    isLoading: false,
  };
}
