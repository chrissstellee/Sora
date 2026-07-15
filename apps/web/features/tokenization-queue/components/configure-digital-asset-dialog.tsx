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
import { Label } from "@repo/ui/components/ui/label";

import type { IIssuanceConfiguration, IIssuanceQueueEntry, IIssuanceSnapshot } from "../lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: IIssuanceQueueEntry | null;
  onProgress: () => Promise<void>;
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs tracking-wide text-muted-foreground uppercase">{label}</Label>
      <div className="rounded-md border border-border bg-muted px-3 py-2 font-mono text-sm break-all text-foreground">
        {value}
      </div>
    </div>
  );
}

export function ConfigureDigitalAssetDialog({ open, onOpenChange, entry, onProgress }: Props) {
  const [configuration, setConfiguration] = React.useState<IIssuanceConfiguration | null>(null);
  const [issuance, setIssuance] = React.useState<IIssuanceSnapshot | null>(entry?.issuance ?? null);
  const [working, setWorking] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const summaryRef = React.useRef<HTMLDivElement>(null);

  const refresh = React.useCallback(async (issuanceId: string) => {
    const response = await fetch(`/api/issuances/${issuanceId}`, { cache: "no-store" });
    if (!response.ok) throw new Error("The issuance status is temporarily unavailable.");
    const body = (await response.json()) as { issuance: IIssuanceSnapshot };
    setIssuance(body.issuance);
  }, []);

  React.useEffect(() => {
    if (!open || !entry) return;
    setIssuance(entry.issuance ?? null);
    setError(null);
    void fetch("/api/issuances/configuration", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Testnet issuance configuration is unavailable.");
        const body = (await response.json()) as { configuration: IIssuanceConfiguration };
        setConfiguration(body.configuration);
      })
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : "Configuration unavailable."),
      );
    if (entry.issuance) void refresh(entry.issuance.issuanceId).catch(() => undefined);
  }, [entry, open, refresh]);

  React.useEffect(() => {
    if (!open || !issuance || issuance.status === "Confirmed" || issuance.status === "Failed")
      return;
    const interval = window.setInterval(
      () => void refresh(issuance.issuanceId).catch(() => undefined),
      5_000,
    );
    return () => window.clearInterval(interval);
  }, [issuance, open, refresh]);

  const stateKey = issuance
    ? `${issuance.status}:${issuance.trustlineState}:${issuance.paymentState}`
    : "Ready";
  React.useEffect(() => {
    if (open) summaryRef.current?.focus();
  }, [open, stateKey]);

  if (!entry) return null;
  const effectiveIssuer =
    issuance?.issuerAccount ?? configuration?.issuerAccount ?? "Loading configuration";
  const effectiveDistributor =
    issuance?.distributorAccount ?? configuration?.distributorAccount ?? "Loading configuration";
  const safeToResume =
    issuance?.attempts.some((attempt) => attempt.state === "SafeToRetry") ?? false;
  const needsReview =
    issuance?.attempts.some((attempt) => attempt.state === "NeedsReview") ?? false;

  async function start() {
    if (!entry) return;
    setWorking(true);
    setError(null);
    try {
      const response = await fetch(`/api/assets/${entry.assetId}/issuance`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ expectedAssetVersion: entry.assetVersion }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? "Issuance could not start.");
      await refresh(body.issuanceId);
      await onProgress();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Issuance could not start.");
    } finally {
      setWorking(false);
    }
  }

  async function resume() {
    if (!issuance) return;
    setWorking(true);
    setError(null);
    try {
      const response = await fetch(`/api/issuances/${issuance.issuanceId}/resume`, {
        method: "POST",
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? "Issuance is not safe to resume.");
      await refresh(issuance.issuanceId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Issuance is not safe to resume.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent maxWidth="760px">
        <CredenzaHeader>
          <CredenzaTitle>Testnet issuance</CredenzaTitle>
          <CredenzaDescription>
            Review the immutable approved configuration. Sora signs and reconciles in the
            background.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <div className="flex flex-col gap-5">
            <div
              ref={summaryRef}
              tabIndex={-1}
              role="status"
              aria-live="polite"
              className="rounded-lg border border-border bg-muted p-4 outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <p className="font-semibold">
                {needsReview
                  ? "Needs review"
                  : safeToResume
                    ? "Safe to resume"
                    : (issuance?.status ?? "Ready")}
              </p>
              <p className="text-sm text-muted-foreground">
                Trustline: {issuance?.trustlineState ?? "Pending"}. Payment:{" "}
                {issuance?.paymentState ?? "Pending"}.
              </p>
            </div>
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-error/40 bg-error/10 p-3 text-sm text-error"
              >
                {error}
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <ReadOnlyField label="Network" value="Stellar Testnet" />
              <ReadOnlyField label="Asset code" value={entry.code} />
              <ReadOnlyField label="Canonical supply" value={entry.supply} />
              <ReadOnlyField label="Internal reference" value={entry.internalReference} />
            </div>
            <ReadOnlyField label="Issuer account" value={effectiveIssuer} />
            <ReadOnlyField label="Distributor account" value={effectiveDistributor} />
            {issuance?.trustlineProof && (
              <div className="rounded-lg border border-border p-4 text-sm">
                <p className="font-semibold">Trustline proof</p>
                <p>Type: {issuance.trustlineProof.type}</p>
                <p>Limit: {issuance.trustlineProof.limit}</p>
                {issuance.trustlineProof.hash && (
                  <p className="font-mono break-all">Hash: {issuance.trustlineProof.hash}</p>
                )}
                {issuance.trustlineProof.ledger && <p>Ledger: {issuance.trustlineProof.ledger}</p>}
              </div>
            )}
            {issuance?.paymentProof && (
              <div className="rounded-lg border border-success/40 bg-success/10 p-4 text-sm">
                <p className="font-semibold">Confirmed payment proof</p>
                <p className="font-mono break-all">Hash: {issuance.paymentProof.hash}</p>
                <p>Ledger: {issuance.paymentProof.ledger}</p>
                <p>Delivered supply: {issuance.paymentProof.amount}</p>
              </div>
            )}
            {issuance?.safeErrorCode && (
              <p className="text-sm text-error">Failure code: {issuance.safeErrorCode}</p>
            )}
          </div>
        </CredenzaBody>
        <CredenzaFooter className="flex-row justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {!issuance && (
            <Button
              variant="gradient"
              disabled={working || !configuration}
              onClick={() => void start()}
            >
              {working ? "Starting…" : "Start issuance"}
            </Button>
          )}
          {safeToResume && (
            <Button variant="gradient" disabled={working} onClick={() => void resume()}>
              {working ? "Resuming…" : "Resume safely"}
            </Button>
          )}
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
