import * as React from "react";

import { publicStellarConfig } from "@/core/config/env";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";

import type { IIssuanceQueueEntry, TIssuanceStatus } from "../lib/types";
import type { DataTableColumn } from "@repo/ui/components/ui-customs/data-table";

const STATUS_BADGE_VARIANT: Record<TIssuanceStatus, "secondary" | "gray" | "success" | "error"> = {
  Ready: "secondary",
  Draft: "gray",
  Issued: "success",
  Failed: "error",
};

function formatValue(value: number) {
  if (value < 1) {
    return `$${Math.round(value * 1000)}K`;
  }
  return `$${value.toFixed(2)}M`;
}

interface IssuanceActionButtonProps {
  entry: IIssuanceQueueEntry;
  onConfigure: (entry: IIssuanceQueueEntry) => void;
}

function IssuanceActionButton({ entry, onConfigure }: IssuanceActionButtonProps) {
  const handleClick = (event: React.MouseEvent) => {
    // Prevent the row's onRowClick (if any) from also firing.
    event.stopPropagation();
    onConfigure(entry);
  };

  switch (entry.status) {
    case "Ready":
      return (
        <Button
          variant="default"
          size="sm"
          onClick={handleClick}
          className="w-full bg-soft-primary text-background hover:bg-soft-primary/80"
        >
          Issue on Stellar
        </Button>
      );
    case "Failed":
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClick}
          className="w-full border-error/40 text-error hover:bg-error/10 hover:text-error"
        >
          Retry
        </Button>
      );
    case "Draft":
    case "Issued":
    default:
      return (
        <Button variant="outline" size="sm" onClick={handleClick} className="w-full">
          Re-Configure
        </Button>
      );
  }
}

export function getTokenizationColumns(
  onConfigure: (entry: IIssuanceQueueEntry) => void,
): DataTableColumn<IIssuanceQueueEntry>[] {
  return [
    {
      key: "name",
      header: "Asset Name",
      sortable: true,
      sortValue: (row) => row.name,
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">{row.name}</span>
        </div>
      ),
    },
    {
      key: "assetId",
      header: "Asset ID",
      sortable: true,
      sortValue: (row) => row.assetId,
      cell: (row) => <span className="font-mono text-xs text-muted-foreground">{row.assetId}</span>,
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      sortValue: (row) => row.category,
      cell: (row) => (
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {row.category}
        </span>
      ),
    },
    {
      key: "value",
      header: "Value",
      sortable: true,
      sortValue: (row) => row.value,
      cell: (row) => <span className="font-semibold">{formatValue(row.value)}</span>,
    },
    {
      key: "code",
      header: "Code",
      sortable: true,
      sortValue: (row) => row.code,
      cell: (row) => <span className="font-mono text-xs text-foreground">{row.code}</span>,
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
      key: "network",
      header: "Network",
      cell: (row) => (
        <span
          className={
            row.network === publicStellarConfig.uiLabel
              ? "text-xs font-medium text-foreground"
              : "text-xs font-medium text-muted-foreground"
          }
        >
          {row.network}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      cell: (row) => (
        <div className="flex justify-center">
          <IssuanceActionButton entry={row} onConfigure={onConfigure} />
        </div>
      ),
    },
  ];
}
