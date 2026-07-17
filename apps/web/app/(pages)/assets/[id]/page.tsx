import { AssetDetailsPage } from "@/features/assets";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Asset Details" };

export default async function AssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AssetDetailsPage assetId={id} />;
}
