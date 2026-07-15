import { ASSET_LIFECYCLE_OPTIONS } from "./asset-record.js";

export const ASSET_LIFECYCLE_STATES = ASSET_LIFECYCLE_OPTIONS;

export type AssetLifecycleState = (typeof ASSET_LIFECYCLE_STATES)[number];

export interface AssetLifecycleTransition {
  from: AssetLifecycleState;
  to: AssetLifecycleState;
}

const ALLOWED_TRANSITIONS: Record<AssetLifecycleState, readonly AssetLifecycleState[]> = {
  Draft: ["Review", "Archived"],
  Review: ["Draft", "Ready", "Archived"],
  Ready: ["Issuing", "Archived"],
  Issuing: ["Active", "Failed"],
  Active: ["Archived"],
  Failed: [],
  Archived: [],
};

export function isAssetLifecycleTransitionAllowed(transition: AssetLifecycleTransition): boolean {
  return ALLOWED_TRANSITIONS[transition.from].includes(transition.to);
}

export function transitionAssetLifecycle(
  from: AssetLifecycleState,
  to: AssetLifecycleState,
): AssetLifecycleState {
  if (!isAssetLifecycleTransitionAllowed({ from, to })) {
    throw new Error(`Invalid asset lifecycle transition: ${from} -> ${to}`);
  }
  return to;
}
