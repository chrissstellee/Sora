"use client";

import Link from "next/link";

import { ActivityList } from "@/features/assets/asset-details";
import { ErrorState, LoadingState } from "@/features/assets/components/request-state";
import { useRequest } from "@/features/assets/lib/use-request";
import { formatAssetValue, getActivity } from "@/features/assets/lib/workspace-api";
import { ASSET_LIFECYCLE_OPTIONS } from "@repo/backend/domain/asset-record";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";

import { useDashboard } from "./hooks/use-dashboard";

export function DashboardPage() {
  const { data, error, isLoading, retry } = useDashboard();
  const activity = useRequest((signal) => getActivity(signal, { limit: 10 }), []);
  if (isLoading) return <LoadingState label="Loading workspace dashboard…" />;
  if (error) return <ErrorState error={error} onRetry={retry} />;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-3xl font-semibold">Workspace dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Current persisted asset lifecycle and activity.
          </p>
        </div>
        <Button asChild>
          <Link href="/assets/create">Create asset</Link>
        </Button>
      </div>
      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8"
        aria-label="Lifecycle summary"
      >
        <Metric label="Total" value={data.counts.total} />
        {ASSET_LIFECYCLE_OPTIONS.map((status) => (
          <Metric key={status} label={status} value={data.counts[status]} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent assets</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/assets">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {!data.recentAssets.length && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No assets have been created yet.
              </p>
            )}
            <ol className="divide-y">
              {data.recentAssets.map((asset) => (
                <li key={asset.assetId} className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <Link
                      href={`/assets/${asset.assetId}`}
                      className="truncate font-medium text-primary hover:underline"
                    >
                      {asset.name}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {asset.category} · {asset.lifecycle}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm tabular-nums">{formatAssetValue(asset)}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent activity</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/activity-log">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {activity.isLoading && <LoadingState label="Loading activity…" />}
            {activity.error && (
              <div className="rounded-md border border-destructive/30 p-4 text-sm" role="status">
                Activity is temporarily unavailable. Asset summary remains current.{" "}
                <button className="ml-1 underline" onClick={activity.retry}>
                  Retry
                </button>
              </div>
            )}
            {activity.data?.items.length ? (
              <ActivityList items={activity.data.items} />
            ) : !activity.isLoading && !activity.error ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No recent workspace activity.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
