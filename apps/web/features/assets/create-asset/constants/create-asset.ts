import { ICreateAssetStepConfig } from "../lib/types";

import type { ISelectOption } from "../../lib/types";

// Currency options for the asset creation form
export const CURRENCY_OPTIONS: ISelectOption[] = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "SGD", label: "SGD" },
];

// Ownership type options for the asset creation form
export const OWNERSHIP_TYPE_OPTIONS: ISelectOption[] = [
  { value: "Individual", label: "Individual" },
  { value: "Organization", label: "Organization" },
  { value: "Trust", label: "Trust" },
  { value: "Joint Venture", label: "Joint Venture" },
];

// Configuration for the steps in the asset creation process
export const CREATE_ASSET_STEPS: ICreateAssetStepConfig[] = [
  { key: "basic-information", label: "Basic Information" },
  { key: "ownership-details", label: "Ownership Details" },
  { key: "supporting-documents", label: "Supporting Documents" },
  { key: "review-submit", label: "Review & Submit" },
];
