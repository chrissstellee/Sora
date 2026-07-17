"use client";

import * as React from "react";

import { DataTable } from "@repo/ui/components/ui-customs/data-table";

import { ASSET_COLUMNS } from "../constants/asset-columns";

import type { IAsset } from "../lib/types";

interface AssetsTableProps {
  assets: IAsset[];
  isLoading: boolean;
  onRowClick: (asset: IAsset) => void;
}

export function AssetsTable({ assets, isLoading, onRowClick }: AssetsTableProps) {
  const [selected, setSelected] = React.useState<Array<string | number>>([]);

  return (
    <DataTable
      columns={ASSET_COLUMNS}
      data={assets}
      rowKey={(row) => row.id}
      // selectable
      selectedRowKeys={selected}
      onSelectedRowKeysChange={setSelected}
      onRowClick={onRowClick}
      isLoading={isLoading}
      pageSizeOptions={[10, 25, 50, 100]}
      defaultPageSize={25}
      itemLabel="assets"
      emptyMessage="No assets match your filters."
      maxHeight="480px"
    />
  );
}
