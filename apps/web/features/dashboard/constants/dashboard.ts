import type { ITokenizationQueueItem, IWorkspaceHealth, TApiMethod } from "../lib/types";
import type { ChartConfig } from "@repo/ui/components/ui/chart";

export const TOKENIZATION_STATUS_BADGE_VARIANT: Record<
  ITokenizationQueueItem["status"],
  "default" | "warning"
> = {
  Issue: "default",
  Review: "warning",
};

export const WORKSPACE_HEALTH_DOT_CLASS: Record<
  IWorkspaceHealth["apiGateway"] | IWorkspaceHealth["stellarTestnet"],
  string
> = {
  OPERATIONAL: "bg-success",
  HEALTHY: "bg-success",
  DEGRADED: "bg-warning",
  DOWN: "bg-error",
};

export const WORKSPACE_HEALTH_TEXT_CLASS: Record<
  IWorkspaceHealth["apiGateway"] | IWorkspaceHealth["stellarTestnet"],
  string
> = {
  OPERATIONAL: "text-success",
  HEALTHY: "text-success",
  DEGRADED: "text-warning",
  DOWN: "text-error",
};

export const ASSET_VALUE_CHART_CONFIG = {
  value: {
    label: "Asset Value ($M)",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export const ASSET_VALUE_RANGES = ["1M", "3M", "1Y", "MAX"] as const;
export type TAssetValueTimeRange = (typeof ASSET_VALUE_RANGES)[number];

export const PORTFOLIO_DISTRIBUTION_CHART_CONFIG = {
  portfolio: {
    label: "Portfolio",
  },
} satisfies ChartConfig;

export const PORTFOLIO_DISTRIBUTION_DEFAULT_COLORS = [
  "var(--secondary)",
  "var(--primary)",
  "var(--warning)",
  "var(--soft-primary)",
];

export const PORTFOLIO_TOTAL_LABEL = "1.2B";

export const API_METHOD_CLASS: Record<TApiMethod, string> = {
  GET: "text-success",
  POST: "text-primary",
  PUT: "text-warning",
  DELETE: "text-error",
};
