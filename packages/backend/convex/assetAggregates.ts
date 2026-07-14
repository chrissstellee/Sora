import { TableAggregate } from "@convex-dev/aggregate";

import { components } from "./_generated/api.js";

import type { DataModel, Id } from "./_generated/dataModel.js";

export const assetLifecycleCounts = new TableAggregate<{
  Namespace: Id<"organizations">;
  Key: string;
  DataModel: DataModel;
  TableName: "assets";
}>(components.assetLifecycleCounts, {
  namespace: (asset) => asset.organizationId,
  sortKey: (asset) => asset.lifecycle,
});
