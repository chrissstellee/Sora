"use client";

import * as React from "react";

import { MOCK_DASHBOARD_DATA } from "../lib/mock-dashboard";

import type { IDashboardData } from "../lib/types";

export interface IUseDashboardResult {
  data: IDashboardData;
  isLoading: boolean;
}

/**
 * Returns dashboard data for the Dashboard page.
 * Backed by mock data for now; swap the body for a real fetch hook later.
 */
export function useDashboard(): IUseDashboardResult {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const timeout = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timeout);
  }, []);

  return {
    data: MOCK_DASHBOARD_DATA,
    isLoading,
  };
}
