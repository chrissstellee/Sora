import { Card } from "@repo/ui/components/ui/card";
import { cn } from "@repo/ui/lib/utils";

import type { IAssetStats } from "../lib/types";

interface StatTileProps {
  label: string;
  value: string;
  caption?: string;
  accented?: boolean;
  /** Width (0-100) of the small emphasis bar under the value. Omit to hide the bar. */
  barPercent?: number;
}

function StatTile({ label, value, caption, accented, barPercent }: StatTileProps) {
  return (
    <Card variant={accented ? "accented" : "default"} className="gap-2 py-4">
      <div className="flex flex-col gap-1 px-5">
        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          {label}
        </span>
        <span className="font-display text-2xl font-semibold text-foreground">{value}</span>
        {caption && <span className="text-xs text-muted-foreground">{caption}</span>}
        {typeof barPercent === "number" && (
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full", accented ? "bg-secondary" : "bg-secondary/60")}
              style={{ width: `${barPercent}%` }}
            />
          </div>
        )}
      </div>
    </Card>
  );
}

export function AssetsStats({ stats }: { stats: IAssetStats }) {
  const draftPercent = Math.min(100, Math.round((stats.draft / stats.totalAssets) * 100) + 20);
  const readyPercent = Math.min(100, Math.round((stats.ready / stats.totalAssets) * 100) + 12);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <StatTile
        label="Total Assets"
        value={stats.totalAssets.toLocaleString()}
        caption={`${stats.totalAssetsDelta}`}
      />
      <StatTile label="Draft" value={String(stats.draft)} barPercent={draftPercent} />
      <StatTile label="Ready" value={String(stats.ready)} barPercent={readyPercent} />
      <StatTile
        label="Tokenized"
        value={stats.tokenized.toLocaleString()}
        accented
        barPercent={100}
      />
      <StatTile label="Archived" value={String(stats.archived)} />
      <StatTile label="Total Value" value={stats.totalValueLabel} caption="Global RWA Cluster" />
    </div>
  );
}
