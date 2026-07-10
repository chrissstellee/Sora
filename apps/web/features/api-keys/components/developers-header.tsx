import { KeyRound } from "lucide-react";

import { PageHeader } from "@repo/ui/components/ui-customs/page-header";
import { Button } from "@repo/ui/components/ui/button";

interface DevelopersHeaderProps {
  onGenerateKey: () => void;
}

export function DevelopersHeader({ onGenerateKey }: DevelopersHeaderProps) {
  return (
    <PageHeader
      // breadcrumbs={[{ label: "Developers" }, { label: "API Keys" }]}
      title="Developers"
      description="Securely integrate Sora's RWA infrastructure using our enterprise-grade REST APIs, ensuring robust compliance and lightning-fast execution."
      actions={
        <Button variant="gradient" className="gap-1.5" onClick={onGenerateKey}>
          <KeyRound className="size-3.5" />
          Generate API Key
        </Button>
      }
    />
  );
}
