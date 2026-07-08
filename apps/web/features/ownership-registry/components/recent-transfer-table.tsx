import { ExternalLink, Radar } from "lucide-react";

import { DataTable } from "@repo/ui/components/ui-customs/data-table";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";

import { TRANSFER_FEED_COLUMNS } from "../constants/transfer-columns";

import type { ITransferFeedEntry } from "../lib/types";

export function RecentTransferTable({ transfers }: { transfers: ITransferFeedEntry[] }) {
  return (
    <Card className="min-w-0 gap-4 py-5">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 pt-2 font-mono text-sm font-semibold tracking-wide text-secondary uppercase">
          <Radar className="size-4" />
          Block Explorer: Recent Transfer Feed
        </CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" className="gap-1 text-xs text-primary">
            View All on Stellar Expert
            <ExternalLink className="size-3" />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="min-w-0 px-0">
        <DataTable
          columns={TRANSFER_FEED_COLUMNS}
          data={transfers}
          rowKey={(row) => row.id}
          showPagination={false}
          containerClassName="min-w-0 rounded-none border-0"
          className="[&_table]:table-fixed"
        />
      </CardContent>
    </Card>
  );
}
