import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { publicStellarConfig } from "@/core/config/env";
import { DataTable } from "@repo/ui/components/ui-customs/data-table";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";

import { TRANSACTION_COLUMNS } from "../constants/transaction-columns";

import type { IStellarTransaction } from "../lib/types";

export function LatestTransactions({ transactions }: { transactions: IStellarTransaction[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-mono text-sm font-semibold tracking-wider text-soft-primary uppercase">
            Latest Stellar Transactions
          </CardTitle>
          <Button variant="ghost" size="sm" className="gap-1 text-xs text-primary" asChild>
            <Link href={publicStellarConfig.explorerUrl} target="_blank" rel="noreferrer">
              Explore Explorer
              <ExternalLink className="size-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="overflow-x-auto px-0">
        <DataTable
          columns={TRANSACTION_COLUMNS}
          data={transactions}
          rowKey={(row) => row.txHash}
          isLoading={false}
          pageSizeOptions={[5, 10, 25]}
          defaultPageSize={5}
          itemLabel="transactions"
          emptyMessage="No recent transactions available."
          maxHeight="360px"
          containerClassName="min-w-0 rounded-none border-0"
        />
      </CardContent>
    </Card>
  );
}
