import { Badge } from "@repo/ui/components/ui/badge";
import { cn } from "@repo/ui/lib/utils";

import type { ITransferFeedEntry, TTransferType } from "../lib/types";
import type { DataTableColumn } from "@repo/ui/components/ui-customs/data-table";

const TYPE_BADGE_VARIANT: Record<TTransferType, "success" | "gray" | "error"> = {
  "Primary Issuance": "success",
  "Peer Transfer": "gray",
  Clawback: "error",
};

function formatAmount(amount: number) {
  const sign = amount > 0 ? "+" : "";
  return `${sign}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export const TRANSFER_FEED_COLUMNS: DataTableColumn<ITransferFeedEntry>[] = [
  {
    key: "timestamp",
    header: "Timestamp",
    cell: (row) => <span className="text-xs text-muted-foreground">{row.timestamp}</span>,
  },
  {
    key: "asset",
    header: "Asset",
    cell: (row) => <span className="text-sm font-semibold text-foreground">{row.asset}</span>,
  },
  {
    key: "type",
    header: "Type",
    cell: (row) => (
      <Badge variant={TYPE_BADGE_VARIANT[row.type]} className="uppercase">
        {row.type}
      </Badge>
    ),
  },
  {
    key: "from",
    header: "From",
    cell: (row) => <span className="font-mono text-xs text-muted-foreground">{row.from}</span>,
  },
  {
    key: "to",
    header: "To",
    cell: (row) => <span className="font-mono text-xs text-muted-foreground">{row.to}</span>,
  },
  {
    key: "amountMoved",
    header: "Amount Moved",
    cell: (row) => (
      <span
        className={cn("text-sm font-semibold", row.amountMoved > 0 ? "text-success" : "text-error")}
      >
        {formatAmount(row.amountMoved)}
      </span>
    ),
  },
  {
    key: "txHash",
    header: "Tx Hash",
    align: "right",
    cell: (row) => <span className="font-mono text-xs text-primary">{row.txHash}</span>,
  },
];
