import { MoreHorizontal } from "lucide-react";

import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { cn } from "@repo/ui/lib/utils";

import type { IWebhookEndpoint, TWebhookStatus } from "../lib/types";
import type { DataTableColumn } from "@repo/ui/components/ui-customs/data-table";

const STATUS_DOT_CLASS: Record<TWebhookStatus, string> = {
  Active: "bg-success",
  Paused: "bg-muted-foreground/40",
};

const STATUS_TEXT_CLASS: Record<TWebhookStatus, string> = {
  Active: "text-success",
  Paused: "text-muted-foreground",
};

export const WEBHOOK_COLUMNS: DataTableColumn<IWebhookEndpoint>[] = [
  {
    key: "name",
    header: "Endpoint Name",
    cell: (row) => <span className="font-semibold text-foreground">{row.name}</span>,
  },
  {
    key: "url",
    header: "Endpoint URL",
    cell: (row) => (
      <span className="block max-w-[220px] truncate font-mono text-xs text-muted-foreground">
        {row.url}
      </span>
    ),
  },
  {
    key: "event",
    header: "Events",
    cell: (row) => <Badge variant="outline">{row.event}</Badge>,
  },
  {
    key: "status",
    header: "Status",
    cell: (row) => (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-medium uppercase",
          STATUS_TEXT_CLASS[row.status],
        )}
      >
        <span className={cn("size-1.5 rounded-full", STATUS_DOT_CLASS[row.status])} />
        {row.status}
      </span>
    ),
  },
  {
    key: "createdAgo",
    header: "Created",
    cell: (row) => <span className="text-xs text-muted-foreground">{row.createdAgo}</span>,
  },
  {
    key: "actions",
    header: "",
    headerClassName: "w-10",
    cell: () => (
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Webhook actions"
        onClick={(e) => e.stopPropagation()}
      >
        <MoreHorizontal className="size-4" />
      </Button>
    ),
  },
];
