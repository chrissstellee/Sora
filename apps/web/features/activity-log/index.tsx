"use client";

import { Filter } from "lucide-react";
import * as React from "react";

import { ActivityList } from "@/features/assets/asset-details";
import { ErrorState, LoadingState } from "@/features/assets/components/request-state";
import { useRequest } from "@/features/assets/lib/use-request";
import { getActivity, listAssets } from "@/features/assets/lib/workspace-api";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";

import { ActivityLogHeader } from "./components/activity-header";

export function ActivityLogPage() {
  const [runInput, setRunInput] = React.useState("");
  const [assetInput, setAssetInput] = React.useState("");
  const [filters, setFilters] = React.useState({ runId: "", assetId: "" });
  const [cursor, setCursor] = React.useState<string>();
  const [cursorHistory, setCursorHistory] = React.useState<Array<string | undefined>>([]);
  const assets = useRequest((signal) => listAssets(signal, "", undefined, 100), []);
  const request = useRequest(
    (signal) =>
      getActivity(signal, {
        runId: filters.runId || undefined,
        assetId: filters.assetId || undefined,
        cursor,
        limit: 50,
      }),
    [cursor, filters.assetId, filters.runId],
  );

  const applyFilters = () => {
    setCursor(undefined);
    setCursorHistory([]);
    setFilters({ runId: runInput.trim(), assetId: assetInput });
  };

  const nextPage = () => {
    if (!request.data?.nextCursor) return;
    setCursorHistory((history) => [...history, cursor]);
    setCursor(request.data.nextCursor);
  };

  const previousPage = () => {
    setCursor(cursorHistory.at(-1));
    setCursorHistory((history) => history.slice(0, -1));
  };

  return (
    <div className="flex flex-col gap-6">
      <ActivityLogHeader />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="size-4" aria-hidden="true" /> Timeline filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              applyFilters();
            }}
          >
            <label htmlFor="activity-run-id" className="flex flex-col gap-1.5 text-sm font-medium">
              Formal run ID
              <Input
                id="activity-run-id"
                value={runInput}
                onChange={(event) => setRunInput(event.target.value)}
                placeholder="Filter by run ID"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Asset
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={assetInput}
                onChange={(event) => setAssetInput(event.target.value)}
              >
                <option value="">All authorized assets</option>
                {(assets.data?.items ?? []).map((asset) => (
                  <option key={asset.assetId} value={asset.assetId}>
                    {asset.name}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit">Apply filters</Button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground" aria-live="polite">
            {filters.runId || filters.assetId
              ? `Showing filtered Organization activity${filters.runId ? ` for run ${filters.runId}` : ""}.`
              : "Showing all Organization activity."}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Organization events</CardTitle>
        </CardHeader>
        <CardContent>
          {request.isLoading && <LoadingState label="Loading activity…" />}
          {request.error && <ErrorState error={request.error} onRetry={request.retry} />}
          {!request.isLoading && !request.error && request.data?.items.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No activity matches these filters.
            </p>
          )}
          {!request.error && <ActivityList items={request.data?.items ?? []} />}
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <Button
              variant="outline"
              onClick={previousPage}
              disabled={cursorHistory.length === 0 || request.isLoading}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">Newest events first</span>
            <Button
              variant="outline"
              onClick={nextPage}
              disabled={!request.data?.nextCursor || request.isLoading}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
