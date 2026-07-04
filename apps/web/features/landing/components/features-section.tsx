import { FileText } from "lucide-react";

import { Card } from "@repo/ui/components/ui/card";

import { SIDE_FEATURES, SMALL_FEATURES } from "../constants/landing";
import { Reveal } from "./shared/reveal";
import { SectionHeading } from "./shared/section-heading";

export function FeaturesSection() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24">
      <Reveal>
        <SectionHeading
          eyebrow="Features"
          title="Enterprise Infrastructure"
          description="The most robust toolset for tokenizing real estate, private credit, and institutional treasury bills."
        />
      </Reveal>

      <div className="mt-12 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Reveal delay={0.05}>
          <Card className="h-full justify-between gap-8 p-8">
            <div>
              <div className="mb-5 flex size-10 items-center justify-center rounded-lg bg-primary/15">
                <FileText className="size-5 text-primary" strokeWidth={1.75} />
              </div>
              <h3 className="font-display text-xl font-semibold tracking-tight">
                Document Management
              </h3>
              <p className="mt-3 max-w-md text-sm text-muted-foreground">
                Efficiently manage property deeds, legal contracts, and financial audits. Prepare
                your asset&apos;s digital record through integrated internal review workflows.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background/60 p-4">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="flex items-center gap-2 text-foreground">
                  <span className="size-1.5 rounded-full bg-secondary" />
                  ASSET_PREPARATION_0293.PDF
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                <span>Internal Review Status</span>
                <span className="text-secondary">In Progress</span>
              </div>
              <div className="mt-3 flex flex-col gap-1.5">
                <div className="h-1.5 w-full rounded-full bg-muted">
                  <div className="h-full w-3/4 rounded-full bg-linear-to-r from-primary to-secondary" />
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted">
                  <div className="h-full w-2/5 rounded-full bg-linear-to-r from-primary to-secondary" />
                </div>
              </div>
            </div>
          </Card>
        </Reveal>

        <div className="grid gap-6">
          {SIDE_FEATURES.map(({ icon: Icon, title, description }, index) => (
            <Reveal key={title} delay={0.1 + index * 0.05}>
              <Card className="h-full gap-4 p-6">
                <div className="flex size-10 items-center justify-center rounded-lg bg-secondary/15">
                  <Icon className="size-5 text-secondary" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{description}</p>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {SMALL_FEATURES.map(({ title, description }, index) => (
          <Reveal key={title} delay={0.15 + index * 0.05}>
            <Card className="h-full gap-2 p-6">
              <p className="font-mono text-xs tracking-wide text-soft-primary">{title}</p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
