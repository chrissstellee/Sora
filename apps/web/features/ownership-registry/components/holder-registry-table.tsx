import { ExternalLink, Users } from "lucide-react";

import { stellarExpertUrl } from "@repo/backend/stellar/explorer";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";

import type { OwnershipHolder } from "../lib/ownership-api";

interface HolderRegistryTableProps {
  holders: OwnershipHolder[];
  isLoading: boolean;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  query: string;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

export function HolderRegistryTable({
  holders,
  isLoading,
  hasPreviousPage,
  hasNextPage,
  query,
  onPreviousPage,
  onNextPage,
}: HolderRegistryTableProps) {
  return (
    <Card className="min-w-0 gap-4 py-5">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 font-mono text-sm font-semibold tracking-wide text-secondary uppercase">
          <Users className="size-4" aria-hidden="true" /> Account-held balances
        </CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 space-y-4 px-0">
        <div className="overflow-x-auto border-y">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-muted/50 text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="px-5 py-3">Testnet public account</th>
                <th className="px-5 py-3">Exact balance</th>
                <th className="px-5 py-3">Share of known account-held Testnet supply</th>
                <th className="px-5 py-3">Observed ledger</th>
                <th className="px-5 py-3">Independent proof</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {holders.map((holder) => {
                const accountUrl = stellarExpertUrl({ resource: "account", id: holder.account });
                const ledgerUrl = stellarExpertUrl({ resource: "ledger", id: holder.ledger });
                return (
                  <tr key={holder.account}>
                    <td className="px-5 py-4 font-mono text-xs break-all">{holder.account}</td>
                    <td className="px-5 py-4 font-mono font-semibold">{holder.balance}</td>
                    <td className="px-5 py-4 font-mono">{holder.share}%</td>
                    <td className="px-5 py-4">
                      {ledgerUrl ? (
                        <a
                          href={ledgerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {holder.ledger.toLocaleString()}
                        </a>
                      ) : (
                        <span>{holder.ledger.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {accountUrl ? (
                        <a
                          href={accountUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          View account <ExternalLink className="size-3" aria-hidden="true" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">Proof unavailable</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!isLoading && holders.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              {query
                ? "No accounts match this search."
                : "This complete snapshot has no non-zero account holders."}
            </p>
          )}
          {isLoading && (
            <p className="px-5 py-10 text-center text-sm" role="status">
              Loading holder page…
            </p>
          )}
        </div>
        <div className="flex items-center justify-between px-5">
          <Button
            variant="outline"
            onClick={onPreviousPage}
            disabled={!hasPreviousPage || isLoading}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">Server-paginated account results</span>
          <Button variant="outline" onClick={onNextPage} disabled={!hasNextPage || isLoading}>
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
