import { ArrowUpRight, Activity, Coins, Box } from "lucide-react";

import { Card } from "@repo/ui/components/ui/card";
import { cn } from "@repo/ui/lib/utils";

import type { IDashboardStats } from "../lib/types";

interface StatTileProps {
  label: string;
  value: string | number;
  caption?: string;
  accented?: boolean;
  barPercent?: number;
  icon?: React.ReactNode;
  captionVariant?: "default" | "positive";
}

function StatTile({
  label,
  value,
  caption,
  accented,
  barPercent,
  icon,
  captionVariant = "default",
}: StatTileProps) {
  return (
    <Card variant={accented ? "accented" : "default"} className="gap-2 py-4">
      <div className="flex flex-col gap-1 px-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            {label}
          </span>
          {icon && <span className="text-muted-foreground">{icon}</span>}
        </div>
        <span className="font-display text-2xl font-semibold text-foreground">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        {caption && (
          <span
            className={cn(
              "text-xs",
              captionVariant === "positive"
                ? "text-success"
                : accented
                  ? "text-secondary"
                  : "text-muted-foreground",
            )}
          >
            {caption}
          </span>
        )}
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

/** The large "Total Asset Value" hero tile */
function TotalValueTile({ stats }: { stats: IDashboardStats }) {
  return (
    <Card className="h-full gap-1 border-secondary/50 bg-card py-4">
      <div className="flex flex-col gap-1 px-5">
        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          Total Asset Value
        </span>
        <span className="font-display text-3xl font-bold text-foreground">
          {stats.totalAssetValue}
        </span>
        <span className="text-xs text-muted-foreground">{stats.totalAssetValueCaption}</span>
      </div>
    </Card>
  );
}

export function DashboardStats({ stats }: { stats: IDashboardStats }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {/* Total Assets */}
      <StatTile
        label="Total Assets"
        value={stats.totalAssets.toLocaleString()}
        caption={stats.totalAssetsDelta}
        captionVariant="positive"
        icon={<Box className="size-3.5" />}
      />

      {/* Tokenized */}
      <StatTile
        label="Tokenized"
        value={stats.tokenized.toLocaleString()}
        caption={stats.tokenizedPercent}
        barPercent={73}
        icon={<Coins className="size-3.5" />}
      />

      {/* Total Asset Value – spans 2 cols on large */}
      <div className="col-span-2 sm:col-span-1 lg:col-span-2">
        <TotalValueTile stats={stats} />
      </div>

      {/* Queue Ready */}
      <StatTile
        label="Queue"
        value={stats.queueReady}
        caption="Ready"
        icon={<Activity className="size-3.5" />}
      />

      {/* API Requests */}
      <StatTile
        label="API Reqs"
        value={stats.apiReqs}
        caption={stats.apiHealth}
        icon={<ArrowUpRight className="size-3.5" />}
      />
    </div>
  );
}
