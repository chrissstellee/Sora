import { ASSET_CATEGORY_OPTIONS } from "../../constants/assets";

import type { TAssetStatus, ILifecycleStep } from "../lib/types";

export interface FilterOption {
  label: string;
  value: string;
}

export const TYPE_FILTER_OPTIONS = [{ value: "all", label: "Type" }, ...ASSET_CATEGORY_OPTIONS];

// The status filter options used to filter assets based on their status.
export const STATUS_FILTER_OPTIONS: FilterOption[] = [
  { label: "All Statuses", value: "all" },
  { label: "Tokenized", value: "Tokenized" satisfies TAssetStatus },
  { label: "Review", value: "Review" satisfies TAssetStatus },
  { label: "Draft", value: "Draft" satisfies TAssetStatus },
];

// The country filter options used to filter assets based on their country.
export const COUNTRY_FILTER_OPTIONS: FilterOption[] = [
  { label: "All Countries", value: "all" },
  { label: "United States", value: "United States" },
  { label: "United Kingdom", value: "United Kingdom" },
  { label: "Singapore", value: "Singapore" },
  { label: "UAE", value: "UAE" },
  { label: "Germany", value: "Germany" },
];

// Every asset moves through the same five stages, in this fixed order.
export const LIFECYCLE_STEPS: ILifecycleStep[] = [
  { key: "create", label: "Create" },
  { key: "docs", label: "Docs" },
  { key: "review", label: "Review" },
  { key: "issued", label: "Issued" },
  { key: "active", label: "Active" },
];
