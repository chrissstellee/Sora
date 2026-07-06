import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/ui/components/ui/breadcrumb";

export function CreateAssetHeader() {
  return (
    <div className="flex flex-col gap-2">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild className="text-muted-foreground hover:text-primary/80">
              <Link href="/assets">Assets</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-soft-primary">Create Asset</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="my-2">
        <h1 className="font-display text-2xl font-semibold text-foreground">Create Asset</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a structured digital record of a real-world asset.
        </p>
      </div>
    </div>
  );
}
