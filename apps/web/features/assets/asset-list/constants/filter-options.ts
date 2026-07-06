import { ASSET_CATEGORY_OPTIONS } from "../../constants/asset-category-options";

import type { TAssetStatus } from "../lib/types";

export interface FilterOption {
  label: string;
  value: string;
}

export const TYPE_FILTER_OPTIONS = [{ value: "all", label: "Type" }, ...ASSET_CATEGORY_OPTIONS];

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
