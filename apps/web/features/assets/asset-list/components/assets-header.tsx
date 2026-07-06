import { Download, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@repo/ui/components/ui/button";
import { PageHeader } from "@repo/ui/components/ui-customs/page-header";

export function AssetsHeader() {
  return (
    <PageHeader
      title="Assets"
      description="Manage, monitor, and organize every real-world asset within your organization before and after tokenization."
      actions={
        <>
          <Button variant="outline">
            <Download />
            Export Assets
          </Button>
          <Button variant="gradient" asChild>
            <Link href="/assets/create">
              <Plus />
              Add Asset
            </Link>
          </Button>
        </>
      }
    />
  );
}
