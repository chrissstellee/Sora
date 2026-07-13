import Link from "next/link";

import { publicStellarConfig } from "@/core/config/env";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { cn } from "@repo/ui/lib/utils";

import { WORKSPACE_HEALTH_TEXT_CLASS, WORKSPACE_HEALTH_DOT_CLASS } from "../constants/dashboard";

import type { IWorkspaceHealth } from "../lib/types";

interface StatusRowProps {
  label: string;
  status: string;
  statusClass: string;
  dotClass: string;
}

function StatusRow({ label, status, statusClass, dotClass }: StatusRowProps) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("flex items-center gap-1.5 font-medium uppercase", statusClass)}>
        <span className={cn("size-2 rounded-full", dotClass)} />
        {status}
      </span>
    </div>
  );
}

export function WorkspaceHealth({ workspaceHealth }: { workspaceHealth: IWorkspaceHealth }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-mono text-sm font-semibold tracking-wider text-soft-primary uppercase">
          Workspace Health
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <StatusRow
          label="API Gateway"
          status={workspaceHealth.apiGateway}
          statusClass={WORKSPACE_HEALTH_TEXT_CLASS[workspaceHealth.apiGateway]}
          dotClass={WORKSPACE_HEALTH_DOT_CLASS[workspaceHealth.apiGateway]}
        />
        <StatusRow
          label={publicStellarConfig.uiLabel}
          status={workspaceHealth.stellarTestnet}
          statusClass={WORKSPACE_HEALTH_TEXT_CLASS[workspaceHealth.stellarTestnet]}
          dotClass={WORKSPACE_HEALTH_DOT_CLASS[workspaceHealth.stellarTestnet]}
        />
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Ledger Sync</span>
          <span className="font-mono font-medium text-foreground">
            LAG: {workspaceHealth.ledgerSyncLag}
          </span>
        </div>
      </CardContent>

      <CardFooter className="gap-2 border-t border-border/40 pt-4">
        <Button variant="outline" size="sm" className="flex-1">
          Export CSV
        </Button>
        <Button variant="gradient" size="sm" className="flex-1" asChild>
          <Link href="/assets">View All Assets</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
