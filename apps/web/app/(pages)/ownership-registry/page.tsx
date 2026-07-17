import { OwnershipRegistryPage } from "@/features/ownership-registry";

export default async function OwnershipRegistry({
  searchParams,
}: {
  searchParams: Promise<{ assetId?: string | string[] }>;
}) {
  const rawAssetId = (await searchParams).assetId;
  return (
    <OwnershipRegistryPage
      initialAssetId={typeof rawAssetId === "string" ? rawAssetId : undefined}
    />
  );
}
