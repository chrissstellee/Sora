import { Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";

import type { IAsset } from "../../../asset-list/lib/types";

interface OwnershipTabProps {
  asset: IAsset;
}

export function OwnershipTab({ asset }: OwnershipTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Ownership
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-full border border-border bg-muted/40 text-muted-foreground">
              <Users className="size-6" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Ownership Registry</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Detailed ownership records, cap table, and transfer history for{" "}
                <span className="font-medium text-foreground">{asset.name}</span> will be displayed
                here after issuance.
              </p>
              <p className="mt-3 text-xs text-muted-foreground/60">Coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
