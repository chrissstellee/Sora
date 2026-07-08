import { Upload } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@repo/ui/components/ui-customs/page-header";
import { Button } from "@repo/ui/components/ui/button";

interface DocumentsHeaderProps {
  onUploadClick: () => void;
}

export function DocumentsHeader({ onUploadClick }: DocumentsHeaderProps) {
  return (
    <PageHeader
      breadcrumbs={[{ label: <Link href="/assets">Assets</Link> }, { label: "Documents" }]}
      title="Documents"
      description="Manage organization-wide RWA verification documents and asset legalities."
      actions={
        <Button variant="gradient" onClick={onUploadClick}>
          <Upload />
          Upload Documents
        </Button>
      }
    />
  );
}
