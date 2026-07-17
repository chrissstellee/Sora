"use client";

import { DataTable } from "@repo/ui/components/ui-customs/data-table";

import { getTokenizationColumns } from "../constants/tokenization-columns";

import type { IIssuanceQueueEntry } from "../lib/types";

interface TokenizationQueueTableProps {
  entries: IIssuanceQueueEntry[];
  isLoading: boolean;
  onConfigure: (entry: IIssuanceQueueEntry) => void;
  onExport?: () => void;
}

export function TokenizationQueueTable({
  entries,
  isLoading,
  onConfigure,
  // onExport,
}: TokenizationQueueTableProps) {
  const columns = getTokenizationColumns(onConfigure);

  return (
    <DataTable
      columns={columns}
      data={entries}
      rowKey={(row) => row.id}
      isLoading={isLoading}
      pageSizeOptions={[10, 25, 50, 100]}
      defaultPageSize={25}
      itemLabel="queued entries"
      emptyMessage="No entries match your filters."
      maxHeight="480px"
    />
  );
}
