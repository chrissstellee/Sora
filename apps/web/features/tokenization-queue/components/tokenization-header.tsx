import Link from "next/link";

import { PageHeader } from "@repo/ui/components/ui-customs/page-header";
import { Button } from "@repo/ui/components/ui/button";

export function TokenizationHeader() {
  return (
    <PageHeader
      breadcrumbs={[{ label: <Link href="/assets">Assets</Link> }, { label: "Asset Issuance" }]}
      title="Assets Issuance"
      description="Configure and issue digital representations of approved assets on the Stellar network."
      actions={
        <Button variant="gradient" asChild>
          <Link href="/assets/create">Create asset</Link>
        </Button>
      }
    />
  );
}
