import { Building2, FileText, MoreVertical, Zap } from "lucide-react";
import Link from "next/link";

import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";

import type { IDashboardRecentAsset } from "../lib/types";
import type { DataTableColumn } from "@repo/ui/components/ui-customs/data-table";

const ICON_MAP: Record<IDashboardRecentAsset["icon"], React.ElementType> = {
  "real-estate": Building2,
  "trade-finance": FileText,
  energy: Zap,
};

const STATUS_BADGE_VARIANT: Record<
  IDashboardRecentAsset["status"],
  "secondary" | "warning" | "gray"
> = {
  Tokenized: "secondary",
  "Pending Review": "warning",
  Draft: "gray",
};

export const RECENT_ASSET_COLUMNS: DataTableColumn<IDashboardRecentAsset>[] = [
  {
    key: "name",
    header: "Asset Name",
    sortable: true,
    sortValue: (row) => row.name,
    cell: (row) => {
      const Icon = ICON_MAP[row.icon];
      return (
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
            <Icon className="size-4" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-foreground">{row.name}</span>
            <span className="font-mono text-xs text-muted-foreground">{row.assetId}</span>
          </div>
        </div>
      );
    },
  },
  {
    key: "class",
    header: "Class",
    sortable: true,
    sortValue: (row) => row.class,
    cell: (row) => <span className="text-muted-foreground">{row.class}</span>,
  },
  {
    key: "valuation",
    header: "Valuation",
    sortable: true,
    sortValue: (row) => row.valuation,
    cell: (row) => <span className="font-semibold">{row.valuation}</span>,
  },
  {
    key: "status",
    header: "Status",
    cell: (row) => (
      <Badge variant={STATUS_BADGE_VARIANT[row.status]} className="uppercase">
        {row.status}
      </Badge>
    ),
  },
  {
    key: "actions",
    header: "Actions",
    align: "right",
    cell: (row) => (
      <Button variant="ghost" size="icon-sm" asChild>
        <Link href={`/assets/${row.id}`}>
          <MoreVertical className="size-4" />
        </Link>
      </Button>
    ),
  },
];
