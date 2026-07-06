import { ArrowUpRight, Download, FileText } from "lucide-react";

import { Button } from "@repo/ui/components/ui/button";

import { IAssetDocument } from "../lib/types";
import { DOC_TYPE_CLASS } from "./asset-details";

import type { DataTableColumn } from "@repo/ui/components/ui-customs/data-table";

export const DOCS_COLUMNS: DataTableColumn<IAssetDocument>[] = [
  {
    key: "name",
    header: "Name",
    sortable: true,
    sortValue: (row) => row.name,
    cell: (row) => (
      <div className="flex items-center gap-2">
        <div className="flex size-7 shrink-0 items-center justify-center rounded bg-muted text-primary">
          <FileText className="size-3.5" />
        </div>
        <span className="font-medium text-foreground">{row.name}</span>
      </div>
    ),
  },
  {
    key: "type",
    header: "Type",
    sortable: true,
    sortValue: (row) => row.type,
    cell: (row) => (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${DOC_TYPE_CLASS[row.type]}`}
      >
        {row.type}
      </span>
    ),
  },
  {
    key: "date",
    header: "Date",
    sortable: true,
    sortValue: (row) => new Date(row.date),
    cell: (row) => <span className="text-xs text-muted-foreground">{row.date}</span>,
  },
  {
    key: "actions",
    header: "Actions",
    align: "right",
    cell: () => (
      <div className="flex items-center justify-end gap-1">
        <Button variant="ghost" size="icon-sm" aria-label="Download document">
          <Download className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="View document">
          <ArrowUpRight className="size-3.5" />
        </Button>
      </div>
    ),
  },
];
