"use client";

import { Download, History, Link2, Search } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { publicStellarConfig } from "@/core/config/env";
import { AdvancedDateRangePicker } from "@repo/ui/components/ui-customs/advance-range-date-picker";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";

import { CATEGORY_COLORS, LIFECYCLE_CHECKPOINTS } from "../../constants/asset-details";
import { MOCK_EVENTS } from "../../lib/mock-asset-detail";

import type { IAsset } from "../../../asset-list/lib/types";

interface ActivityTabProps {
  asset: IAsset;
}

export function ActivityTab({ asset: _asset }: ActivityTabProps) {
  const [filterType, setFilterType] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredEvents = MOCK_EVENTS.filter((evt) => {
    if (filterType !== "all" && evt.category.toLowerCase() !== filterType) {
      return false;
    }
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      return (
        evt.title.toLowerCase().includes(q) ||
        evt.description.toLowerCase().includes(q) ||
        evt.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Transaction hash copied");
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* ── Left / Main Column ─────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-4">
        {/* Title and Export Row */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Asset Activity Timeline</h2>
          <Button variant="outlineSecondary" size="sm" className="gap-1.5">
            <Download className="size-3.5" />
            Export Audit Log
          </Button>
        </div>

        {/* Filters and Search toolbar */}
        <Card className="py-4">
          <CardContent className="flex flex-col gap-3 px-4">
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <div className="relative w-full flex-1">
                <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by participant or event..."
                  className="pl-9 text-xs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full text-xs sm:w-[150px]">
                    <SelectValue placeholder="All Activity Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      All Activity Types
                    </SelectItem>
                    <SelectItem value="blockchain" className="text-xs">
                      Blockchain Events
                    </SelectItem>
                    <SelectItem value="system" className="text-xs">
                      System Events
                    </SelectItem>
                    <SelectItem value="documents" className="text-xs">
                      Document Events
                    </SelectItem>
                  </SelectContent>
                </Select>
                <AdvancedDateRangePicker className="h-9 shrink-0 gap-1 text-xs" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline Events List */}
        <div className="relative mt-2 pl-4">
          {/* Vertical line through timeline circles */}
          {filteredEvents.length > 0 && (
            <div className="absolute top-6 bottom-6 left-[31px] w-0.5 bg-border/50" />
          )}

          <div className="flex flex-col gap-8">
            {filteredEvents.length === 0 ? (
              <div className="-ml-3 flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 text-muted-foreground">
                <Search className="size-6 opacity-50" />
                <p className="text-sm font-medium">No activity events found</p>
                <p className="text-xs opacity-70">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
              </div>
            ) : (
              filteredEvents.map((evt) => {
                const Icon = evt.icon;
                return (
                  <div key={evt.id} className="relative flex min-w-0 gap-4">
                    {/* Timeline icon node */}
                    <div className="z-10 flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-foreground">
                      <Icon className="size-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col justify-between gap-1.5 sm:flex-row sm:items-start">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{evt.title}</span>
                          <Badge
                            variant="success"
                            className="px-1.5 py-0 text-[9px] tracking-wider uppercase"
                          >
                            {evt.status}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`px-1.5 py-0 text-[9px] tracking-wider uppercase ${CATEGORY_COLORS[evt.category]}`}
                          >
                            {evt.category}
                          </Badge>
                        </div>
                        <div className="text-right text-[11px] text-muted-foreground sm:mt-0">
                          <div>{evt.date}</div>
                          <div>{evt.time}</div>
                        </div>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {evt.description}
                      </p>

                      {/* Blockchain Detail Sub-Card */}
                      {evt.blockchainInfo && (
                        <div className="mt-3 rounded-lg border border-border bg-muted/20 p-3">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-left sm:grid-cols-4">
                            <div>
                              <span className="text-[9px] font-medium tracking-wider text-muted-foreground uppercase">
                                Transaction Hash
                              </span>
                              <div className="mt-0.5 flex items-center gap-1">
                                <button
                                  onClick={() =>
                                    handleCopy(
                                      "CC4FA9B8C7D6E5F4G3H2I1J0K9L8M7N6O5P4Q3R2S1T0U9V8W7X6Y5Z43219A1C",
                                    )
                                  }
                                  className="text-left font-mono text-xs text-primary hover:underline"
                                >
                                  {evt.blockchainInfo.txHash}
                                </button>
                              </div>
                            </div>
                            <div>
                              <span className="text-[9px] font-medium tracking-wider text-muted-foreground uppercase">
                                Ledger
                              </span>
                              <div className="mt-0.5 font-mono text-xs text-foreground">
                                {evt.blockchainInfo.ledger}
                              </div>
                            </div>
                            <div>
                              <span className="text-[9px] font-medium tracking-wider text-muted-foreground uppercase">
                                Network
                              </span>
                              <div className="mt-0.5 text-xs text-foreground">
                                {evt.blockchainInfo.network}
                              </div>
                            </div>
                            <div>
                              <span className="text-[9px] font-medium tracking-wider text-muted-foreground uppercase">
                                Confirmations
                              </span>
                              <div className="mt-0.5 text-xs font-semibold text-secondary">
                                {evt.blockchainInfo.confirmations}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Load Older Activity Button */}
        {filteredEvents.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Load Older Activity
            </Button>
          </div>
        )}
      </div>

      {/* ── Right Sidebar ──────────────────────────────────── */}
      <div className="flex w-full flex-col gap-4 lg:w-[260px]">
        {/* Audit Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-sm font-semibold tracking-wider text-soft-primary uppercase">
              Audit Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Events</span>
              <span className="font-semibold text-foreground">24</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Created Date</span>
              <span className="font-semibold text-foreground">Oct 18, 2023</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last Modified</span>
              <span className="font-semibold text-foreground">Oct 24, 2023</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-muted-foreground">Lifecycle Stage</span>
              <Badge
                variant="secondary"
                className="px-1.5 py-0 text-[9px] font-bold tracking-wider uppercase"
              >
                ISSUED
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Asset Lifecycle Card (Timeline checkpoints) */}
        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-sm font-semibold tracking-wider text-soft-primary uppercase">
              Asset Lifecycle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative pl-1">
              <div className="absolute top-2 bottom-2 left-[13px] w-0.5 bg-border/50" />
              <ol className="flex flex-col gap-4 text-xs">
                {LIFECYCLE_CHECKPOINTS.map((pt) => (
                  <li key={pt.label} className="flex items-center gap-2.5">
                    <span className="z-10 flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-background text-[9px] font-bold text-secondary">
                      ✓
                    </span>
                    <span className="font-medium text-foreground">{pt.label}</span>
                  </li>
                ))}
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Blockchain Stats Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-1.5 font-mono text-sm font-semibold tracking-wider text-soft-primary uppercase">
              <History className="size-3.5" />
              Blockchain Stats
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-xs">
            <div>
              <span className="font-mono text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                Total Transactions
              </span>
              <div className="mt-0.5 text-sm font-semibold text-foreground">1 Tx</div>
            </div>
            <div>
              <span className="font-mono text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                Latest Hash
              </span>
              <div className="mt-0.5">
                <button
                  onClick={() =>
                    handleCopy("CC4FA9B8C7D6E5F4G3H2I1J0K9L8M7N6O5P4Q3R2S1T0U9V8W7X6Y5Z43219A1C")
                  }
                  className="flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                >
                  CC4F...9A1C <Link2 className="size-3 shrink-0" />
                </button>
              </div>
            </div>
            <div>
              <span className="font-mono text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                Latest Ledger
              </span>
              <div className="mt-0.5 font-mono text-xs text-foreground">53,921,084</div>
            </div>
            <div className="mt-1 flex items-center gap-1.5 border-t border-border pt-3.5 text-[10px] font-semibold text-secondary">
              <span className="size-1.5 rounded-full bg-secondary" />
              CONFIRMED ON {publicStellarConfig.uiLabel.toUpperCase()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
