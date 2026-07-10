"use client";

import { DevelopersHeader } from "./components/developers-header";
import { DevelopersStats } from "./components/developers-stats";
import { DevelopersTabs } from "./components/developers-tabs";
import { GenerateApiKeyDialog } from "./components/generate-api-key-dialog";
import { useDevelopers } from "./hooks/use-developers";
import { useGenerateApiKeyDialog } from "./hooks/use-generate-api-key-dialog";

export function APIKeysPage() {
  const { stats } = useDevelopers();
  const generateApiKeyDialog = useGenerateApiKeyDialog();

  return (
    <div className="flex flex-col gap-6">
      <DevelopersHeader onGenerateKey={() => generateApiKeyDialog.setOpen(true)} />
      <DevelopersStats stats={stats} />
      <DevelopersTabs />

      <GenerateApiKeyDialog dialog={generateApiKeyDialog} />
    </div>
  );
}
