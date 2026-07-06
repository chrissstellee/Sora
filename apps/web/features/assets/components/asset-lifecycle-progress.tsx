import { cn } from "@repo/ui/lib/utils";

import { LIFECYCLE_STEPS } from "../asset-list/constants/asset-list";

import type { IAssetLifecycle } from "../asset-list/lib/types";

interface AssetLifecycleProgressProps {
  lifecycle: IAssetLifecycle;
}

export function AssetLifecycleProgress({ lifecycle }: AssetLifecycleProgressProps) {
  const currentIndex = LIFECYCLE_STEPS.findIndex((step) => step.key === lifecycle.currentStep);

  return (
    <ol className="flex flex-col gap-4">
      {LIFECYCLE_STEPS.map((step, index) => {
        const completedDate = lifecycle.completedAt[step.key];
        const isCompleted =
          index < currentIndex || (index === currentIndex && Boolean(completedDate));
        const isCurrent = index === currentIndex;
        const isUpcoming = index > currentIndex;

        return (
          <li key={step.key} className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 size-2 shrink-0 rounded-full",
                isCompleted && "bg-secondary",
                isCurrent && !isCompleted && "bg-primary",
                isUpcoming && "bg-muted-foreground/30",
              )}
            />
            <div className="flex flex-col">
              <span
                className={cn(
                  "text-sm font-medium",
                  isUpcoming ? "text-muted-foreground/60" : "text-foreground",
                )}
              >
                {step.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {completedDate ?? (isUpcoming ? "Pending" : "In progress")}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
