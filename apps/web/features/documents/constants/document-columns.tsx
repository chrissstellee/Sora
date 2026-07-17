import { Download, Eye, FileImage, FileSpreadsheet, FileText, Trash2 } from "lucide-react";
import * as React from "react";

import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";

import type { IDocumentEntry, TDocumentKind, TDocumentStatus } from "../lib/types";
import type { DataTableColumn } from "@repo/ui/components/ui-customs/data-table";

const STATUS_BADGE_VARIANT: Record<TDocumentStatus, "success" | "info" | "error"> = {
  Verified: "success",
  Pending: "info",
  Expired: "error",
};

const KIND_ICON: Record<TDocumentKind, React.ElementType> = {
  pdf: FileText,
  image: FileImage,
  spreadsheet: FileSpreadsheet,
  other: FileText,
};

interface DocumentRowActionsProps {
  entry: IDocumentEntry;
  onPreview: (entry: IDocumentEntry) => void;
}

function DocumentRowActions({ entry, onPreview }: DocumentRowActionsProps) {
  const stop = (event: React.MouseEvent) => event.stopPropagation();

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Preview document"
        onClick={(e) => {
          stop(e);
          onPreview(entry);
        }}
      >
        <Eye />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label="Download document" onClick={stop}>
        <Download />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Delete document"
        className="hover:text-error"
        onClick={stop}
      >
        <Trash2 />
      </Button>
    </div>
  );
}

export function getDocumentColumns(
  onPreview: (entry: IDocumentEntry) => void,
): DataTableColumn<IDocumentEntry>[] {
  return [
    {
      key: "name",
      header: "Document Name",
      sortable: true,
      sortValue: (row) => row.name,
      cell: (row) => {
        const Icon = KIND_ICON[row.kind];
        return (
          <div className="flex items-center gap-2.5">
            <Icon className="size-4 shrink-0 text-muted-foreground" />
            <span
              className="truncate font-medium text-foreground"
              style={{ maxWidth: 200 }}
              title={row.name}
            >
              {row.name}
            </span>
          </div>
        );
      },
    },
    {
      key: "linkedAsset",
      header: "Linked Asset",
      sortable: true,
      sortValue: (row) => row.linkedAssetId,
      cell: (row) => <span className="font-mono text-xs text-primary">{row.linkedAssetId}</span>,
    },
    {
      key: "type",
      header: "Type",
      cell: (row) => (
        <Badge variant="gray" className="uppercase">
          {row.type}
        </Badge>
      ),
    },
    {
      key: "uploadedBy",
      header: "Uploaded By",
      cell: (row) => <span className="text-sm text-foreground">{row.uploadedBy}</span>,
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      sortValue: (row) => row.date,
      cell: (row) => <span className="text-xs text-muted-foreground">{row.date}</span>,
    },
    {
      key: "size",
      header: "Size",
      sortable: true,
      sortValue: (row) => Number.parseFloat(row.size),
      cell: (row) => <span className="text-xs text-muted-foreground">{row.size}</span>,
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
      align: "center",
      cell: (row) => <DocumentRowActions entry={row} onPreview={onPreview} />,
    },
  ];
}
