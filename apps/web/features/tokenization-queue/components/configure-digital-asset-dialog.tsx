"use client";

import * as React from "react";

import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@repo/ui/components/ui-customs/credenza";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";

import type { IBlockchainParams, IIssuanceQueueEntry } from "../lib/types";

const BLANK_PARAMS: IBlockchainParams = {
  assetCode: "",
  decimals: "",
  totalSupply: "",
};

interface ConfigureDigitalAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The row being configured, or null when configuring a brand-new digital asset. */
  entry: IIssuanceQueueEntry | null;
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs tracking-wide text-muted-foreground uppercase">{label}</Label>
      <div className="rounded-md border border-border bg-muted px-3 py-2 text-sm font-medium text-foreground">
        {value || "—"}
      </div>
    </div>
  );
}

export function ConfigureDigitalAssetDialog({
  open,
  onOpenChange,
  entry,
}: ConfigureDigitalAssetDialogProps) {
  const [params, setParams] = React.useState<IBlockchainParams>(BLANK_PARAMS);

  React.useEffect(() => {
    if (open) {
      setParams(entry?.blockchainParams ?? BLANK_PARAMS);
    }
  }, [open, entry]);

  const internalReference = entry?.internalReference ?? "";
  const assetCategory = entry?.assetCategory ?? "";
  const issuerFacilityId = entry?.issuerFacilityId ?? "";

  const truncatedRegulatoryUri = "ipfs://bafybeigd...regsora/sep8.json";

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent maxWidth="760px">
        <CredenzaHeader>
          <CredenzaTitle>Configure Digital Asset</CredenzaTitle>
          <CredenzaDescription>
            Deploy new asset parameters to the blockchain infrastructure.
          </CredenzaDescription>
        </CredenzaHeader>

        <CredenzaBody>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_240px]">
            {/* Left column — form */}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold tracking-wider text-secondary uppercase">
                  01 · Metadata Verification
                </span>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ReadOnlyField label="Internal Reference" value={internalReference} />
                  <ReadOnlyField label="Asset Category" value={assetCategory} />
                </div>
                <ReadOnlyField label="Issuer Facility ID" value={issuerFacilityId} />
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold tracking-wider text-secondary uppercase">
                  02 · Blockchain Params
                </span>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="asset-code" className="text-xs text-muted-foreground">
                      Asset Code
                    </Label>
                    <Input
                      id="asset-code"
                      placeholder="e.g. PCF7"
                      value={params.assetCode}
                      onChange={(e) => setParams((p) => ({ ...p, assetCode: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="decimals" className="text-xs text-muted-foreground">
                      Decimals
                    </Label>
                    <Input
                      id="decimals"
                      placeholder="7"
                      value={params.decimals}
                      onChange={(e) => setParams((p) => ({ ...p, decimals: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="total-supply" className="text-xs text-muted-foreground">
                    Total Supply (Initial)
                  </Label>
                  <Input
                    id="total-supply"
                    placeholder="450,000.00"
                    value={params.totalSupply}
                    onChange={(e) => setParams((p) => ({ ...p, totalSupply: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Right column — live preview */}
            <div className="flex flex-col gap-3">
              <span className="text-\primary text-xs font-semibold tracking-wider uppercase">
                Live Preview
              </span>

              <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted p-4">
                <div className="flex size-9 items-center justify-center rounded-full bg-linear-120 from-primary via-[#1F0D3D] to-background p-2 text-xs font-bold text-background">
                  <span className="text-xs font-bold text-foreground">
                    <img src="/sora-logo.png" alt="Sora logo" className="h-4 w-4" />
                  </span>
                </div>

                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium text-foreground">SEP-20</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Asset Code</span>
                    <span className="font-mono font-medium text-foreground">
                      {params.assetCode || "---"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Flags</span>
                    <span className="font-medium text-foreground">AUTH_REQ</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Regulatory Logic</span>
                    <span className="truncate font-mono text-[11px] text-foreground">
                      {truncatedRegulatoryUri}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-soft-primary/30 bg-soft-primary/10 p-3 font-mono text-[11px] text-soft-primary">
                Configuration meets Stellar SEP standards. Ready for cryptographic signing.
              </div>
            </div>
          </div>
        </CredenzaBody>

        <CredenzaFooter className="flex-row justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Save Draft
          </Button>
          <Button variant="gradient" onClick={() => onOpenChange(false)}>
            Finalize &amp; Sign TX
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
