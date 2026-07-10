import { Plus } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@repo/ui/components/ui-customs/page-header";
import { Button } from "@repo/ui/components/ui/button";

interface DashboardHeaderProps {
  orgName: string;
}

export function DashboardHeader({ orgName }: DashboardHeaderProps) {
  return (
    <PageHeader
      title={`Welcome back, ${orgName}`}
      description="Manage your organization's tokenized assets and monitor your Stellar infrastructure through our high-fidelity command interface."
      actions={
        <Button variant="gradient" asChild>
          <Link href="/assets/create">
            <Plus />
            Mint New Asset
          </Link>
        </Button>
      }
    />
  );
}
