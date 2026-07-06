import { notFound } from "next/navigation";

import { AssetDetailsPage } from "@/features/assets";
import { MOCK_ASSETS } from "@/features/assets/asset-list/lib/mock-assets";

import type { Metadata } from "next";

interface AssetPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AssetPageProps): Promise<Metadata> {
  const { id } = await params;
  const asset = MOCK_ASSETS.find((a) => a.assetId === id);
  return {
    title: asset ? `${asset.name} | Asset Details` : "Asset Details",
  };
}

export default async function AssetPage({ params }: AssetPageProps) {
  const { id } = await params;
  const asset = MOCK_ASSETS.find((a) => a.assetId === id);

  if (!asset) {
    notFound();
  }

  return <AssetDetailsPage asset={asset} />;
}
