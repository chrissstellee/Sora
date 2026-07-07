"use client";

import { Download, History, RefreshCw, Users } from "lucide-react";
import * as React from "react";

import { DataTable } from "@repo/ui/components/ui-customs/data-table";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";

import { HOLDER_TYPES } from "../../constants/asset-details";
import { OWNERSHIP_COLUMNS, TRANSFER_COLUMNS } from "../../constants/ownership-columns";
import { MOCK_HOLDERS, MOCK_TRANSFERS } from "../../lib/mock-asset-detail";

import type { IAsset } from "../../../asset-list/lib/types";

interface OwnershipTabProps {
  asset: IAsset;
}

export function OwnershipTab({ asset: _asset }: OwnershipTabProps) {
  const [filterType, setFilterType] = React.useState("all");
  const [hideSmallHolders, setHideSmallHolders] = React.useState(false);

  const filteredHolders = MOCK_HOLDERS.filter((holder) => {
    if (filterType !== "all" && holder.type.toLowerCase() !== filterType) {
      return false;
    }
    if (hideSmallHolders && holder.percentage <= 5) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* ── Left / Main Column ─────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-4">
        {/* Ownership Registry */}
        <Card className="bg-transparent pt-0">
          <CardHeader className="rounded-t-xl border-b border-border bg-card pt-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-secondary" />
                <CardTitle className="font-mono text-sm font-semibold tracking-wider text-foreground uppercase">
                  Ownership Registry
                </CardTitle>
              </div>
              <Button
                variant="outlineSecondary"
                size="sm"
                className="gap-1.5 self-start sm:self-auto"
              >
                <Download className="size-3.5" />
                Export Cap Table (CSV)
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-4 border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                  Holder Type
                </span>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-8 w-[130px] text-xs">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    {HOLDER_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value} className="text-xs">
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="hideSmall"
                  checked={hideSmallHolders}
                  onCheckedChange={(checked) => setHideSmallHolders(!!checked)}
                />
                <label
                  htmlFor="hideSmall"
                  className="cursor-pointer text-xs text-muted-foreground select-none"
                >
                  Show holders &gt; 5%
                </label>
              </div>
            </div>

            {/* Table */}
            <DataTable
              columns={OWNERSHIP_COLUMNS}
              data={filteredHolders}
              rowKey={(row) => row.name}
              itemLabel="holders"
              emptyMessage="No records match your filters."
              maxHeight="400px"
            />
          </CardContent>
        </Card>

        {/* Recent Transfer Activity */}
        <Card className="bg-transparent pt-0">
          <CardHeader className="rounded-t-xl border-b border-border bg-card pt-8">
            <div className="flex items-center gap-2">
              <History className="size-4 text-secondary" />
              <CardTitle className="font-mono text-sm font-semibold tracking-wider text-foreground uppercase">
                Recent Transfer Activity
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={TRANSFER_COLUMNS}
              data={MOCK_TRANSFERS}
              rowKey={(row) => row.txHash}
              itemLabel="transfers"
              emptyMessage="No records match your filters."
              maxHeight="400px"
            />
          </CardContent>
        </Card>
      </div>

      {/* ── Right Sidebar ──────────────────────────────────── */}
      <div className="flex w-full flex-col gap-4 lg:w-[260px]">
        {/* Ownership Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-sm font-semibold tracking-wider text-soft-primary uppercase">
              Ownership Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col">
              <span className="font-mono text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                Total Holders
              </span>
              <span className="text-2xl font-bold text-foreground">142</span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                Institutional
              </span>
              <span className="text-xl font-bold text-foreground">4</span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                Largest Holder
              </span>
              <span className="text-xl font-bold text-foreground">45%</span>
            </div>
            <div className="border-t border-border pt-3">
              <span className="font-mono text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                Circulating Supply
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-foreground">1.25M</span>
                <span className="text-[10px] font-semibold text-secondary uppercase">
                  DOTW Tokens
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ownership Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-sm font-semibold tracking-wider text-soft-primary uppercase">
              Ownership Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {[
              { type: "Institutional", value: 75, color: "bg-primary" },
              { type: "Retail", value: 15, color: "bg-secondary" },
              { type: "Treasury", value: 10, color: "bg-muted-foreground/50" },
            ].map((d) => (
              <div key={d.type} className="flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className={`size-1.5 rounded-full ${d.color}`} />
                    {d.type}
                  </span>
                  <span className="font-semibold text-foreground">{d.value}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className={`h-full ${d.color}`} style={{ width: `${d.value}%` }} />
                </div>
              </div>
            ))}

            {/* Holder Concentration Heatmap Graphic */}
            <div className="mt-2 flex flex-col overflow-hidden rounded-lg border border-border">
              <img
                src="/sora-og-image.png"
                alt="Holder concentration heatmap circular visualization"
                className="h-32 w-full object-cover object-center"
              />
              <div className="bg-muted/30 p-2 text-center text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                Holder Concentration Heatmap
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ownership Health */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Ownership Health
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/10 p-2.5">
              <span className="text-xs font-medium text-foreground">Synchronized with Stellar</span>
              <RefreshCw className="size-3 text-secondary" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex flex-col gap-0.5 rounded border border-border bg-muted/20 p-2">
                <span className="text-[9px] font-medium text-muted-foreground uppercase">
                  Last Sync
                </span>
                <span className="font-semibold text-foreground">2 mins ago</span>
              </div>
              <div className="flex flex-col gap-0.5 rounded border border-border bg-muted/20 p-2">
                <span className="text-[9px] font-medium text-muted-foreground uppercase">
                  Verified Trust
                </span>
                <span className="font-semibold text-foreground">142/142</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="h-8 w-full text-xs">
              Run Compliance Re-scan
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
