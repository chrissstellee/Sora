import Link from "next/link";

import { PageHeader } from "@repo/ui/components/ui-customs/page-header";
import { Button } from "@repo/ui/components/ui/button";

interface TokenizationHeaderProps {
  onOpenNewAsset: () => void;
}

export function TokenizationHeader({ onOpenNewAsset }: TokenizationHeaderProps) {
  return (
    <PageHeader
      breadcrumbs={[{ label: <Link href="/assets">Assets</Link> }, { label: "Asset Issuance" }]}
      title="Assets Issuance"
      description="Configure and issue digital representations of approved assets on the Stellar network."
      actions={
        <Button variant="gradient" onClick={onOpenNewAsset}>
          Configure Digital Asset
        </Button>
      }
    />
  );
}
