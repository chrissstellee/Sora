import { Card } from "@repo/ui/components/ui/card";
import { cn } from "@repo/ui/lib/utils";

import type { IOwnershipStats } from "../lib/types";

type TStatAccent = "default" | "success" | "warning";

const ACCENT_BORDER_CLASS: Record<TStatAccent, string> = {
  default: "",
  success: "border-success",
  warning: "border-error",
};

const ACCENT_CAPTION_CLASS: Record<TStatAccent, string> = {
  default: "text-muted-foreground",
  success: "text-success",
  warning: "text-error",
};

interface StatTileProps {
  label: string;
  value: string;
  caption?: string;
  accent?: TStatAccent;
}

function StatTile({ label, value, caption, accent = "default" }: StatTileProps) {
  return (
    <Card className={cn("gap-2 py-4", ACCENT_BORDER_CLASS[accent])}>
      <div className="flex flex-col gap-1 px-5">
        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          {label}
        </span>
        <span className="font-display text-2xl font-semibold text-foreground">{value}</span>
        {caption && <span className={cn("text-xs", ACCENT_CAPTION_CLASS[accent])}>{caption}</span>}
      </div>
    </Card>
  );
}

export function OwnershipStats({ stats }: { stats: IOwnershipStats }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatTile
        label="Total Tokenized RWA Value"
        value={stats.totalTokenizedValueLabel}
        caption={stats.totalTokenizedValueDelta}
      />
      <StatTile
        label="Total Active Token Holders"
        value={stats.totalActiveHolders.toLocaleString()}
        caption={stats.totalActiveHoldersCaption}
        accent="success"
      />
      <StatTile
        label="24H Ownership Transfers"
        value={stats.transfers24h.toLocaleString()}
        caption={stats.transfers24hCaption}
      />
      <StatTile
        label="Asset Concentration Alert"
        value={stats.concentrationAssetLabel}
        caption={stats.concentrationCaption}
        accent="warning"
      />
    </div>
  );
}
