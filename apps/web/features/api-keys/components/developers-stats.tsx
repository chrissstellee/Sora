import { Card } from "@repo/ui/components/ui/card";

import type { IDevelopersStats } from "../lib/types";

interface StatTileProps {
  label: string;
  value: string;
  caption?: string;
  accented?: boolean;
}

function StatTile({ label, value, caption, accented }: StatTileProps) {
  return (
    <Card variant={accented ? "accented" : "default"} className="gap-2 py-4">
      <div className="flex flex-col gap-1 px-5">
        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          {label}
        </span>
        <span className="font-display text-2xl font-semibold text-foreground">{value}</span>
        {caption && (
          <span className={accented ? "text-xs text-success" : "text-xs text-muted-foreground"}>
            {caption}
          </span>
        )}
      </div>
    </Card>
  );
}

interface DevelopersStatsProps {
  stats: IDevelopersStats;
}

export function DevelopersStats({ stats }: DevelopersStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatTile
        label="Total API Keys"
        value={String(stats.totalApiKeys)}
        caption={stats.totalApiKeysDelta}
      />
      <StatTile
        label="API Requests Today"
        value={stats.apiRequestsToday.toLocaleString()}
        caption={stats.apiRequestsGrowth}
        accented
      />
      <StatTile
        label="Avg Response Time"
        value={stats.avgResponseTime}
        caption={stats.avgResponseCaption}
      />
      <StatTile label="API Status" value={stats.apiStatus} caption={stats.apiStatusCaption} />
    </div>
  );
}
