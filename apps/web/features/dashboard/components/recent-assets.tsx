import Link from "next/link";

import { DataTable } from "@repo/ui/components/ui-customs/data-table";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";

import { RECENT_ASSET_COLUMNS } from "../constants/recent-asset-columns";

import type { IDashboardRecentAsset } from "../lib/types";

export function RecentAssets({ assets }: { assets: IDashboardRecentAsset[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-mono text-sm font-semibold tracking-wider text-soft-primary uppercase">
            Recent Assets
          </CardTitle>
          <Button variant="ghost" size="sm" className="gap-1 text-xs text-primary" asChild>
            <Link href="/assets">View All</Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="overflow-x-auto px-0">
        <DataTable
          columns={RECENT_ASSET_COLUMNS}
          data={assets}
          rowKey={(row) => row.id}
          isLoading={false}
          pageSizeOptions={[5, 10, 25]}
          defaultPageSize={5}
          itemLabel="assets"
          emptyMessage="No recent assets found."
          maxHeight="360px"
          containerClassName="min-w-0 rounded-none border-0"
        />
      </CardContent>
    </Card>
  );
}
