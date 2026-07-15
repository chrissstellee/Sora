"use client";

import Link from "next/link";
import * as React from "react";

import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";

import type { AssetRecord } from "../lib/workspace-api";

interface ReviewSnapshot {
  asset: { version: number; lifecycle: AssetRecord["lifecycle"] };
  profile: null | {
    assetCode: string;
    supply: string;
    internalReference: string;
    version: number;
  };
  documents: Array<{
    documentId: string;
    filename: string;
    mediaType: string;
    byteSize: number;
    version: number;
  }>;
  readiness: { ready: boolean; blockers: Array<{ section: string; code: string }> };
}

export function Phase3Preparation({ asset }: { asset: AssetRecord }) {
  const [snapshot, setSnapshot] = React.useState<ReviewSnapshot | null>(null);
  const [assetCode, setAssetCode] = React.useState("");
  const [supply, setSupply] = React.useState("");
  const [internalReference, setInternalReference] = React.useState("");
  const [returnReason, setReturnReason] = React.useState("");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const statusRef = React.useRef<HTMLDivElement>(null);

  const load = React.useCallback(async () => {
    const response = await fetch(`/api/assets/${asset.assetId}/review`, { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error?.message ?? "Preparation data is unavailable.");
    const next = body as ReviewSnapshot;
    setSnapshot(next);
    setAssetCode(next.profile?.assetCode ?? "");
    setSupply(next.profile?.supply ?? "");
    setInternalReference(next.profile?.internalReference ?? "");
  }, [asset.assetId]);

  React.useEffect(() => {
    void load().catch((reason) =>
      setError(reason instanceof Error ? reason.message : "Preparation data is unavailable."),
    );
  }, [load]);

  React.useEffect(() => {
    if (message || error) statusRef.current?.focus();
  }, [error, message]);

  async function mutate(label: string, url: string, body: object) {
    setBusy(label);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? `${label} failed.`);
      setMessage(`${label} saved.`);
      await load();
      window.location.reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : `${label} failed.`);
    } finally {
      setBusy(null);
    }
  }

  async function saveProfile() {
    if (!snapshot) return;
    setBusy("Tokenization profile");
    setError(null);
    try {
      const response = await fetch(`/api/assets/${asset.assetId}/tokenization-profile`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          assetCode,
          proposedSupply: supply,
          internalReference,
          expectedAssetVersion: snapshot.asset.version,
          expectedProfileVersion: snapshot.profile?.version,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Profile could not be saved.");
      setMessage("Tokenization profile saved.");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Profile could not be saved.");
    } finally {
      setBusy(null);
    }
  }

  async function upload(file: File, replaces?: ReviewSnapshot["documents"][number]) {
    if (!snapshot) return;
    setBusy("Document");
    setError(null);
    try {
      const intentResponse = await fetch(`/api/assets/${asset.assetId}/documents`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          expectedAssetVersion: snapshot.asset.version,
          replacesDocumentId: replaces?.documentId,
          expectedDocumentVersion: replaces?.version,
        }),
      });
      const intent = await intentResponse.json();
      if (!intentResponse.ok) throw new Error(intent.error?.message ?? "Upload could not start.");
      const uploadResponse = await fetch(intent.uploadUrl, {
        method: "POST",
        headers: { "content-type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!uploadResponse.ok) throw new Error("The file could not be stored.");
      const { storageId } = await uploadResponse.json();
      const finalizeResponse = await fetch(`/api/assets/${asset.assetId}/documents/finalize`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ intentId: intent.intentId, storageId, filename: file.name }),
      });
      const finalized = await finalizeResponse.json();
      if (!finalizeResponse.ok)
        throw new Error(finalized.error?.message ?? "Stored file validation failed.");
      setMessage("Document validated and saved.");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Document upload failed.");
    } finally {
      setBusy(null);
    }
  }

  async function removeDocument(document: ReviewSnapshot["documents"][number]) {
    if (!snapshot || !window.confirm(`Delete ${document.filename}?`)) return;
    setBusy("Document deletion");
    try {
      const response = await fetch(`/api/documents/${document.documentId}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          assetId: asset.assetId,
          expectedAssetVersion: snapshot.asset.version,
          expectedDocumentVersion: document.version,
          requestId: crypto.randomUUID(),
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? "Document could not be deleted.");
      setMessage("Document deleted.");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Document could not be deleted.");
    } finally {
      setBusy(null);
    }
  }

  if (!snapshot) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Loading preparation and review data…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents, tokenization profile, and review</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div ref={statusRef} tabIndex={-1} aria-live="polite" className="outline-none">
          {message && (
            <p role="status" className="rounded-md bg-success/10 p-3 text-sm text-success">
              {message}
            </p>
          )}
          {error && (
            <p role="alert" className="rounded-md bg-error/10 p-3 text-sm text-error">
              {error}
            </p>
          )}
        </div>

        <section aria-labelledby="profile-heading" className="flex flex-col gap-3">
          <h3 id="profile-heading" className="font-semibold">
            Proposed tokenization profile
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="phase3-code">Asset code</Label>
              <Input
                id="phase3-code"
                value={assetCode}
                disabled={asset.lifecycle !== "Draft"}
                onChange={(event) => setAssetCode(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="phase3-supply">Supply</Label>
              <Input
                id="phase3-supply"
                value={supply}
                disabled={asset.lifecycle !== "Draft"}
                onChange={(event) => setSupply(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="phase3-reference">Internal reference</Label>
              <Input
                id="phase3-reference"
                value={internalReference}
                disabled={asset.lifecycle !== "Draft"}
                onChange={(event) => setInternalReference(event.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Fixed network: Stellar Testnet. Supply is stored in exact 10⁻⁷ units.
          </p>
          {asset.lifecycle === "Draft" && (
            <Button
              className="self-start"
              disabled={busy !== null}
              onClick={() => void saveProfile()}
            >
              Save profile
            </Button>
          )}
        </section>

        <section aria-labelledby="documents-heading" className="flex flex-col gap-3">
          <h3 id="documents-heading" className="font-semibold">
            Supporting documents
          </h3>
          {snapshot.documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No validated documents.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {snapshot.documents.map((document) => (
                <li
                  key={document.documentId}
                  className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{document.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {document.mediaType} · {document.byteSize} bytes · version {document.version}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                      <a href={`/api/documents/${document.documentId}`}>Download</a>
                    </Button>
                    {asset.lifecycle === "Draft" && (
                      <>
                        <Label className="cursor-pointer rounded-md border px-3 py-1.5 text-xs font-medium">
                          Replace
                          <input
                            className="sr-only"
                            type="file"
                            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                            disabled={busy !== null}
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) void upload(file, document);
                            }}
                          />
                        </Label>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy !== null}
                          onClick={() => void removeDocument(document)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {asset.lifecycle === "Draft" && (
            <div>
              <Label htmlFor="phase3-document">
                Upload PDF, DOC, DOCX, PNG, or JPEG (10 MB maximum)
              </Label>
              <Input
                id="phase3-document"
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                disabled={busy !== null}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void upload(file);
                }}
              />
            </div>
          )}
        </section>

        <section aria-labelledby="readiness-heading" className="flex flex-col gap-3">
          <h3 id="readiness-heading" className="font-semibold">
            Readiness
          </h3>
          <p className="text-sm">
            {snapshot.readiness.ready
              ? "All deterministic readiness checks pass."
              : `Blocked: ${snapshot.readiness.blockers.map((blocker) => blocker.section).join(", ")}.`}
          </p>
          {asset.lifecycle === "Draft" && (
            <Button
              className="self-start"
              disabled={busy !== null || !snapshot.readiness.ready}
              onClick={() =>
                void mutate("Review submission", `/api/assets/${asset.assetId}/review/submit`, {
                  expectedAssetVersion: snapshot.asset.version,
                })
              }
            >
              Submit for review
            </Button>
          )}
          {asset.lifecycle === "Review" && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                The manifest is immutable. Documents and profile are read-only during review.
              </p>
              <Label htmlFor="return-reason">Return reason</Label>
              <Input
                id="return-reason"
                value={returnReason}
                onChange={(event) => setReturnReason(event.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={busy !== null || returnReason.trim().length < 10}
                  onClick={() =>
                    void mutate("Review return", `/api/assets/${asset.assetId}/review/return`, {
                      expectedAssetVersion: snapshot.asset.version,
                      reason: returnReason,
                    })
                  }
                >
                  Return to Draft
                </Button>
                <Button
                  disabled={busy !== null}
                  onClick={() =>
                    void mutate("Approval", `/api/assets/${asset.assetId}/review/approve`, {
                      expectedAssetVersion: snapshot.asset.version,
                    })
                  }
                >
                  Approve as Ready
                </Button>
              </div>
            </div>
          )}
          {asset.lifecycle === "Ready" && (
            <Button asChild className="self-start">
              <Link href="/tokenization-queue">Open issuance queue</Link>
            </Button>
          )}
          {(["Draft", "Review", "Ready"] as const).includes(asset.lifecycle as never) && (
            <Button
              className="self-start"
              variant="outline"
              disabled={busy !== null}
              onClick={() => {
                if (window.confirm("Archive this asset? Archived assets are terminal.")) {
                  void mutate("Archive", `/api/assets/${asset.assetId}/archive`, {
                    expectedAssetVersion: snapshot.asset.version,
                  });
                }
              }}
            >
              Archive asset
            </Button>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
