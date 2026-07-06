import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/ui/sheet";

import { IAssetLifecycleProgress } from "./asset-lifecycle-progress";

import type { IAsset } from "../lib/types";

interface AssetDetailsSheetProps {
  asset: IAsset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function OverviewField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
      <span className="block text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">{value || "---"}</span>
    </div>
  );
}

export function AssetDetailsSheet({ asset, open, onOpenChange }: AssetDetailsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 overflow-y-auto p-0">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Asset Details</SheetTitle>
          <SheetDescription>{asset?.assetId ?? "SRA-XXX-000"}</SheetDescription>
        </SheetHeader>

        {asset && (
          <div className="flex flex-1 flex-col gap-6 p-4">
            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Asset Overview
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <OverviewField label="Type" value={asset.type} />
                <OverviewField label="Value" value={`$${asset.estValue}M`} />
              </div>
              <OverviewField label="Owner" value={asset.owner} />
            </section>

            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Lifecycle Progress
                </h3>
                <Badge variant="secondary" className="uppercase">
                  {asset.lifecycle.currentStep === "active"
                    ? "Issued"
                    : asset.lifecycle.currentStep}
                </Badge>
              </div>
              <IAssetLifecycleProgress lifecycle={asset.lifecycle} />
            </section>

            <section className="rounded-md border border-border bg-muted/30 p-3">
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-secondary uppercase">
                Blockchain Info
              </h3>
              <dl className="flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Asset Code</dt>
                  <dd className="font-mono text-foreground">{asset.blockchainInfo.assetCode}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Network</dt>
                  <dd className="text-foreground">{asset.blockchainInfo.network}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Issuer ID</dt>
                  <dd className="font-mono text-foreground">{asset.blockchainInfo.issuerId}</dd>
                </div>
              </dl>
            </section>
          </div>
        )}

        <SheetFooter className="flex-row border-t border-border">
          <Button variant="outlineSecondary" className="flex-1">
            Manage Docs
          </Button>
          <Button variant="gradient" className="flex-1">
            Edit Details
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
