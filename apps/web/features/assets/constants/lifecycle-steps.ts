import type { ILifecycleStep } from "../lib/types";

/** Every asset moves through the same five stages, in this fixed order. */
export const LIFECYCLE_STEPS: ILifecycleStep[] = [
  { key: "create", label: "Create" },
  { key: "docs", label: "Docs" },
  { key: "review", label: "Review" },
  { key: "issued", label: "Issued" },
  { key: "active", label: "Active" },
];
