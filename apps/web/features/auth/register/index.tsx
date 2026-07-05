import Link from "next/link";

import { Separator } from "@repo/ui/components/ui/separator";

import { AuthCard } from "../components/auth-card";
import { PasskeyButton } from "../components/passkey-button";
import { RegisterForm } from "./components/register-form";

export function CreateAccountPage() {
  return (
    <AuthCard
      title="Create Account"
      description="Begin your journey in the RWA frontier with cosmic infrastructure."
    >
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
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-soft-primary hover:underline">
          Log In
        </Link>
      </p>
    </AuthCard>
  );
}
