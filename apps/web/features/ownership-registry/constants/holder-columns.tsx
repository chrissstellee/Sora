import { Building2, Eye, Leaf, Ship } from "lucide-react";
import * as React from "react";

import { Button } from "@repo/ui/components/ui/button";
import { cn } from "@repo/ui/lib/utils";

import type { IHolderEntry, TTrustlineStatus } from "../lib/types";
import type { DataTableColumn } from "@repo/ui/components/ui-customs/data-table";

const ASSET_ICON: Record<string, React.ElementType> = {
  "SORA-PRIME": Building2,
  "SOLA-X": Leaf,
  DOTW: Building2,
  PLH: Ship,
  ZUR4: Building2,
  LGB8: Building2,
};

const TRUSTLINE_DOT_CLASS: Record<TTrustlineStatus, string> = {
  Authorized: "bg-success",
  Frozen: "bg-info",
  Unauthorized: "bg-muted-foreground/40",
};

const TRUSTLINE_TEXT_CLASS: Record<TTrustlineStatus, string> = {
  Authorized: "text-success",
  Frozen: "text-info",
  Unauthorized: "text-muted-foreground",
};

function formatNumber(value: number) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface HolderRowActionsProps {
  entry: IHolderEntry;
  onView: (entry: IHolderEntry) => void;
}

function HolderRowActions({ entry, onView }: HolderRowActionsProps) {
  return (
    <div className="flex justify-end">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`View ${entry.investorName}'s holding`}
        onClick={(e) => {
          e.stopPropagation();
          onView(entry);
        }}
      >
        <Eye />
      </Button>
    </div>
  );
}

export function getHolderColumns(
  onView: (entry: IHolderEntry) => void,
): DataTableColumn<IHolderEntry>[] {
  return [
    {
      key: "assetDetails",
      header: "Asset Details",
      sortable: true,
      sortValue: (row) => row.assetCode,
      headerClassName: "w-[20%]",
      cellClassName: "w-[20%]",
      cell: (row) => {
        const Icon = ASSET_ICON[row.assetCode] ?? Building2;
        return (
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
              <Icon className="size-4" />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold text-foreground">
                {row.assetCode}
              </span>
              <span className="truncate text-xs text-muted-foreground">{row.assetSubLabel}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: "investorName",
      header: "Investor Name",
      sortable: true,
      sortValue: (row) => row.investorName,
      headerClassName: "w-[18%]",
      cellClassName: "w-[18%]",
      cell: (row) => (
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-foreground">{row.investorName}</span>
          <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
            {row.holderType}
          </span>
        </div>
      ),
    },
    {
      key: "stellarWallet",
      header: "Stellar Wallet",
      cell: (row) => (
        <span className="font-mono text-xs text-muted-foreground">{row.stellarWallet}</span>
      ),
    },
    {
      key: "ownershipPercent",
      header: "Ownership %",
      sortable: true,
      sortValue: (row) => row.ownershipPercent,
      cell: (row) => (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-foreground">
            {row.ownershipPercent.toFixed(2)}%
          </span>
          <div className="h-1 w-20 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-secondary"
              style={{ width: `${Math.min(100, row.ownershipPercent)}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: "tokenBalance",
      header: "Token Balance",
      sortable: true,
      sortValue: (row) => row.tokenBalance,
      cell: (row) => (
        <span className="font-semibold text-foreground">{formatNumber(row.tokenBalance)}</span>
      ),
    },
    {
      key: "trustline",
      header: "Trustline",
      cell: (row) => (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-xs font-medium uppercase",
            TRUSTLINE_TEXT_CLASS[row.trustlineStatus],
          )}
        >
          <span className={cn("size-1.5 rounded-full", TRUSTLINE_DOT_CLASS[row.trustlineStatus])} />
          {row.trustlineStatus}
        </span>
      ),
    },
    {
      key: "lastUpdated",
      header: "Last Updated",
      sortable: true,
      sortValue: (row) => row.lastUpdated,
      cell: (row) => <span className="text-xs text-muted-foreground">{row.lastUpdated}</span>,
    },
    {
      key: "actions",
      header: "Action",
      align: "center",
      cell: (row) => <HolderRowActions entry={row} onView={onView} />,
    },
  ];
}
