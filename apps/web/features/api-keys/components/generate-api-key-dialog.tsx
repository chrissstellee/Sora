"use client";

import { AlertTriangle, Copy, KeyRound, Rocket, ShieldAlert, Wrench } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

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
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { cn } from "@repo/ui/lib/utils";

import { PERMISSION_SCOPE_OPTIONS } from "../constants/api-keys";

import type { useGenerateApiKeyDialog } from "../hooks/use-generate-api-key-dialog";
import type { TApiKeyEnvironment } from "../lib/types";

interface EnvironmentOptionProps {
  value: TApiKeyEnvironment;
  label: string;
  description: string;
  icon: React.ElementType;
  selected: boolean;
  onSelect: (value: TApiKeyEnvironment) => void;
}

function EnvironmentOption({
  value,
  label,
  description,
  icon: Icon,
  selected,
  onSelect,
}: EnvironmentOptionProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        "flex flex-1 flex-col items-center gap-1.5 rounded-lg border bg-background px-4 py-3 text-center transition-colors",
        selected ? "border-secondary bg-secondary/10" : "border-border hover:border-primary/40",
      )}
    >
      <Icon className={cn("size-5", selected ? "text-secondary" : "text-muted-foreground")} />
      <span
        className={cn("text-sm font-semibold", selected ? "text-secondary" : "text-foreground")}
      >
        {label}
      </span>
      <span className="text-[11px] text-muted-foreground">{description}</span>
    </button>
  );
}

function handleCopy(label: string, value: string) {
  navigator.clipboard.writeText(value);
  toast.success(`${label} copied`);
}

function handleDownloadCredentials(clientId: string, secretKey: string) {
  const blob = new Blob([`Client ID: ${clientId}\nSecret API Key: ${secretKey}\n`], {
    type: "text/plain",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "sora-api-credentials.txt";
  link.click();
  URL.revokeObjectURL(url);
  toast.success("Credentials downloaded");
}

interface GenerateApiKeyDialogProps {
  dialog: ReturnType<typeof useGenerateApiKeyDialog>;
}

export function GenerateApiKeyDialog({ dialog }: GenerateApiKeyDialogProps) {
  const {
    open,
    step,
    form,
    setKeyName,
    setEnvironment,
    toggleScope,
    setDescription,
    result,
    handleSubmit,
    handleDone,
    handleOpenChange,
  } = dialog;

  return (
    <Credenza open={open} onOpenChange={handleOpenChange}>
      <CredenzaContent>
        {step === "form" ? (
          <>
            <CredenzaHeader>
              <CredenzaTitle className="flex items-center gap-2">
                <KeyRound className="size-4 text-secondary" />
                Generate New API Key
              </CredenzaTitle>
              <CredenzaDescription>
                API keys allow external applications to securely authenticate with Sora's REST API
                for managing assets, documents, tokenization workflows, and ownership records.
              </CredenzaDescription>
            </CredenzaHeader>

            <CredenzaBody className="flex flex-col gap-6">
              <div className="flex items-start gap-2 rounded-lg border border-error/30 bg-error/10 p-3">
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-error" />
                <p className="text-xs text-error">
                  <span className="font-semibold">Security Notice:</span> API keys should only be
                  shared with trusted backend services and should never be exposed in client-side
                  applications.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="key-name" className="text-xs font-medium uppercase">
                  Key Name <span className="text-error">*</span>
                </Label>
                <Input
                  id="key-name"
                  placeholder="e.g. Production Market"
                  value={form.keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Choose a meaningful name so team members can easily identify the key later.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-xs font-medium uppercase">Environment</Label>
                <div className="flex gap-3">
                  <EnvironmentOption
                    value="Sandbox"
                    label="Sandbox"
                    description="Development & Testing"
                    icon={Wrench}
                    selected={form.environment === "Sandbox"}
                    onSelect={setEnvironment}
                  />
                  <EnvironmentOption
                    value="Production"
                    label="Production"
                    description="Live Financial Data"
                    icon={Rocket}
                    selected={form.environment === "Production"}
                    onSelect={setEnvironment}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-xs font-medium uppercase">Permission Scope</Label>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  {PERMISSION_SCOPE_OPTIONS.map((scope) => (
                    <label
                      key={scope.value}
                      className="flex items-center gap-2 text-sm text-foreground"
                    >
                      <Checkbox
                        checked={form.scopes.includes(scope.value)}
                        onCheckedChange={() => toggleScope(scope.value)}
                      />
                      {scope.label}
                    </label>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Follow the principle of least privilege to improve organizational security.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="key-description" className="text-xs font-medium uppercase">
                  Description <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <Textarea
                  id="key-description"
                  placeholder="Used by the organization's production backend to create and issue tokenized assets."
                  value={form.description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </CredenzaBody>

            <CredenzaFooter className="flex-row justify-end gap-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                variant="gradient"
                className="gap-1.5"
                disabled={!form.keyName.trim()}
                onClick={handleSubmit}
              >
                <KeyRound className="size-3.5" />
                Generate API Key
              </Button>
            </CredenzaFooter>
          </>
        ) : (
          <>
            <CredenzaHeader className="items-center text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-success/15 text-success">
                <KeyRound className="size-5" />
              </div>
              <CredenzaTitle>API Key Created Successfully</CredenzaTitle>
            </CredenzaHeader>

            <CredenzaBody className="flex flex-col gap-5">
              <div className="flex items-start gap-2 rounded-lg border border-error/30 bg-error/10 p-3">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-error" />
                <p className="text-xs text-error">
                  <span className="font-semibold">Security Warning:</span> The secret key will only
                  be displayed once and cannot be retrieved again after closing this dialog. Copy
                  and securely store it now.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-xs font-medium uppercase">Client ID</Label>
                <div className="flex items-center gap-2">
                  <Input readOnly value={result?.clientId ?? ""} className="font-mono text-xs" />
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Copy Client ID"
                    onClick={() => result && handleCopy("Client ID", result.clientId)}
                  >
                    <Copy className="size-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-xs font-medium uppercase">Secret API Key</Label>
                <div className="flex items-center gap-2">
                  <Input readOnly value={result?.secretKey ?? ""} className="font-mono text-xs" />
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Copy Secret API Key"
                    onClick={() => result && handleCopy("Secret API Key", result.secretKey)}
                  >
                    <Copy className="size-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-xs font-medium uppercase">Authorization Example</Label>
                <pre className="overflow-x-auto rounded-md border border-border bg-background p-3 font-mono text-[11px] leading-relaxed text-foreground">
                  {`POST /v1/assets\nAuthorization: Bearer ${result?.secretKey ?? "sk_live_..."}\nContent-Type: application/json`}
                </pre>
              </div>
            </CredenzaBody>

            <CredenzaFooter className="flex-row justify-end gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  result && handleDownloadCredentials(result.clientId, result.secretKey)
                }
              >
                Download Credentials
              </Button>
              <Button variant="gradient" onClick={handleDone}>
                Done
              </Button>
            </CredenzaFooter>
          </>
        )}
      </CredenzaContent>
    </Credenza>
  );
}
