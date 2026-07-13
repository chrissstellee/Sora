import { describe, expect, it } from "vitest";

import {
  ASSET_LIFECYCLE_STATES,
  transitionAssetLifecycle,
  type AssetLifecycleTransition,
} from "./asset-lifecycle.js";

const allowed: AssetLifecycleTransition[] = [
  { from: "draft", to: "review" },
  { from: "draft", to: "archived" },
  { from: "review", to: "draft" },
  { from: "review", to: "ready" },
  { from: "review", to: "archived" },
  { from: "ready", to: "issuing" },
  { from: "ready", to: "archived" },
  { from: "issuing", to: "active" },
  { from: "issuing", to: "failed" },
  { from: "failed", to: "issuing" },
  { from: "active", to: "archived" },
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
    expect(() => transitionAssetLifecycle("draft", "active")).toThrow(/Invalid/);
    expect(() => transitionAssetLifecycle("archived", "draft")).toThrow(/Invalid/);
  });
});
