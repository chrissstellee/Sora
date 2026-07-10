"use client";

import { ArrowUpRight, Copy, Globe, VerifiedIcon } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";

import type { IAsset } from "../../../asset-list/lib/types";

interface TokenizationTabProps {
  asset: IAsset;
}

// ─── Info Field Helper ────────────────────────────────────────────────────────
function InfoField({
  label,
  value,
  copyableValue,
}: {
  label: string;
  value: string;
  copyableValue?: string;
}) {
  const handleCopy = () => {
    const textToCopy = copyableValue || value;
    navigator.clipboard.writeText(textToCopy);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="font-mono text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
        {label}
      </span>
      <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <span className="truncate text-sm font-medium text-foreground">{value}</span>
        {copyableValue && (
          <button
            onClick={handleCopy}
            className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
            title="Copy address"
          >
            <Copy className="size-3" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Lifecycle Point Helper ───────────────────────────────────────────────────
interface LifecycleItemProps {
  title: string;
  description: string;
  date: string;
  status: "completed" | "current" | "upcoming";
}

function LifecycleItem({ title, description, date, status }: LifecycleItemProps) {
  return (
    <li className="flex items-start gap-4">
      <div className="relative flex flex-col items-center">
        <span
          className={`z-10 flex size-4 shrink-0 items-center justify-center rounded-full border-2 text-[8px] font-bold ${
            status === "completed"
              ? "border-secondary bg-secondary text-background"
              : status === "current"
                ? "border-primary bg-primary text-background"
                : "border-muted-foreground/30 bg-muted text-muted-foreground"
          }`}
        >
          {status === "completed" && "✓"}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-sm font-semibold ${
              status === "upcoming" ? "text-muted-foreground/60" : "text-foreground"
            }`}
          >
            {title}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">{date}</span>
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </li>
  );
}

// ─── Tokenization Tab Main Component ──────────────────────────────────────────
export function TokenizationTab({ asset }: TokenizationTabProps) {
  // Determine if asset is issued
  const isIssued = asset.blockchain === "Issued" || asset.status === "Tokenized";

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* ── Left / Main Column ─────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-4">
        {/* Blockchain Asset Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-mono text-sm font-semibold tracking-wider text-soft-primary uppercase">
                Blockchain Asset Information
              </CardTitle>
              <Badge variant={isIssued ? "default" : "secondary"} className="text-[10px] uppercase">
                {isIssued ? "Issued on Stellar" : "Pending Issuance"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <InfoField
                label="Asset Code"
                value={isIssued ? asset.blockchainInfo.assetCode : "DOTW"}
              />
              <InfoField label="Category" value="Commercial Real Estate" />
              <InfoField
                label="Network"
                value={asset.blockchainInfo.network || "Stellar Mainnet"}
              />
              <InfoField label="Total Supply" value={isIssued ? "1,250,000.0000000" : "—"} />
              <InfoField label="Decimals" value="7" />
              <InfoField
                label="Issuer Address"
                value={isIssued ? asset.blockchainInfo.issuerId : "GC7V...YI7K6B"}
                copyableValue={
                  isIssued
                    ? asset.blockchainInfo.issuerId
                    : "GC7VD3L4X4D2C3E5O6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3YI7K6B"
                }
              />
            </div>
            {isIssued && (
              <div className="mt-4 border-t border-border pt-4">
                <InfoField
                  label="Distribution Account"
                  value="GBSH...LP9X2D"
                  copyableValue="GBSHP2C3E5O6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7LP9X2D"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Blockchain Transaction Record */}
        {isIssued && (
          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-sm font-semibold tracking-wider text-soft-primary uppercase">
                Blockchain Transaction Record
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <InfoField
                  label="Transaction Hash"
                  value="CC4F...9A1C"
                  copyableValue="CC4FA9B8C7D6E5F4G3H2I1J0K9L8M7N6O5P4Q3R2S1T0U9V8W7X6Y5Z43219A1C"
                />
                <div>
                  <span className="font-mono text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                    Network Status
                  </span>
                  <div className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-secondary">
                    <span className="size-1.5 rounded-full bg-secondary" />
                    Confirmed
                  </div>
                </div>
                <InfoField label="Ledger Sequence" value="53,921,084" />
                <InfoField label="Timestamp" value="Oct 24, 2023, 14:22:09" />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button variant="ghost" size="sm" className="h-auto gap-1 p-1 text-xs text-primary">
                  View on StellarExpert <ArrowUpRight className="size-3" />
                </Button>
                <span className="text-muted-foreground/30">|</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto gap-1 p-1 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      "CC4FA9B8C7D6E5F4G3H2I1J0K9L8M7N6O5P4Q3R2S1T0U9V8W7X6Y5Z43219A1C",
                    );
                    toast.success("Tx hash copied");
                  }}
                >
                  Copy Hash <Copy className="size-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Asset Lifecycle */}
        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-sm font-semibold tracking-wider text-soft-primary uppercase">
              Asset Lifecycle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative pl-2">
              {/* Timeline Connector Line */}
              <div className="absolute top-2 bottom-2 left-[15px] w-0.5 bg-border/50" />
              <ol className="flex flex-col gap-6">
                <LifecycleItem
                  title="Asset Created"
                  description="Internal identifier SRA-000021 registered in registry."
                  date="Oct 18, 09:32"
                  status="completed"
                />
                <LifecycleItem
                  title="Supporting Documents"
                  description="Property appraisal and legal title verified by compliance."
                  date="Oct 20, 11:45"
                  status="completed"
                />
                <LifecycleItem
                  title="Ready for Tokenization"
                  description="Stellar asset flags and configuration finalized."
                  date="Oct 22, 16:50"
                  status="completed"
                />
                <LifecycleItem
                  title="Issued on Stellar"
                  description={
                    isIssued
                      ? `Transaction confirmed. ${isIssued ? asset.blockchainInfo.assetCode : "DOTW"} is live on Mainnet.`
                      : "Transaction pending network confirmation."
                  }
                  date={isIssued ? "Oct 24, 14:22" : "Pending"}
                  status={isIssued ? "completed" : "current"}
                />
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Blockchain Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-sm font-semibold tracking-wider text-soft-primary uppercase">
              Blockchain Metadata
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
                <InfoField label="Internal Ref" value="DOTW-771" />
              </div>
              <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
                <InfoField label="Facility ID" value="FAC-NYC-982" />
              </div>
              <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
                <InfoField label="Country" value={asset.country} />
              </div>
              <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
                <div>
                  <span className="font-mono text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                    Audit Status
                  </span>
                  <div className="mt-0.5 text-sm font-semibold text-secondary">Verified</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Right Sidebar ──────────────────────────────────── */}
      <div className="flex w-full flex-col gap-4 lg:w-[260px]">
        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-sm font-semibold tracking-wider text-soft-primary uppercase">
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-3 px-3 pb-3">
              <VerifiedIcon className="size-8 shrink-0 text-secondary" />
              <div className="min-w-0">
                <p className="text-[10px] leading-none font-medium tracking-wider text-muted-foreground uppercase">
                  Status
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">Active on Stellar</p>
              </div>
            </div>
            <dl className="flex flex-col gap-2.5 text-xs">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Issuance Date</dt>
                <dd className="font-medium text-foreground">Oct 24, 2023</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Network</dt>
                <dd className="font-medium text-foreground">Mainnet</dd>
              </div>
              <div className="mt-1 flex items-center justify-between border-t border-border pt-2.5">
                <dt className="text-muted-foreground">Circulating Supply</dt>
                <dd className="font-semibold text-secondary">
                  1.25M {isIssued ? asset.blockchainInfo.assetCode : "DOTW"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Stellar Network Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-sm font-semibold tracking-wider text-soft-primary uppercase">
              Stellar Network Status
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <dl className="flex flex-col gap-2.5 text-xs">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Health</dt>
                <dd className="flex items-center gap-1 font-semibold text-secondary uppercase">
                  Operational <span className="size-1.5 rounded-full bg-secondary" />
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Base Fee</dt>
                <dd className="font-medium text-foreground">100 Stroops</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Sync Progress</dt>
                <dd className="font-medium text-foreground">100%</dd>
              </div>
            </dl>
            <div className="mt-1 flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
              <Globe className="size-3.5 text-muted-foreground" />
              Connected to Horizon
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity (Stellar events) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-mono text-sm font-semibold tracking-wider text-soft-primary uppercase">
                Recent Activity
              </CardTitle>
              {/* <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-[10px] font-semibold text-primary uppercase"
              >
                View Log
              </Button> */}
            </div>
          </CardHeader>
          <CardContent>
            <ol className="relative flex flex-col gap-4 pl-1 text-xs">
              <li className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <span className="size-1.5 rounded-full bg-secondary" />
                  Asset Issued
                </div>
                <p className="pl-3 text-muted-foreground">
                  Successful issuance to distribution account.
                </p>
                <span className="pl-3 text-[10px] text-muted-foreground">Oct 24 - 14:22:09</span>
              </li>
              <li className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <span className="size-1.5 rounded-full bg-secondary" />
                  Ledger Confirmation
                </div>
                <p className="pl-3 text-muted-foreground">
                  Transaction included in ledger 53,921,084.
                </p>
                <span className="pl-3 text-[10px] text-muted-foreground">Oct 24 - 14:22:09</span>
              </li>
              <li className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <span className="size-1.5 rounded-full bg-secondary" />
                  Account Signers Set
                </div>
                <p className="pl-3 text-muted-foreground">
                  Multi-sig thresholds updated for issuer.
                </p>
                <span className="pl-3 text-[10px] text-muted-foreground">Oct 23 - 10:15:02</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
