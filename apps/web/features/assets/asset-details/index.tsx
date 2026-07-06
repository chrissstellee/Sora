import { AssetDetailHeader } from "./components/asset-detail-header";
import { AssetDetailsTabs } from "./components/asset-details-tabs";

import type { IAsset } from "../asset-list/lib/types";

interface AssetDetailsPageProps {
  asset: IAsset;
}

export function AssetDetailsPage({ asset }: AssetDetailsPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <AssetDetailHeader asset={asset} />
      <AssetDetailsTabs asset={asset} />
    </div>
  );
}
