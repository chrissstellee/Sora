"use client";

import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";

import { AssetForm } from "../components/asset-form";
import { ErrorState, LoadingState } from "../components/request-state";
import { useRequest } from "../lib/use-request";
import { WorkspaceApiError, getAsset, updateAsset } from "../lib/workspace-api";

import type { AssetRecord, AssetRecordInput } from "../lib/workspace-api";

const inputFields = [
  "name",
  "category",
  "description",
  "estimatedValue",
  "currency",
  "countryCode",
  "legalOwner",
  "registrationNumber",
  "ownershipType",
  "contactEmail",
  "address",
  "contactPhone",
  "internalNotes",
] as const;
const toInput = (asset: AssetRecord): AssetRecordInput =>
  Object.fromEntries(
    inputFields.map((field) => [field, asset[field]]),
  ) as unknown as AssetRecordInput;

export function EditAssetPage({ assetId }: { assetId: string }) {
  const request = useRequest((signal) => getAsset(assetId, signal), [assetId]);
  const [expectedVersion, setExpectedVersion] = React.useState<number>();
  const [draft, setDraft] = React.useState<AssetRecordInput>();
  const [latest, setLatest] = React.useState<AssetRecord>();
  const [reviewed, setReviewed] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const asset = request.data?.asset;
  const initialInput = React.useMemo(() => (asset ? toInput(asset) : undefined), [asset]);
  React.useEffect(() => {
    if (asset && expectedVersion === undefined) setExpectedVersion(asset.version);
  }, [asset, expectedVersion]);

  const submit = async (input: AssetRecordInput) => {
    setDraft(input);
    if (latest && !reviewed) return;
    setIsSubmitting(true);
    try {
      const result = await updateAsset(assetId, input, expectedVersion ?? asset?.version ?? 0);
      toast.success(result.outcome === "unchanged" ? "No changes to save" : "Asset updated");
      setLatest(undefined);
      setReviewed(false);
      request.setData({ asset: result.asset });
      setExpectedVersion(result.asset.version);
    } catch (error) {
      if (error instanceof WorkspaceApiError && error.status === 409) {
        try {
          setLatest((await getAsset(assetId)).asset);
        } catch {
          toast.error("The latest record could not be loaded.");
        }
      } else toast.error(error instanceof Error ? error.message : "Asset could not be updated");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (request.isLoading) return <LoadingState label="Loading asset editor…" />;
  if (request.error) return <ErrorState error={request.error} onRetry={request.retry} />;
  if (!asset) return null;
  if (asset.lifecycle !== "Draft")
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-semibold">Editing unavailable</h1>
        <p className="mt-2 text-muted-foreground">
          Only Draft asset records can be edited in Phase 2.
        </p>
        <Button asChild variant="outline" className="mt-5">
          <Link href={`/assets/${assetId}`}>Back to asset</Link>
        </Button>
      </div>
    );
  const changed = latest
    ? inputFields.filter((field) => String(asset[field] ?? "") !== String(latest[field] ?? ""))
    : [];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <Link href={`/assets/${assetId}`} className="text-sm text-primary hover:underline">
          ← Asset details
        </Link>
        <h1 className="mt-2 font-display text-3xl font-semibold">Edit {asset.name}</h1>
        <p className="mt-1 text-muted-foreground">
          Updates use version checks to prevent overwriting newer work.
        </p>
      </div>
      {latest && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-5" role="alert">
          <h2 className="font-semibold">A newer version is available</h2>
          <p className="mt-1 text-sm">
            Your draft is preserved. Review the latest server values before retrying.
          </p>
          <dl className="mt-3 grid gap-2 text-sm">
            {changed.length ? (
              changed.map((field) => (
                <div key={field}>
                  <dt className="font-medium">{field}</dt>
                  <dd className="text-muted-foreground">
                    {String(latest[field] ?? "Not provided")}
                  </dd>
                </div>
              ))
            ) : (
              <div>
                <dt className="font-medium">Version</dt>
                <dd className="text-muted-foreground">{latest.version}</dd>
              </div>
            )}
          </dl>
          {!reviewed ? (
            <Button
              className="mt-3"
              variant="outline"
              onClick={() => {
                setExpectedVersion(latest.version);
                setReviewed(true);
              }}
            >
              I reviewed the latest version
            </Button>
          ) : (
            <p className="mt-3 text-sm font-medium">
              Latest version reviewed. Submit again to apply your preserved draft.
            </p>
          )}
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Asset record</CardTitle>
        </CardHeader>
        <CardContent>
          {initialInput && (
            <AssetForm
              initialValue={initialInput}
              preservedValue={draft}
              submitLabel={latest && reviewed ? "Retry update" : "Save changes"}
              isSubmitting={isSubmitting}
              onSubmit={submit}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
