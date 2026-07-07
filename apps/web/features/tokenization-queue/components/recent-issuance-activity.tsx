import { AlertCircle, CheckCircle2, Info } from "lucide-react";

import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { cn } from "@repo/ui/lib/utils";

import type { IRecentActivityEntry, TActivityType } from "../lib/types";

const ACTIVITY_ICON: Record<TActivityType, React.ElementType> = {
  success: CheckCircle2,
  info: Info,
  error: AlertCircle,
};

const ACTIVITY_ICON_CLASS: Record<TActivityType, string> = {
  success: "bg-success/10 text-success",
  info: "bg-info/10 text-info",
  error: "bg-error/10 text-error",
};

export function RecentIssuanceActivity({ activity }: { activity: IRecentActivityEntry[] }) {
  return (
    <Card className="max-h-[370px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-mono text-sm font-semibold tracking-wider text-soft-primary uppercase">
            Recent Issuance Activity
          </CardTitle>
          <Button variant="ghost" size="sm" className="gap-1 text-xs text-primary">
            View Logs
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 overflow-y-auto pr-1">
        {activity.map((entry) => {
          const Icon = ACTIVITY_ICON[entry.type];
          return (
            <div key={entry.id} className="flex items-start gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  ACTIVITY_ICON_CLASS[entry.type],
                )}
              >
                <Icon className="size-5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm text-foreground">{entry.message}</span>
                <span className="text-xs text-muted-foreground">{entry.meta}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
