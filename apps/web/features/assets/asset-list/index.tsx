"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { ASSET_LIFECYCLE_OPTIONS } from "@repo/backend/domain/asset-record";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent } from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";

import { ErrorState, LoadingState } from "../components/request-state";
import { useRequest } from "../lib/use-request";
import { formatAssetValue, getWorkspaceSummary } from "../lib/workspace-api";
import { useAssets } from "./hooks/use-assets";

export function AssetsPage() {
  const [query, setQuery] = React.useState("");
  const { data, error, isLoading, isLoadingMore, retry, loadMore, debouncedQuery } =
    useAssets(query);
  const summary = useRequest(getWorkspaceSummary, []);
  const items = data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-3xl font-semibold">Assets</h1>
          <p className="mt-1 text-muted-foreground">
            Persisted records in your Organization workspace.
          </p>
        </div>
        <Button asChild>
          <Link href="/assets/create">Create asset</Link>
        </Button>
      </div>

      <div className="relative max-w-2xl">
        <Search
          className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          aria-label="Search assets by name or registration number"
          placeholder="Search by name or registration number"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="pr-10 pl-9"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Clear search"
            className="absolute top-1/2 right-1 size-8 -translate-y-1/2"
            onClick={() => setQuery("")}
          >
            <X />
          </Button>
        )}
      </div>

      {summary.data && (
        <div
          className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8"
          aria-label="Asset lifecycle counts"
        >
          <Count label="Total" value={summary.data.counts.total} />
          {ASSET_LIFECYCLE_OPTIONS.map((lifecycle) => (
            <Count key={lifecycle} label={lifecycle} value={summary.data!.counts[lifecycle]} />
          ))}
        </div>
      )}
      {summary.error && (
        <div className="text-sm text-destructive" role="status">
          Counts unavailable.{" "}
          <button className="underline" onClick={summary.retry}>
            Retry
          </button>
        </div>
      )}

      {isLoading && (
        <LoadingState label={debouncedQuery ? "Searching assets…" : "Loading assets…"} />
      )}
      {error && <ErrorState error={error} onRetry={retry} />}
      {!isLoading && !error && items.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="font-medium">
              {debouncedQuery ? "No matching assets" : "No assets yet"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {debouncedQuery
                ? "Try a different name or registration number."
                : "Create your first persisted asset record."}
            </p>
            {debouncedQuery && (
              <Button variant="outline" className="mt-4" onClick={() => setQuery("")}>
                Clear search
              </Button>
            )}
          </CardContent>
        </Card>
      )}
      {!isLoading && !error && items.length > 0 && (
        <Card className="overflow-hidden py-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="px-5 py-3">Asset</th>
                  <th className="px-5 py-3">Owner</th>
                  <th className="px-5 py-3">Value</th>
                  <th className="px-5 py-3">Lifecycle</th>
                  <th className="px-5 py-3">Updated</th>
                </tr>
              </thead>
              <tbody>
                {items.map((asset) => (
                  <tr key={asset.assetId} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-4">
                      <Link
                        className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2"
                        href={`/assets/${asset.assetId}`}
                      >
                        {asset.name}
                      </Link>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {asset.category} · {asset.registrationNumber}
                      </span>
                    </td>
                    <td className="px-5 py-4">{asset.legalOwner}</td>
                    <td className="px-5 py-4 tabular-nums">{formatAssetValue(asset)}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full border px-2 py-1 text-xs">
                        {asset.lifecycle}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {new Date(asset.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data?.nextCursor && (
            <div className="border-t p-4 text-center">
              <Button variant="outline" onClick={() => void loadMore()} disabled={isLoadingMore}>
                {isLoadingMore ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
