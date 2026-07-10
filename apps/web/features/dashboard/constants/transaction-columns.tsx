import { Badge } from "@repo/ui/components/ui/badge";

import type { IStellarTransaction } from "../lib/types";
import type { DataTableColumn } from "@repo/ui/components/ui-customs/data-table";

const STATUS_BADGE_VARIANT: Record<IStellarTransaction["status"], "success" | "error" | "warning"> =
  {
    success: "success",
    failed: "error",
    pending: "warning",
  };

export const TRANSACTION_COLUMNS: DataTableColumn<IStellarTransaction>[] = [
  {
    key: "txHash",
    header: "TX Hash",
    sortable: true,
    sortValue: (row) => row.txHash,
    cell: (row) => <span className="font-mono text-xs text-primary">{row.txHash}</span>,
  },
  {
    key: "assetCode",
    header: "Asset Code",
    sortable: true,
    sortValue: (row) => row.assetCode,
    cell: (row) => <span className="font-mono text-xs font-semibold">{row.assetCode}</span>,
  },
  {
    key: "type",
    header: "Type",
    cell: (row) => <span className="text-xs text-muted-foreground">{row.type}</span>,
  },
  {
    key: "fee",
    header: "Fee",
    cell: (row) => <span className="font-mono text-xs">{row.fee}</span>,
  },
  {
    key: "status",
    header: "Status",
    align: "right",
    cell: (row) => (
      <Badge variant={STATUS_BADGE_VARIANT[row.status]} className="uppercase">
        {row.status}
      </Badge>
    ),
  },
];
