import Link from "next/link";

import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";

export function DocumentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Supporting documents</h1>
        <p className="mt-2 text-muted-foreground">
          Documents are authorized and managed from their Organization-owned Asset Record.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Open an asset to manage evidence</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-4">
          <p className="text-sm text-muted-foreground">
            Upload, download, replace, and delete controls enforce the asset lifecycle and current
            record versions.
          </p>
          <Button asChild>
            <Link href="/assets">Browse assets</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
