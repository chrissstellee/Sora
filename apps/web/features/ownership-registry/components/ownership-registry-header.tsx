import Link from "next/link";

import { PageHeader } from "@repo/ui/components/ui-customs/page-header";

export function OwnershipRegistryHeader() {
  return (
    <PageHeader
      breadcrumbs={[{ label: <Link href="/assets">Assets</Link> }, { label: "Ownership Proof" }]}
      title="Testnet Ownership Proof"
      description="Verify current account-held token balances from Sora's latest complete Stellar Testnet snapshot."
    />
  );
}
