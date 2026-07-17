import { Badge } from "@repo/ui/components/ui/badge";

import type { IApiKeyEntry, TApiKeyEnvironment } from "../lib/types";
import type { DataTableColumn } from "@repo/ui/components/ui-customs/data-table";

const ENVIRONMENT_BADGE_VARIANT: Record<TApiKeyEnvironment, "warning" | "gray"> = {
  Production: "warning",
  Sandbox: "gray",
};

export const API_KEY_COLUMNS: DataTableColumn<IApiKeyEntry>[] = [
  {
    key: "name",
    header: "Key Name",
    cell: (row) => (
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold text-foreground">{row.name}</span>
        <span className="font-mono text-xs text-muted-foreground">{row.maskedKey}</span>
      </div>
    ),
  },
  {
    key: "environment",
    header: "Environment",
    cell: (row) => (
      <Badge variant={ENVIRONMENT_BADGE_VARIANT[row.environment]} className="uppercase">
        {row.environment}
      </Badge>
    ),
  },
  {
    key: "permissions",
    header: "Permissions",
    cell: (row) => <span className="text-sm text-foreground">{row.permissions}</span>,
  },
  {
    key: "createdBy",
    header: "Created By",
    cell: (row) => <span className="text-sm text-foreground">{row.createdBy}</span>,
  },
  {
    key: "status",
    header: "Status",
    cell: (row) => (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-secondary uppercase">
        <span className="size-1.5 rounded-full bg-secondary" />
        {row.status}
      </span>
    ),
  },
];
