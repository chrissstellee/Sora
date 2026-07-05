"use client";

import { Fingerprint, UserRoundPlus } from "lucide-react";

import { Button } from "@repo/ui/components/ui/button";

interface PasskeyButtonProps {
  mode: "signin" | "signup";
  onClick?: () => void;
  loading?: boolean;
}

export function PasskeyButton({ mode, onClick, loading }: PasskeyButtonProps) {
  const Icon = mode === "signin" ? Fingerprint : UserRoundPlus;
  const label = mode === "signin" ? "Sign In With Passkey" : "Register with Passkey";

  return (
    <Button
      type="button"
      variant="outlineSecondary"
      className="mb-3 w-full"
      onClick={onClick}
      loading={loading}
    >
      <Icon className="size-4" />
      {label}
    </Button>
  );
}
