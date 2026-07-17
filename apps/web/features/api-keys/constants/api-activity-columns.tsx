import { Badge } from "@repo/ui/components/ui/badge";
import { cn } from "@repo/ui/lib/utils";

import type { IApiActivityEntry, TApiMethod } from "../lib/types";
import type { DataTableColumn } from "@repo/ui/components/ui-customs/data-table";

const METHOD_BADGE_VARIANT: Record<TApiMethod, "default" | "secondary" | "outline" | "gray"> = {
  POST: "default",
  GET: "secondary",
  PUT: "outline",
  DELETE: "gray",
};

export const API_ACTIVITY_COLUMNS: DataTableColumn<IApiActivityEntry>[] = [
  {
    key: "timestamp",
    header: "Timestamp",
    cell: (row) => <span className="text-xs text-muted-foreground">{row.timestamp}</span>,
  },
  {
    key: "endpoint",
    header: "Endpoint",
    cell: (row) => <span className="font-mono text-xs text-foreground">{row.endpoint}</span>,
  },
  {
    key: "method",
    header: "Method",
    cell: (row) => (
      <Badge variant={METHOD_BADGE_VARIANT[row.method]} className="uppercase">
        {row.method}
      </Badge>
    ),
  },
  {
    key: "status",
    header: "Status",
    cell: (row) => (
      <span
        className={cn(
          "text-xs font-semibold",
          row.result === "success" ? "text-success" : "text-error",
        )}
      >
        {row.status}
      </span>
    ),
  },
];
