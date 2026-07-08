"use client";

import { Users } from "lucide-react";

import { DataTable } from "@repo/ui/components/ui-customs/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";

import { getHolderColumns } from "../constants/holder-columns";

import type { IHolderEntry } from "../lib/types";

interface HolderRegistryTableProps {
  holders: IHolderEntry[];
  isLoading: boolean;
  onViewHolder: (holder: IHolderEntry) => void;
}

export function HolderRegistryTable({
  holders,
  isLoading,
  onViewHolder,
}: HolderRegistryTableProps) {
  const columns = getHolderColumns(onViewHolder);

  return (
    <Card className="border-0 bg-transparent py-5">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 font-mono text-sm font-semibold tracking-wide text-secondary uppercase">
          <Users className="size-4" />
          Holder Registry Table
        </CardTitle>
      </CardHeader>

      <CardContent className="min-w-0 px-0">
        <DataTable
          columns={columns}
          data={holders}
          rowKey={(row) => row.id}
          onRowClick={onViewHolder}
          isLoading={isLoading}
          pageSizeOptions={[10, 25, 50, 100]}
          defaultPageSize={25}
          itemLabel="holders"
          emptyMessage="No holders match your filters."
          maxHeight="480px"
          containerClassName="min-w-0"
          className="[&_table]:table-fixed"
        />
      </CardContent>
    </Card>
  );
}
