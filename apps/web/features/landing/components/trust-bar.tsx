import { Code2 } from "lucide-react";

import { TRUST_ITEMS } from "../constants/landing";

export function TrustBar() {
  return (
    <section className="border-y border-border/60 bg-accent/30">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {TRUST_ITEMS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 font-mono text-xs tracking-wider text-muted-foreground uppercase"
            >
              <Icon className="size-3.5 text-primary" strokeWidth={1.75} />
              {label}
            </div>
          ))}
        </div>

        <div className="mt-12 flex items-center gap-4 text-muted-foreground/60">
          <div className="h-px flex-1 bg-border" />
          <div className="flex items-center gap-2 font-mono text-[11px] tracking-wider uppercase">
            <Code2 className="size-3.5" strokeWidth={1.75} />
            Built for Developers &amp; Institutions
          </div>
          <div className="h-px flex-1 bg-border" />
        </div>
      </div>
    </section>
  );
}
