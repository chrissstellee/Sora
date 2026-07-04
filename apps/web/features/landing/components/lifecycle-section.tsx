import { LIFECYCLE_STEPS } from "../constants/landing";
import { Reveal } from "./shared/reveal";
import { SectionHeading } from "./shared/section-heading";

export function LifecycleSection() {
  return (
    <section id="lifecycle" className="border-t border-border/60 bg-card/30">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <SectionHeading
            eyebrow="The Sora Lifecycle"
            title="Streamlined Asset Issuance"
            align="center"
            className="mx-auto"
          />
        </Reveal>

        <div className="relative mt-16 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-6">
          <div
            aria-hidden
            className="absolute top-4 right-0 left-0 hidden h-px bg-border lg:block"
          />
          {LIFECYCLE_STEPS.map(({ number, title, description }, index) => (
            <Reveal key={number} delay={index * 0.06} className="relative">
              <span className="relative z-10 flex size-8 items-center justify-center rounded-full border border-border bg-background font-mono text-xs text-secondary">
                {number}
              </span>
              <h3 className="mt-4 font-display text-sm font-semibold tracking-tight">{title}</h3>
              <p className="mt-1.5 text-xs text-muted-foreground">{description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
