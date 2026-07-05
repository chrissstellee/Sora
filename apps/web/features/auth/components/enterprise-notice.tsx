import { ShieldCheck } from "lucide-react";

import { AUTH_NOTICE } from "../constants/auth";

export function EnterpriseNotice() {
  return (
    <div className="mt-6 flex w-full max-w-[480px] items-start gap-3 rounded-xl border border-border bg-card p-5">
      <ShieldCheck className="mt-0.5 size-5 shrink-0 text-soft-secondary" />
      <p className="font-mono text-xs leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">{AUTH_NOTICE.heading} </span>
        {AUTH_NOTICE.body}
      </p>
    </div>
  );
}
