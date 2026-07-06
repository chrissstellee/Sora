import Link from "next/link";

import { PageHeader } from "@repo/ui/components/ui-customs/page-header";

export function CreateAssetHeader() {
  return (
    <PageHeader
      breadcrumbs={[{ label: <Link href="/assets">Assets</Link> }, { label: "Create Asset" }]}
      title="Create Asset"
      description="Create a structured digital record of a real-world asset."
    />
  );
}
