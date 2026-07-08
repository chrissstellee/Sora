import { Table2 } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@repo/ui/components/ui-customs/page-header";
import { Button } from "@repo/ui/components/ui/button";

interface OwnershipRegistryHeaderProps {
  onExportClick?: () => void;
}

export function OwnershipRegistryHeader({ onExportClick }: OwnershipRegistryHeaderProps) {
  return (
    <PageHeader
      breadcrumbs={[{ label: <Link href="/assets">Assets</Link> }, { label: "Ownership Registry" }]}
      title="Owner Registry"
      description="Single source of truth for on-chain asset equity and holder distribution, synchronized with the Stellar Ledger."
      actions={
        <Button variant="default" onClick={onExportClick}>
          <Table2 />
          Export Cap Table
        </Button>
      }
    />
  );
}
