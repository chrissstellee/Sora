"use client";

import { SquareCode, SquareTerminal } from "lucide-react";

import { DataTable } from "@repo/ui/components/ui-customs/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";

import { API_ACTIVITY_COLUMNS } from "../../constants/api-activity-columns";
import { API_KEY_COLUMNS } from "../../constants/api-key-columns";
import { useApiKeys } from "../../hooks/use-api-keys";

export function ApiKeysTab() {
  const { apiKeys, recentActivity, isLoading } = useApiKeys();

  return (
    <div className="flex flex-col gap-6">
      <Card className="min-w-0 gap-4 py-5">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5 pt-2 font-mono text-sm font-semibold tracking-wide text-secondary uppercase">
            <SquareCode className="size-4" />
            API Keys
          </CardTitle>
        </CardHeader>

        <CardContent className="min-w-0 px-0">
          <DataTable
            columns={API_KEY_COLUMNS}
            data={apiKeys}
            rowKey={(row) => row.id}
            itemLabel="keys"
            emptyMessage="No API keys yet."
            isLoading={isLoading}
            maxHeight="450px"
            containerClassName="min-w-0 rounded-none border-0"
            className="[&_table]:table-fixed"
          />
        </CardContent>
      </Card>

      <Card className="min-w-0 gap-4 py-5">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5 pt-2 font-mono text-sm font-semibold tracking-wide text-secondary uppercase">
            <SquareTerminal className="size-4" />
            Recent API Activity
          </CardTitle>
        </CardHeader>

        <CardContent className="min-w-0 px-0">
          <DataTable
            columns={API_ACTIVITY_COLUMNS}
            data={recentActivity}
            rowKey={(row) => row.id}
            itemLabel="events"
            emptyMessage="No recent activity."
            isLoading={isLoading}
            showPagination={false}
            maxHeight="450px"
            containerClassName="min-w-0 rounded-none border-0"
            className="[&_table]:table-fixed"
          />
        </CardContent>
      </Card>
    </div>
  );
}
