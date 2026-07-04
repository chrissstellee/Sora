import { Check, X } from "lucide-react";

import { Card } from "@repo/ui/components/ui/card";

import { SORA_WAY_ITEMS, STATUS_QUO_ITEMS } from "../constants/landing";
import { Reveal } from "./shared/reveal";
import { SectionHeading } from "./shared/section-heading";

export function ProblemsSection() {
  return (
    <section id="problems" className="mx-auto max-w-6xl px-6 py-24">
      <Reveal>
        <SectionHeading
          eyebrow="The Problem"
          title="Why legacy asset workflows break down"
          description="Tokenized assets need more than clever branding—they need a reliable system for records, compliance, and operations."
          className="mb-10"
        />
      </Reveal>

      <div className="grid gap-6 md:grid-cols-2">
        <Reveal>
          <Card className="h-full gap-8 p-2">
            <div className="px-6 pt-4">
              <p className="mb-3 font-mono text-xs tracking-[0.2em] text-soft-destructive uppercase">
                The Status Quo
              </p>
              <h3 className="font-display text-2xl font-semibold tracking-tight text-balance">
                Fragmented. Manual. Opaque.
              </h3>
            </div>
            <ul className="flex flex-col gap-4 px-6 pb-4">
              {STATUS_QUO_ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-soft-destructive/10">
                    <X className="size-3 text-soft-destructive" strokeWidth={2.5} />
                  </span>
                  <span className="text-sm text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>

        <Reveal delay={0.1}>
          <Card variant="accented" className="h-full gap-8 p-2">
            <div className="px-6 pt-4">
              <p className="mb-3 font-mono text-xs tracking-[0.2em] text-soft-secondary uppercase">
                The Sora Way
              </p>
              <h3 className="font-display text-2xl font-semibold tracking-tight text-balance">
                Unified Infrastructure.
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Sora provides the infrastructure required to issue, manage, and integrate tokenized
                assets throughout their lifecycle.
              </p>
            </div>
            <ul className="flex flex-col gap-4 px-6 pb-4">
              {SORA_WAY_ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-soft-secondary/10">
                    <Check className="size-3 text-soft-secondary" strokeWidth={2.5} />
                  </span>
                  <span className="text-sm text-foreground/90">{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}
