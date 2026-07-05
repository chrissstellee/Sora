import Link from "next/link";

import { Separator } from "@repo/ui/components/ui/separator";

import { AuthCard } from "../components/auth-card";
import { EnterpriseNotice } from "../components/enterprise-notice";
import { PasskeyButton } from "../components/passkey-button";
import { AUTH_CARD, AUTH_PROMPT } from "../constants/auth";
import { LoginForm } from "./components/login-form";

export function LoginPage() {
  return (
    <>
      <AuthCard title={AUTH_CARD.login.title} description={AUTH_CARD.login.description}>
        <LoginForm />

        <div className="my-3 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            Or continue with
          </span>
          <Separator className="flex-1" />
        </div>

        <PasskeyButton mode="signin" />

        <p className="text-center text-sm text-muted-foreground">
          {AUTH_PROMPT.login.prompt}{" "}
          <Link href="/register" className="font-semibold text-soft-primary hover:underline">
            {AUTH_PROMPT.login.action}
          </Link>
        </p>
      </AuthCard>

      <EnterpriseNotice />
    </>
  );
}
