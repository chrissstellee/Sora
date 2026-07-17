/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activity from "../activity.js";
import type * as activityWriter from "../activityWriter.js";
import type * as assetAggregates from "../assetAggregates.js";
import type * as assets from "../assets.js";
import type * as auth from "../auth.js";
import type * as demo from "../demo.js";
import type * as demoWorker from "../demoWorker.js";
import type * as documentActions from "../documentActions.js";
import type * as documents from "../documents.js";
import type * as helpers from "../helpers.js";
import type * as issuanceWorker from "../issuanceWorker.js";
import type * as issuances from "../issuances.js";
import type * as ownership from "../ownership.js";
import type * as ownershipWorker from "../ownershipWorker.js";
import type * as phase2Faults from "../phase2Faults.js";
import type * as tasks from "../tasks.js";
import type * as tokenization from "../tokenization.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  activityWriter: typeof activityWriter;
  assetAggregates: typeof assetAggregates;
  assets: typeof assets;
  auth: typeof auth;
  demo: typeof demo;
  demoWorker: typeof demoWorker;
  documentActions: typeof documentActions;
  documents: typeof documents;
  helpers: typeof helpers;
  issuanceWorker: typeof issuanceWorker;
  issuances: typeof issuances;
  ownership: typeof ownership;
  ownershipWorker: typeof ownershipWorker;
  phase2Faults: typeof phase2Faults;
  tasks: typeof tasks;
  tokenization: typeof tokenization;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  assetLifecycleCounts: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"assetLifecycleCounts">;
};
