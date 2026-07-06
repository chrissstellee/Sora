import { CheckCircle2, Info, MapPin } from "lucide-react";

import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Progress } from "@repo/ui/components/ui/progress";

import type { ICreateAssetFormState, TDraftStatus } from "../lib/types";

interface CreateAssetSummarySidebarProps {
  form: ICreateAssetFormState;
  completionPercent: number;
  isLastStep: boolean;
  status?: TDraftStatus;
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2">
      <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-secondary">{value}</p>
    </div>
  );
}

export function CreateAssetSummarySidebar({
  form,
  completionPercent,
  isLastStep,
  status = "Draft",
}: CreateAssetSummarySidebarProps) {
  const { assetCategory, assetName } = form.basicInformation;

  return (
    <div className="flex w-full flex-col gap-4 rounded-xl border border-border bg-card p-4 lg:w-[280px]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          Asset Status
        </span>
        <Badge variant="default" className="uppercase">
          {status}
        </Badge>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium tracking-wider text-muted-foreground uppercase">
            Completion Progress
          </span>
          <span className="font-semibold text-secondary">{completionPercent}%</span>
        </div>
        <Progress value={completionPercent} className="mt-2 h-1.5" />
      </div>

      {isLastStep && (
        <div className="flex items-start gap-2 rounded-md border border-secondary/30 bg-secondary/10 p-3 text-xs text-muted-foreground">
          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-secondary" />
          <span>
            Ready for Review — all required documentation and ownership details are included.
          </span>
        </div>
      )}

      {(assetCategory || assetName) && (
        <div>
          <p className="mb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Summary Preview
          </p>
          <div className="flex flex-col gap-2">
            {assetCategory && <SummaryTile label="Asset Category" value={assetCategory} />}
            {assetName && <SummaryTile label="Asset Name" value={assetName} />}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
          Location Data
        </p>
        <div className="flex h-24 flex-col items-center justify-center gap-1 rounded-md border border-border bg-background text-muted-foreground">
          <MapPin className="size-4" />
          <span className="text-[10px]">LAT: 40.7128 N / LON: 74.0060 W</span>
        </div>
      </div>

      {isLastStep ? (
        <Button variant="outline" className="w-full">
          Add Metadata Link
        </Button>
      ) : (
        <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/10 p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <span>
            Your progress is being saved locally. You can resume this session at any time from your
            Asset Dashboard.
          </span>
        </div>
      )}
    </div>
  );
}
