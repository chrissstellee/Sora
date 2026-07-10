"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { cn } from "@repo/ui/lib/utils";

import { API_METHOD_CLASS } from "../constants/dashboard";

import type { IApiPerformanceBar, IRecentApiCall } from "../lib/types";

function ApiBar({ bar, maxValue }: { bar: IApiPerformanceBar; maxValue: number }) {
  const heightPercent = Math.round((bar.value / maxValue) * 100);
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex h-16 w-full items-end overflow-hidden rounded-sm">
        <div
          className="w-full rounded-t-sm bg-primary/50 transition-all duration-300 hover:bg-primary"
          style={{ height: `${heightPercent}%` }}
        />
      </div>
    </div>
  );
}

export function ApiPerformancePanel({
  bars,
  recentApiCalls,
  avgLatency,
}: {
  bars: IApiPerformanceBar[];
  recentApiCalls: IRecentApiCall[];
  avgLatency: string;
}) {
  const maxValue = Math.max(...bars.map((b) => b.value));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Bar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-sm font-semibold tracking-wider text-soft-primary uppercase">
            API Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-7 gap-1">
            {bars.map((bar) => (
              <ApiBar key={bar.label} bar={bar} maxValue={maxValue} />
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Last 7 Days</span>
            <span className="font-mono font-medium text-foreground">{avgLatency} Avg Latency</span>
          </div>
        </CardContent>
      </Card>

      {/* Recent API calls */}
      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-sm font-semibold tracking-wider text-soft-primary uppercase">
            Recent API Calls
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {recentApiCalls.map((call) => (
            <div key={call.id} className="flex items-center gap-3">
              <span
                className={cn(
                  "w-10 shrink-0 text-center text-xs font-bold uppercase",
                  API_METHOD_CLASS[call.method],
                )}
              >
                {call.method}
              </span>
              <span className="flex-1 truncate font-mono text-xs text-foreground">
                {call.endpoint}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">{call.timeAgo}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
