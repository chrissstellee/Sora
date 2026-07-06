import { Download, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@repo/ui/components/ui/button";

export function AssetsHeader() {
  return (
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Assets</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage, monitor, and organize every real-world asset within your organization before and
          after tokenization.
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
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
      </div>
    </div>
  );
}
