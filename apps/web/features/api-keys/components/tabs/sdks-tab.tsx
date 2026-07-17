import { PackageOpen } from "lucide-react";

import { Card, CardContent } from "@repo/ui/components/ui/card";

export function SdksTab() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <PackageOpen className="size-6" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">SDKs Coming Soon</h3>
        <p className="max-w-sm text-xs text-muted-foreground">
          Official client libraries are in development. Check back soon.
        </p>
      </CardContent>
    </Card>
  );
}
