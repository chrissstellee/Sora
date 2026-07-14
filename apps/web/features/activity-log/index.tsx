"use client";

import { ActivityList } from "@/features/assets/asset-details";
import { ErrorState, LoadingState } from "@/features/assets/components/request-state";
import { useRequest } from "@/features/assets/lib/use-request";
import { getActivity } from "@/features/assets/lib/workspace-api";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";

import { ActivityLogHeader } from "./components/activity-header";

export function ActivityLogPage() {
  const request = useRequest((signal) => getActivity(signal, undefined, 50), []);
  return (
    <div className="flex flex-col gap-6">
      <ActivityLogHeader />
      <Card>
        <CardHeader>
          <CardTitle>Organization events</CardTitle>
        </CardHeader>
        <CardContent>
          {request.isLoading && <LoadingState label="Loading activity…" />}
          {request.error && <ErrorState error={request.error} onRetry={request.retry} />}
          {request.data?.items.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No workspace activity has been recorded.
            </p>
          )}
          <ActivityList items={request.data?.items ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
