"use client";

import { DataTable } from "@repo/ui/components/ui-customs/data-table";

import { getDocumentColumns } from "../constants/document-columns";

import type { IDocumentEntry } from "../lib/types";

interface DocumentsTableProps {
  documents: IDocumentEntry[];
  isLoading: boolean;
  onPreview: (document: IDocumentEntry) => void;
  onExport?: () => void;
}

export function DocumentsTable({
  documents,
  isLoading,
  onPreview,
  // onExport,
}: DocumentsTableProps) {
  const columns = getDocumentColumns(onPreview);

  return (
    <DataTable
      columns={columns}
      data={documents}
      rowKey={(row) => row.id}
      onRowClick={onPreview}
      isLoading={isLoading}
      pageSizeOptions={[10, 25, 50, 100]}
      defaultPageSize={25}
      itemLabel="documents"
      emptyMessage="No documents match your filters."
      maxHeight="480px"
      containerClassName="min-w-0"
      className="[&_table]:table-fixed"
    />
  );
}
