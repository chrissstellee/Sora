import Link from "next/link";

import { PageHeader } from "@repo/ui/components/ui-customs/page-header";

export function ActivityLogHeader() {
  return (
    <PageHeader
      breadcrumbs={[{ label: <Link href="/assets">Assets</Link> }, { label: "Activity Log" }]}
      title="Activity Log"
      description="Review the Organization's canonical, newest-first event timeline and public Testnet proof."
    />
  );
}
