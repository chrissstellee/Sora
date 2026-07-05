import Link from "next/link";

import { Separator } from "@repo/ui/components/ui/separator";

import { AuthCard } from "../components/auth-card";
import { PasskeyButton } from "../components/passkey-button";
import { AUTH_CARD, AUTH_PROMPT } from "../constants/auth";
import { RegisterForm } from "./components/register-form";

export function CreateAccountPage() {
  return (
    <AuthCard title={AUTH_CARD.register.title} description={AUTH_CARD.register.description}>
      <RegisterForm />

      <div className="my-3 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          Or authenticate with
        </span>
        <Separator className="flex-1" />
      </div>

      <PasskeyButton mode="signup" />

      <p className="text-center text-sm text-muted-foreground">
        {AUTH_PROMPT.register.prompt}{" "}
        <Link href="/login" className="font-semibold text-soft-primary hover:underline">
          {AUTH_PROMPT.register.action}
        </Link>
      </p>
    </AuthCard>
  );
}
