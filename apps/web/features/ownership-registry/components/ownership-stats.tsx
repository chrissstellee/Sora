import { ExternalLink } from "lucide-react";

import { stellarExpertUrl } from "@repo/backend/stellar/explorer";
import { Card } from "@repo/ui/components/ui/card";

import type { OwnershipResponse } from "../lib/ownership-api";

function ProofLink({ href, label }: { href: string | null; label: string }) {
  if (!href) return <span className="text-xs text-muted-foreground">Proof unavailable</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
    >
      {label} <ExternalLink className="size-3" aria-hidden="true" />
    </a>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Card className="gap-2 px-5 py-4">
      <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </Card>
  );
}

export function OwnershipStats({ data }: { data: OwnershipResponse }) {
  const { asset, snapshot } = data;
  const assetUrl = stellarExpertUrl({
    resource: "asset",
    code: asset.assetCode,
    issuer: asset.issuerAccount,
  });
  const issuerUrl = stellarExpertUrl({ resource: "account", id: asset.issuerAccount });
  const ledgerLabel = snapshot
    ? snapshot.firstLedger && snapshot.lastLedger
      ? `${snapshot.firstLedger.toLocaleString()}–${snapshot.lastLedger.toLocaleString()}`
      : "Not reported"
    : "Awaiting first complete snapshot";

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Stat label="Stellar asset">
        <strong className="font-mono text-sm break-all">{asset.assetCode}</strong>
        <span className="font-mono text-xs break-all text-muted-foreground">
          Issuer: {asset.issuerAccount}
        </span>
        <div className="flex flex-wrap gap-3">
          <ProofLink href={assetUrl} label="Asset proof" />
          <ProofLink href={issuerUrl} label="Issuer proof" />
        </div>
      </Stat>
      <Stat label="Reconciled supply">
        <strong className="font-mono text-lg">
          {snapshot?.confirmedSupply ?? asset.confirmedSupply}
        </strong>
        <span className="text-xs text-muted-foreground">
          Confirmed / observed:{" "}
          {snapshot ? `${snapshot.confirmedSupply} / ${snapshot.observedSupply}` : "Pending"}
        </span>
      </Stat>
      <Stat label="Non-zero account holders">
        <strong className="font-mono text-lg">
          {snapshot ? snapshot.holderCount.toLocaleString() : "Unavailable"}
        </strong>
        <span className="text-xs text-muted-foreground">Ledger range: {ledgerLabel}</span>
      </Stat>
      <Stat label="Last synchronized">
        <strong className="text-sm">
          {snapshot ? new Date(snapshot.synchronizedAt).toLocaleString() : "Not yet synchronized"}
        </strong>
        <span className="text-xs font-semibold text-secondary">Stellar Testnet</span>
      </Stat>
    </div>
  );
}
