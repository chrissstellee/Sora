"use client";

import * as React from "react";

import {
  ASSET_CATEGORY_OPTIONS,
  COUNTRY_OPTIONS,
  CURRENCY_OPTIONS,
  OWNERSHIP_TYPE_OPTIONS,
  assetRecordSchema,
} from "@repo/backend/domain/asset-record";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Textarea } from "@repo/ui/components/ui/textarea";

import type { AssetRecordInput } from "../lib/workspace-api";

export const EMPTY_ASSET_INPUT: AssetRecordInput = {
  name: "",
  category: "Real Estate",
  description: "",
  estimatedValue: "",
  currency: "USD",
  countryCode: "",
  legalOwner: "",
  registrationNumber: "",
  ownershipType: "Individual",
  contactEmail: "",
  address: "",
  contactPhone: "",
  internalNotes: "",
};

type FieldName =
  | "name"
  | "category"
  | "description"
  | "estimatedValue"
  | "currency"
  | "countryCode"
  | "legalOwner"
  | "registrationNumber"
  | "ownershipType"
  | "contactEmail"
  | "address"
  | "contactPhone"
  | "internalNotes";

interface AssetFormProps {
  initialValue?: AssetRecordInput;
  submitLabel: string;
  isSubmitting: boolean;
  serverFieldErrors?: Record<string, string[]>;
  preservedValue?: AssetRecordInput;
  onSubmit: (input: AssetRecordInput) => Promise<void> | void;
}

export function AssetForm({
  initialValue = EMPTY_ASSET_INPUT,
  submitLabel,
  isSubmitting,
  serverFieldErrors,
  preservedValue,
  onSubmit,
}: AssetFormProps) {
  const [value, setValue] = React.useState<AssetRecordInput>(preservedValue ?? initialValue);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!preservedValue) setValue(initialValue);
  }, [initialValue, preservedValue]);

  const update = (field: FieldName, next: string) => {
    setValue((current) => ({ ...current, [field]: next }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = assetRecordSchema.safeParse(value);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? "form");
        nextErrors[field] ??= issue.message;
      }
      setErrors(nextErrors);
      document.getElementById(`asset-${Object.keys(nextErrors)[0]}`)?.focus();
      return;
    }
    void onSubmit(parsed.data);
  };

  const errorFor = (field: FieldName) => errors[field] || serverFieldErrors?.[field]?.[0];
  const textField = (
    field: FieldName,
    label: string,
    options?: React.ComponentProps<typeof Input>,
  ) => (
    <div className="space-y-2">
      <Label htmlFor={`asset-${field}`}>{label}</Label>
      <Input
        id={`asset-${field}`}
        value={String(value[field] ?? "")}
        onChange={(event) => update(field, event.target.value)}
        aria-invalid={Boolean(errorFor(field))}
        aria-describedby={errorFor(field) ? `asset-${field}-error` : undefined}
        {...options}
      />
      {errorFor(field) && (
        <p id={`asset-${field}-error`} className="text-sm text-destructive">
          {errorFor(field)}
        </p>
      )}
    </div>
  );

  const selectField = (field: FieldName, label: string, options: readonly string[]) => (
    <div className="space-y-2">
      <Label htmlFor={`asset-${field}`}>{label}</Label>
      <Select value={String(value[field])} onValueChange={(next) => update(field, next)}>
        <SelectTrigger
          id={`asset-${field}`}
          className="w-full"
          aria-invalid={Boolean(errorFor(field))}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {errorFor(field) && <p className="text-sm text-destructive">{errorFor(field)}</p>}
    </div>
  );

  return (
    <form className="space-y-8" onSubmit={submit} noValidate>
      <fieldset className="grid gap-5 sm:grid-cols-2" disabled={isSubmitting}>
        <legend className="col-span-full mb-1 text-lg font-semibold">Asset information</legend>
        <div className="sm:col-span-2">
          {textField("name", "Asset name", { maxLength: 120, autoFocus: true })}
        </div>
        {selectField("category", "Asset category", ASSET_CATEGORY_OPTIONS)}
        <div className="grid grid-cols-[1fr_120px] gap-3">
          {textField("estimatedValue", "Estimated value", {
            inputMode: "decimal",
            placeholder: "0.00",
          })}
          {selectField("currency", "Currency", CURRENCY_OPTIONS)}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="asset-description">Description</Label>
          <Textarea
            id="asset-description"
            value={value.description}
            rows={5}
            maxLength={4000}
            onChange={(event) => update("description", event.target.value)}
            aria-invalid={Boolean(errorFor("description"))}
          />
          {errorFor("description") && (
            <p className="text-sm text-destructive">{errorFor("description")}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="asset-countryCode">Country code</Label>
          <Input
            id="asset-countryCode"
            list="asset-country-codes"
            maxLength={2}
            placeholder="US"
            value={value.countryCode}
            onChange={(event) => update("countryCode", event.target.value)}
            aria-invalid={Boolean(errorFor("countryCode"))}
          />
          <datalist id="asset-country-codes">
            {COUNTRY_OPTIONS.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </datalist>
          {errorFor("countryCode") && (
            <p className="text-sm text-destructive">{errorFor("countryCode")}</p>
          )}
        </div>
        {textField("address", "Address (optional)", { maxLength: 500 })}
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-2" disabled={isSubmitting}>
        <legend className="col-span-full mb-1 text-lg font-semibold">Ownership and contact</legend>
        {textField("legalOwner", "Legal owner", { maxLength: 200 })}
        {selectField("ownershipType", "Ownership type", OWNERSHIP_TYPE_OPTIONS)}
        {textField("registrationNumber", "Registration number", { maxLength: 64 })}
        {textField("contactEmail", "Contact email", { type: "email", maxLength: 254 })}
        {textField("contactPhone", "Contact phone (optional)", { type: "tel", maxLength: 32 })}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="asset-internalNotes">Internal notes (optional)</Label>
          <Textarea
            id="asset-internalNotes"
            value={value.internalNotes ?? ""}
            rows={4}
            maxLength={2000}
            onChange={(event) => update("internalNotes", event.target.value)}
          />
        </div>
      </fieldset>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
