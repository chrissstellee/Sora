"use client";

import { useRequest } from "@/features/assets/lib/use-request";
import { getWorkspaceSummary } from "@/features/assets/lib/workspace-api";

export function useDashboard() {
  return useRequest(getWorkspaceSummary, []);
}
