export const ASSET_LIFECYCLE_STATES = [
  "draft",
  "review",
  "ready",
  "issuing",
  "active",
  "failed",
  "archived",
] as const;

export type AssetLifecycleState = (typeof ASSET_LIFECYCLE_STATES)[number];

export interface AssetLifecycleTransition {
  from: AssetLifecycleState;
  to: AssetLifecycleState;
}

const ALLOWED_TRANSITIONS: Record<AssetLifecycleState, readonly AssetLifecycleState[]> = {
  draft: ["review", "archived"],
  review: ["draft", "ready", "archived"],
  ready: ["issuing", "archived"],
  issuing: ["active", "failed"],
  active: ["archived"],
  failed: ["issuing"],
  archived: [],
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
