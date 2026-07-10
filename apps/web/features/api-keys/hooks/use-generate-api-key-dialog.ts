import * as React from "react";

import type { TApiKeyEnvironment } from "../lib/types";

export type TGenerateApiKeyStep = "form" | "success";

export interface IGeneratedApiKeyResult {
  clientId: string;
  secretKey: string;
}

interface IGenerateApiKeyFormState {
  keyName: string;
  environment: TApiKeyEnvironment;
  scopes: string[];
  description: string;
}

const INITIAL_FORM_STATE: IGenerateApiKeyFormState = {
  keyName: "",
  environment: "Sandbox",
  scopes: [],
  description: "",
};

function randomSegment(length: number) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

interface IUseGenerateApiKeyDialogResult {
  open: boolean;
  setOpen: (open: boolean) => void;
  step: TGenerateApiKeyStep;
  form: IGenerateApiKeyFormState;
  setKeyName: (value: string) => void;
  setEnvironment: (value: TApiKeyEnvironment) => void;
  toggleScope: (value: string) => void;
  setDescription: (value: string) => void;
  result: IGeneratedApiKeyResult | null;
  handleSubmit: () => void;
  handleDone: () => void;
  handleOpenChange: (open: boolean) => void;
}

export function useGenerateApiKeyDialog(): IUseGenerateApiKeyDialogResult {
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<TGenerateApiKeyStep>("form");
  const [form, setForm] = React.useState<IGenerateApiKeyFormState>(INITIAL_FORM_STATE);
  const [result, setResult] = React.useState<IGeneratedApiKeyResult | null>(null);

  const setKeyName = (value: string) => setForm((prev) => ({ ...prev, keyName: value }));
  const setEnvironment = (value: TApiKeyEnvironment) =>
    setForm((prev) => ({ ...prev, environment: value }));
  const setDescription = (value: string) => setForm((prev) => ({ ...prev, description: value }));

  const toggleScope = (value: string) =>
    setForm((prev) => ({
      ...prev,
      scopes: prev.scopes.includes(value)
        ? prev.scopes.filter((scope) => scope !== value)
        : [...prev.scopes, value],
    }));

  const handleSubmit = () => {
    const envSuffix = form.environment === "Production" ? "prod" : "sandbox";
    setResult({
      clientId: `cid_${randomSegment(8).toLowerCase()}_${envSuffix}`,
      secretKey: `sk_${form.environment === "Production" ? "live" : "test"}_${randomSegment(24)}`,
    });
    setStep("success");
  };

  const resetDialog = () => {
    setStep("form");
    setForm(INITIAL_FORM_STATE);
    setResult(null);
  };

  const handleDone = () => {
    setOpen(false);
    resetDialog();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetDialog();
    }
  };

  return {
    open,
    setOpen,
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
  };
}
