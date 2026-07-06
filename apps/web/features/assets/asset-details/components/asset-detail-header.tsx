import Link from "next/link";

import { PageHeader } from "@repo/ui/components/ui-customs/page-header";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";

import { STATUS_BADGE_VARIANT } from "../constants/asset-details";

import type { IAsset } from "../../asset-list/lib/types";

interface AssetDetailHeaderProps {
  asset: IAsset;
}

export function AssetDetailHeader({ asset }: AssetDetailHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[{ label: <Link href="/assets">Assets</Link> }, { label: "Asset Details" }]}
        title={asset.name}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Edit Asset
            </Button>
            <Button variant="outline" size="sm">
              Configure Token
            </Button>
            <Button variant="outline" size="sm" disabled className="disabled:text-muted-foreground">
              Issue on Stellar
            </Button>
          </div>
        }
      />

      {/* Meta row — Asset ID / Category / Value / Status */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>
          Asset ID:{" "}
          <span className="font-mono text-sm font-medium text-foreground">{asset.assetId}</span>
        </span>
        <span className="text-soft-primary">•</span>
        <span>{asset.type}</span>
        <span className="text-soft-primary">•</span>
        <span className="font-semibold text-secondary">${asset.estValue}M USD</span>
        <span className="text-soft-primary">•</span>
        <Badge variant={STATUS_BADGE_VARIANT[asset.status]} className="uppercase">
          {asset.status}
        </Badge>
      </div>
    </div>
  );
}
