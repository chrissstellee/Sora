"use client";

import { DataTable } from "@repo/ui/components/ui-customs/data-table";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";

import { AssetLifecycleProgress } from "../../../components/asset-lifecycle-progress";
import { ACTIVITY_ICON } from "../../constants/asset-details";
import { DOCS_COLUMNS } from "../../constants/document-columns";
import { MOCK_DOCUMENTS, MOCK_RECENT_ACTIVITY } from "../../lib/mock-asset-detail";

import type { IAsset } from "../../../asset-list/lib/types";

interface DocumentsTabProps {
  asset: IAsset;
}

// ─── Info Field ──────────────────────────────────────────────────────────────

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

// ─── Documents Tab ────────────────────────────────────────────────────────────

export function DocumentsTab({ asset }: DocumentsTabProps) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* ── Left / Main Column ─────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-4">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-sm font-semibold tracking-wider text-soft-primary uppercase">
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <InfoField label="Name" value={asset.name} />
              <InfoField label="Category" value={asset.type} />
              <InfoField label="Value" value={`$${asset.estValue}M`} />
              <InfoField label="Currency" value="USD" />
              <InfoField label="Country" value={asset.country} />
            </div>
          </CardContent>
        </Card>

        {/* Ownership Information */}
        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-sm font-semibold tracking-wider text-soft-primary uppercase">
              Ownership Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <InfoField label="Legal Owner" value="Skyline Holdings LLC" />
              <InfoField label="Reg Number" value="US-99283-B" />
              <InfoField label="Type" value="Corporate" />
              <InfoField label="Email" value="admin@skyline.com" />
            </div>
          </CardContent>
        </Card>

        {/* Blockchain Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-mono text-sm font-semibold tracking-wider text-soft-primary uppercase">
                Blockchain Status
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                {asset.blockchain === "Issued" ? "Issued" : "Not Yet Issued"}
              </span>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="mb-2 text-sm text-muted-foreground">
              {asset.blockchain === "Issued"
                ? "This asset has been issued on the Stellar network."
                : "This asset has not yet been issued on the Stellar network."}
            </p>
            {asset.blockchain !== "Issued" && (
              <Button size="sm" className="w-fit">
                Configure Digital Asset
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card className="border-0 bg-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-mono text-sm font-semibold tracking-wider text-soft-primary uppercase">
                Documents
              </CardTitle>
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-primary">
                View All Documents
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <DataTable
              columns={DOCS_COLUMNS}
              data={MOCK_DOCUMENTS}
              rowKey={(row) => row.id}
              itemLabel="documents"
              emptyMessage="No records match your filters."
              maxHeight="400px"
            />
          </CardContent>
        </Card>

        {/* Ownership Registry */}
        <Card className="border-0 bg-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-mono text-sm font-semibold tracking-wider text-soft-primary uppercase">
                Ownership Registry
              </CardTitle>
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-primary">
                View Ownership Registry
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex h-20 items-center justify-center rounded-md border border-dashed border-border bg-muted/20">
              <p className="text-sm text-muted-foreground">
                Ownership records will become available after issuance.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-0 bg-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-mono text-sm font-semibold tracking-wider text-soft-primary uppercase">
                Recent Activity
              </CardTitle>
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-primary">
                View Complete Activity Log
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-3">
              {MOCK_RECENT_ACTIVITY.map((item) => {
                const Icon = ACTIVITY_ICON[item.icon];
                return (
                  <li key={item.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Icon className="size-3" />
                      </div>
                      <span className="text-sm text-foreground">{item.description}</span>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{item.timeAgo}</span>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* ── Right Sidebar ──────────────────────────────────── */}
      <div className="flex w-full flex-col gap-4 lg:w-[260px]">
        {/* Asset Lifecycle */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-mono text-sm font-semibold tracking-wider text-soft-primary uppercase">
                Asset Lifecycle
              </CardTitle>
              <Badge className="text-[10px] font-medium tracking-widest uppercase">
                {asset.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <AssetLifecycleProgress lifecycle={asset.lifecycle} />
            <hr className="my-6 border-border" />
            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
              {asset.status === "Draft"
                ? "Complete all required steps to progress this asset toward tokenization."
                : asset.status === "Review"
                  ? "This asset has completed onboarding and is ready for blockchain configuration."
                  : "This asset has been successfully issued on the Stellar network."}
            </p>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-sm font-semibold tracking-wider text-soft-primary uppercase">
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-2.5 text-sm">
              {[
                { label: "Status", value: asset.status },
                { label: "Blockchain", value: asset.blockchain },
                { label: "Created", value: "Oct 12, 2023" },
                { label: "Documents", value: `${MOCK_DOCUMENTS.length} Files` },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium text-foreground">{value}</dd>
                </div>
              ))}
            </dl>

            <hr className="my-6 border-border" />

            {/* Quick Actions */}
            <h1 className="pb-6 font-mono text-sm font-semibold tracking-wider text-soft-primary uppercase">
              Quick Actions
            </h1>
            <div className="flex flex-col gap-3">
              <Button variant="outline" className="w-full">
                Edit Asset
              </Button>
              <Button variant="outline" className="w-full">
                Upload Document
              </Button>
              <Button variant="gradient" className="w-full">
                Configure Token
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
