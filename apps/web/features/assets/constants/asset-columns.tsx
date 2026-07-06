import { Building2, Mountain, Plane, Ship } from "lucide-react";

import { Badge } from "@repo/ui/components/ui/badge";
import { cn } from "@repo/ui/lib/utils";

import type { IAsset, TAssetStatus, TBlockchainStatus } from "../lib/types";
import type { DataTableColumn } from "@repo/ui/components/ui-customs/data-table";
import type * as React from "react";

const TYPE_ICON: Record<IAsset["type"], React.ElementType> = {
  "Real Estate": Building2,
  Aviation: Plane,
  Energy: Mountain,
  Maritime: Ship,
};

const STATUS_BADGE_VARIANT: Record<TAssetStatus, "secondary" | "default" | "gray"> = {
  Tokenized: "secondary",
  Review: "default",
  Draft: "gray",
};

const BLOCKCHAIN_DOT_CLASS: Record<TBlockchainStatus, string> = {
  Issued: "bg-secondary",
  Ready: "bg-primary",
  "Not Issued": "bg-muted-foreground/40",
};

const BLOCKCHAIN_TEXT_CLASS: Record<TBlockchainStatus, string> = {
  Issued: "text-foreground",
  Ready: "text-foreground",
  "Not Issued": "text-muted-foreground",
};

export const ASSET_COLUMNS: DataTableColumn<IAsset>[] = [
  {
    key: "name",
    header: "Asset Name",
    sortable: true,
    sortValue: (row) => row.name,
    cell: (row) => {
      const Icon = TYPE_ICON[row.type];
      return (
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
            <Icon className="size-4" />
          </div>
          <span className="font-semibold text-primary">{row.name}</span>
        </div>
      );
    },
  },
  {
    key: "assetId",
    header: "Asset ID",
    sortable: true,
    sortValue: (row) => row.assetId,
    cell: (row) => <span className="font-mono text-xs text-muted-foreground">{row.assetId}</span>,
  },
  {
    key: "type",
    header: "Type",
    sortable: true,
    sortValue: (row) => row.type,
    cell: (row) => row.type,
  },
  {
    key: "owner",
    header: "Owner",
    cell: (row) => row.owner,
  },
  {
    key: "estValue",
    header: "Est. Value",
    sortable: true,
    sortValue: (row) => row.estValue,
    cell: (row) => <span className="font-semibold">${row.estValue}M</span>,
  },
  {
    key: "status",
    header: "Asset Status",
    cell: (row) => (
      <Badge variant={STATUS_BADGE_VARIANT[row.status]} className="uppercase">
        {row.status}
      </Badge>
    ),
  },
  {
    key: "blockchain",
    header: "Blockchain",
    cell: (row) => (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-medium uppercase",
          BLOCKCHAIN_TEXT_CLASS[row.blockchain],
        )}
      >
        <span className={cn("size-1.5 rounded-full", BLOCKCHAIN_DOT_CLASS[row.blockchain])} />
        {row.blockchain}
      </span>
    ),
  },
];
