import { Card } from "@repo/ui/components/ui/card";

import type { ITokenizationStats } from "../lib/types";

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
          <span className={accented ? "text-xs text-secondary" : "text-xs text-muted-foreground"}>
            {caption}
          </span>
        )}
      </div>
    </Card>
  );
}

export function TokenizationStats({ stats }: { stats: ITokenizationStats }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatTile
        label="Ready for Tokenization"
        value={String(stats.readyForTokenization)}
        caption={stats.readyEstimatedValueLabel}
        accented
      />
      <StatTile
        label="Confirmed Assets"
        value={String(stats.confirmedAssets)}
        caption={stats.queueStockLabel}
      />
      <StatTile
        label="Assets Issued Today"
        value={String(stats.issuedToday).padStart(2, "0")}
        caption={stats.txVolumeLabel}
      />
      <StatTile
        label="Failed Issuance"
        value={String(stats.failedIssuance).padStart(2, "0")}
        caption={stats.failedCaption}
      />
    </div>
  );
}
