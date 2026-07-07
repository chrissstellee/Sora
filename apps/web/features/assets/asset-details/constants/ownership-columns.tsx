import { ArrowUpRight, Copy } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@repo/ui/components/ui/badge";

import type { IHolder, ITransfer } from "../lib/types";
import type { DataTableColumn } from "@repo/ui/components/ui-customs/data-table";

const handleCopy = (val: string, label: string) => {
  navigator.clipboard.writeText(val);
  toast.success(`${label} copied to clipboard`);
};

export const OWNERSHIP_COLUMNS: DataTableColumn<IHolder>[] = [
  {
    key: "name",
    header: "Investor Name",
    sortable: true,
    sortValue: (row) => row.name,
    cell: (row) => <span className="font-semibold text-foreground">{row.name}</span>,
  },
  {
    key: "type",
    header: "Type",
    sortable: true,
    sortValue: (row) => row.type,
    cell: (row) => (
      <Badge variant="outline" className="px-1.5 py-0 text-[9px] tracking-wider uppercase">
        {row.type}
      </Badge>
    ),
  },
  {
    key: "wallet",
    header: "Wallet",
    cell: (row) => (
      <div className="flex items-center gap-1">
        <span className="font-mono text-muted-foreground">{row.wallet}</span>
        <button
          onClick={() => handleCopy(row.walletFull, "Wallet address")}
          className="p-0.5 text-muted-foreground hover:text-foreground"
        >
          <Copy className="size-3" />
        </button>
      </div>
    ),
  },
  {
    key: "percentage",
    header: "Ownership %",
    sortable: true,
    sortValue: (row) => row.percentage,
    cell: (row) => (
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-secondary" style={{ width: `${row.percentage}%` }} />
        </div>
        <span className="font-semibold text-foreground">{row.percentage}%</span>
      </div>
    ),
  },
  {
    key: "balance",
    header: "Balance Status",
    align: "right",
    sortable: true,
    sortValue: (row) => parseFloat(row.balance.replace(/,/g, "")),
    cell: (row) => (
      <div className="inline-flex items-center justify-end gap-1.5">
        <span className="mr-1.5 font-mono font-semibold text-foreground">{row.balance}</span>
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-secondary">
          <span className="size-1 rounded-full bg-secondary" />
          {row.status}
        </span>
      </div>
    ),
  },
];

export const TRANSFER_COLUMNS: DataTableColumn<ITransfer>[] = [
  {
    key: "timestamp",
    header: "Timestamp",
    sortable: true,
    sortValue: (row) => row.timestamp,
    cell: (row) => <span className="text-muted-foreground">{row.timestamp}</span>,
  },
  {
    key: "type",
    header: "Type",
    sortable: true,
    sortValue: (row) => row.type,
    cell: (row) => <span className="font-medium text-foreground">{row.type}</span>,
  },
  {
    key: "from",
    header: "From",
    cell: (row) => <span className="font-mono text-muted-foreground">{row.from}</span>,
  },
  {
    key: "to",
    header: "To",
    cell: (row) => <span className="font-mono text-muted-foreground">{row.to}</span>,
  },
  {
    key: "amount",
    header: "Amount",
    sortable: true,
    sortValue: (row) => row.amount,
    cell: (row) => <span className="font-semibold text-foreground">{row.amount}</span>,
  },
  {
    key: "txHash",
    header: "TX",
    align: "right",
    cell: (row) => (
      <button
        onClick={() => handleCopy(row.txHash, "Transaction hash")}
        className="ml-auto flex items-center gap-1 font-mono text-primary hover:underline"
      >
        {row.txHash} <ArrowUpRight className="size-3 shrink-0" />
      </button>
    ),
  },
];
