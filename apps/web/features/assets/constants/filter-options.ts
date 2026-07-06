import type { TAssetStatus, TAssetType } from "../lib/types";

export interface FilterOption {
  label: string;
  value: string;
}

export const TYPE_FILTER_OPTIONS: FilterOption[] = [
  { label: "All Types", value: "all" },
  { label: "Real Estate", value: "Real Estate" satisfies TAssetType },
  { label: "Aviation", value: "Aviation" satisfies TAssetType },
  { label: "Energy", value: "Energy" satisfies TAssetType },
  { label: "Maritime", value: "Maritime" satisfies TAssetType },
];

export const STATUS_FILTER_OPTIONS: FilterOption[] = [
  { label: "All Statuses", value: "all" },
  { label: "Tokenized", value: "Tokenized" satisfies TAssetStatus },
  { label: "Review", value: "Review" satisfies TAssetStatus },
  { label: "Draft", value: "Draft" satisfies TAssetStatus },
];

export const COUNTRY_FILTER_OPTIONS: FilterOption[] = [
  { label: "All Countries", value: "all" },
  { label: "United States", value: "United States" },
  { label: "United Kingdom", value: "United Kingdom" },
  { label: "Singapore", value: "Singapore" },
  { label: "UAE", value: "UAE" },
  { label: "Germany", value: "Germany" },
];
