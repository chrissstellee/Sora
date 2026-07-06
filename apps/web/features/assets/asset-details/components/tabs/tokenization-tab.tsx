import { Coins } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";

import type { IAsset } from "../../../asset-list/lib/types";

interface TokenizationTabProps {
  asset: IAsset;
}

export function TokenizationTab({ asset }: TokenizationTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Tokenization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-full border border-border bg-muted/40 text-muted-foreground">
              <Coins className="size-6" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Tokenization</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Token configuration and issuance settings for{" "}
                <span className="font-medium text-foreground">{asset.name}</span> will be available
                here.
              </p>
              <p className="mt-3 text-xs text-muted-foreground/60">Coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
