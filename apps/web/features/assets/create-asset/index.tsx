"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";

import { AssetForm } from "../components/asset-form";
import { WorkspaceApiError, createAsset } from "../lib/workspace-api";

import type { AssetRecordInput } from "../lib/workspace-api";

export function CreateAssetPage() {
  const router = useRouter();
  const requestId = React.useRef<string>(crypto.randomUUID());
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>();

  const submit = async (input: AssetRecordInput) => {
    setIsSubmitting(true);
    setFieldErrors(undefined);
    try {
      const result = await createAsset(input, requestId.current);
      toast.success(result.replayed ? "Asset request recovered" : "Asset created", {
        description: `${result.asset.name} is saved as a Draft.`,
      });
      router.push(`/assets/${result.asset.assetId}`);
    } catch (error) {
      if (error instanceof WorkspaceApiError) setFieldErrors(error.fieldErrors);
      toast.error(error instanceof Error ? error.message : "Asset could not be created");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Create asset</h1>
        <p className="mt-1 text-muted-foreground">
          Create a persisted Draft record for your workspace.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Asset record</CardTitle>
        </CardHeader>
        <CardContent>
          <AssetForm
            submitLabel="Create asset"
            isSubmitting={isSubmitting}
            serverFieldErrors={fieldErrors}
            onSubmit={submit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
