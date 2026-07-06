import type { ICreateAssetStepConfig } from "../lib/types";

export const CREATE_ASSET_STEPS: ICreateAssetStepConfig[] = [
  { key: "basic-information", label: "Basic Information" },
  { key: "ownership-details", label: "Ownership Details" },
  { key: "supporting-documents", label: "Supporting Documents" },
  { key: "review-submit", label: "Review & Submit" },
];
