import { Card } from "@repo/ui/components/ui/card";

import type { IDocumentsStats } from "../lib/types";

interface StatTileProps {
  label: string;
  value: string;
  caption?: string;
  accented?: boolean;
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
              className="h-full rounded-full bg-secondary"
              style={{ width: `${Math.min(100, barPercent)}%` }}
            />
          </div>
        )}
      </div>
    </Card>
  );
}

export function DocumentsStats({ stats }: { stats: IDocumentsStats }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatTile
        label="Storage Used"
        value={stats.storageUsedLabel}
        barPercent={stats.storageUsedPercent}
        accented
      />
      <StatTile
        label="Total Documents"
        value={stats.totalDocuments.toLocaleString()}
        caption={stats.totalDocumentsDelta}
      />
      <StatTile label="Recent Uploads" value={String(stats.recentUploads).padStart(2, "0")} />
      <StatTile
        label="Missing Documents"
        value={String(stats.missingDocuments)}
        caption={stats.missingDocumentsCaption}
      />
    </div>
  );
}
