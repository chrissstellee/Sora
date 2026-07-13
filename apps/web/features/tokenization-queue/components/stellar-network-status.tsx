import { Database, DollarSign, RefreshCcw } from "lucide-react";

import { Badge } from "@repo/ui/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";

import type { IStellarNetworkStatus } from "../lib/types";
import type { ElementType } from "react";

const HEALTH_BADGE_VARIANT: Record<
  IStellarNetworkStatus["testnetHealth"],
  "success" | "warning" | "error"
> = {
  OPTIMAL: "success",
  DEGRADED: "warning",
  DOWN: "error",
};

function StatusRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted px-3 py-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-border/40 text-foreground">
        <Icon className="size-5" />
      </div>
      <div className="flex-1">
        <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </div>
      </div>
      <div className="text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

export function StellarNetworkStatus({ networkStatus }: { networkStatus: IStellarNetworkStatus }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-mono text-sm font-semibold tracking-wider text-soft-primary uppercase">
          Stellar Network Status
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <StatusRow
          icon={Database}
          label="Testnet Health"
          value={
            <Badge
              variant={HEALTH_BADGE_VARIANT[networkStatus.testnetHealth]}
              className="uppercase"
            >
              {networkStatus.testnetHealth}
            </Badge>
          }
        />

        <StatusRow icon={DollarSign} label="Base Fee" value={networkStatus.baseFee} />

        <div className="rounded-xl border border-border/60 bg-muted px-3 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-border/40 text-foreground">
              <RefreshCcw className="size-5" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Sync Progress
              </div>
            </div>
            <div className="text-sm font-semibold text-foreground">
              {networkStatus.syncProgress.toFixed(1)}%
            </div>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
            <div
              className="h-full rounded-full bg-linear-120 from-primary to-secondary transition-all duration-300"
              style={{ width: `${Math.min(100, networkStatus.syncProgress)}%` }}
            />
          </div>
        </div>

        <span className="text-xs text-muted-foreground">
          Network Load: {networkStatus.networkLoadPercent.toFixed(1)}%
        </span>
      </CardContent>
    </Card>
  );
}
