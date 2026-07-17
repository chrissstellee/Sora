import { describe, expect, it } from "vitest";

import {
  ASSET_LIFECYCLE_STATES,
  transitionAssetLifecycle,
  type AssetLifecycleTransition,
} from "./asset-lifecycle.js";

const allowed: AssetLifecycleTransition[] = [
  { from: "Draft", to: "Review" },
  { from: "Draft", to: "Archived" },
  { from: "Review", to: "Draft" },
  { from: "Review", to: "Ready" },
  { from: "Review", to: "Archived" },
  { from: "Ready", to: "Issuing" },
  { from: "Ready", to: "Archived" },
  { from: "Issuing", to: "Active" },
  { from: "Issuing", to: "Failed" },
  { from: "Active", to: "Archived" },
];

describe("asset lifecycle", () => {
  it.each(allowed)("permits $from -> $to", ({ from, to }) => {
    expect(transitionAssetLifecycle(from, to)).toBe(to);
  });

  for (const state of ASSET_LIFECYCLE_STATES) {
    it(`rejects duplicate ${state} transitions`, () => {
      expect(() => transitionAssetLifecycle(state, state)).toThrow(/Invalid/);
    });
  }

  it("rejects invalid and terminal transitions", () => {
    expect(() => transitionAssetLifecycle("Draft", "Active")).toThrow(/Invalid/);
    expect(() => transitionAssetLifecycle("Archived", "Draft")).toThrow(/Invalid/);
    expect(() => transitionAssetLifecycle("Failed", "Issuing")).toThrow(/Invalid/);
  });
});
