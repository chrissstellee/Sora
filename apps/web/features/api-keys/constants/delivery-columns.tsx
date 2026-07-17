import { CheckCircle2, XCircle } from "lucide-react";

import { cn } from "@repo/ui/lib/utils";

import type { IWebhookDelivery } from "../lib/types";
import type { DataTableColumn } from "@repo/ui/components/ui-customs/data-table";

export const DELIVERY_COLUMNS: DataTableColumn<IWebhookDelivery>[] = [
  {
    key: "timestamp",
    header: "Timestamp",
    cell: (row) => <span className="text-xs text-muted-foreground">{row.timestamp}</span>,
  },
  {
    key: "eventType",
    header: "Event Type",
    cell: (row) => <span className="font-mono text-xs text-foreground">{row.eventType}</span>,
  },
  {
    key: "endpoint",
    header: "Webhook Endpoint",
    cell: (row) => <span className="text-xs text-foreground">{row.endpoint}</span>,
  },
  {
    key: "httpStatus",
    header: "HTTP Status",
    cell: (row) => (
      <span
        className={cn(
          "text-xs font-semibold",
          row.result === "success" ? "text-success" : "text-error",
        )}
      >
        {row.httpStatus}
      </span>
    ),
  },
  {
    key: "latency",
    header: "Latency",
    cell: (row) => <span className="text-xs text-muted-foreground">{row.latency}</span>,
  },
  {
    key: "result",
    header: "Result",
    cell: (row) =>
      row.result === "success" ? (
        <CheckCircle2 className="size-4 text-success" />
      ) : (
        <XCircle className="size-4 text-error" />
      ),
  },
];
