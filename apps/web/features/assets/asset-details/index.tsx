"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { stellarExpertUrl } from "@repo/backend/stellar/explorer";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";

import { ErrorState, LoadingState } from "../components/request-state";
import { useRequest } from "../lib/use-request";
import { formatAssetValue, getActivity, getAsset } from "../lib/workspace-api";
import { Phase3Preparation } from "./phase3-preparation";

export function AssetDetailsPage({ assetId }: { assetId: string }) {
  const assetRequest = useRequest((signal) => getAsset(assetId, signal), [assetId]);
  const activityRequest = useRequest(
    (signal) => getActivity(signal, { assetId, limit: 25 }),
    [assetId],
  );

  if (assetRequest.isLoading) return <LoadingState label="Loading asset…" />;
  if (assetRequest.error) {
    if ("status" in assetRequest.error && assetRequest.error.status === 404) {
      return (
        <div className="py-16 text-center" role="status">
          <h1 className="text-2xl font-semibold">Asset not found</h1>
          <p className="mt-2 text-muted-foreground">
            This record is unavailable in your workspace.
          </p>
          <Button asChild variant="outline" className="mt-5">
            <Link href="/assets">Back to assets</Link>
          </Button>
        </div>
      );
    }
    return <ErrorState error={assetRequest.error} onRetry={assetRequest.retry} />;
  }
  const asset = assetRequest.data?.asset;
  if (!asset) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <Link href="/assets" className="text-sm text-primary hover:underline">
            ← Assets
          </Link>
          <h1 className="mt-2 font-display text-3xl font-semibold">{asset.name}</h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">{asset.assetId}</p>
        </div>
        {asset.lifecycle === "Draft" && (
          <Button asChild>
            <Link href={`/assets/${asset.assetId}/edit`}>Edit record</Link>
          </Button>
        )}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Asset record</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-5">
            <Detail label="Lifecycle" value={asset.lifecycle} />
            <Detail label="Category" value={asset.category} />
            <Detail label="Estimated value" value={formatAssetValue(asset)} />
            <Detail label="Country" value={asset.countryCode} />
            <Detail label="Description" value={asset.description} wide />
            <Detail label="Address" value={asset.address || "Not provided"} wide />
            <Detail label="Version" value={String(asset.version)} />
            <Detail label="Last updated" value={new Date(asset.updatedAt).toLocaleString()} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ownership</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-5">
            <Detail label="Legal owner" value={asset.legalOwner} />
            <Detail label="Ownership type" value={asset.ownershipType} />
            <Detail label="Registration number" value={asset.registrationNumber} />
            <Detail label="Contact email" value={asset.contactEmail} />
            <Detail label="Contact phone" value={asset.contactPhone || "Not provided"} />
            <Detail label="Internal notes" value={asset.internalNotes || "Not provided"} wide />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activityRequest.isLoading && <LoadingState label="Loading activity…" />}
          {activityRequest.error && (
            <ErrorState error={activityRequest.error} onRetry={activityRequest.retry} />
          )}
          {activityRequest.data?.items.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No activity recorded for this asset.
            </p>
          )}
          <ActivityList items={activityRequest.data?.items ?? []} />
        </CardContent>
      </Card>
      {(["Draft", "Review", "Ready"] as const).includes(asset.lifecycle as never) && (
        <Phase3Preparation asset={asset} />
      )}
    </div>
  );
}

function Detail({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : undefined}>
      <dt className="text-xs tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-1 text-sm whitespace-pre-wrap">{value}</dd>
    </div>
  );
}

export function ActivityList({ items }: { items: import("../lib/workspace-api").ActivityEvent[] }) {
  return (
    <ol className="divide-y">
      {items.map((event) => {
        const proofLinks = activityProofLinks(event.metadata);
        const changedFields = Array.isArray(event.metadata?.changedFields)
          ? event.metadata.changedFields.filter(
              (value): value is string => typeof value === "string",
            )
          : [];
        return (
          <li key={event.id} className="flex flex-col justify-between gap-3 py-4 sm:flex-row">
            <div className="min-w-0">
              <p className="font-medium capitalize">{event.eventType.replaceAll(".", " ")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {event.actorKind ? `${event.actorKind} · ` : "Legacy event · "}
                {event.outcome ?? "recorded"}
                {event.runId ? ` · Run ${event.runId}` : ""}
              </p>
              {changedFields.length > 0 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Changed: {changedFields.join(", ")}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-3">
                {event.assetId && (
                  <Link
                    href={`/assets/${encodeURIComponent(event.assetId)}`}
                    className="text-xs text-primary hover:underline"
                  >
                    Open authorized asset
                  </Link>
                )}
                {proofLinks.map((proof) => (
                  <a
                    key={`${proof.label}-${proof.href}`}
                    href={proof.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    {proof.label} <ExternalLink className="size-3" aria-hidden="true" />
                  </a>
                ))}
                {hasPublicProofMetadata(event.metadata) && proofLinks.length === 0 && (
                  <span className="text-xs text-muted-foreground">Public proof unavailable</span>
                )}
              </div>
            </div>
            <time
              className="shrink-0 text-xs text-muted-foreground"
              dateTime={new Date(event.timestamp).toISOString()}
            >
              {new Date(event.timestamp).toLocaleString()}
            </time>
          </li>
        );
      })}
    </ol>
  );
}

function hasPublicProofMetadata(metadata: Record<string, unknown> | undefined) {
  return Boolean(
    metadata &&
    ["transactionHash", "ledger", "account", "issuerAccount", "assetCode"].some(
      (key) => key in metadata,
    ),
  );
}

function activityProofLinks(metadata: Record<string, unknown> | undefined) {
  if (!metadata) return [];
  const links: Array<{ label: string; href: string }> = [];
  const add = (label: string, href: string | null) => {
    if (href) links.push({ label, href });
  };
  if (typeof metadata.transactionHash === "string") {
    add("Transaction proof", stellarExpertUrl({ resource: "tx", id: metadata.transactionHash }));
  }
  if (typeof metadata.ledger === "string" || typeof metadata.ledger === "number") {
    add("Ledger proof", stellarExpertUrl({ resource: "ledger", id: metadata.ledger }));
  }
  if (typeof metadata.account === "string") {
    add("Account proof", stellarExpertUrl({ resource: "account", id: metadata.account }));
  }
  if (typeof metadata.issuerAccount === "string") {
    add("Issuer proof", stellarExpertUrl({ resource: "account", id: metadata.issuerAccount }));
  }
  if (typeof metadata.assetCode === "string" && typeof metadata.issuerAccount === "string") {
    add(
      "Asset proof",
      stellarExpertUrl({
        resource: "asset",
        code: metadata.assetCode,
        issuer: metadata.issuerAccount,
      }),
    );
  }
  return links;
}
