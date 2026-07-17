"use client";

import { LIFECYCLE_STEPS } from "../constants/landing";
import { Reveal } from "./shared/reveal";
import { SectionHeading } from "./shared/section-heading";

export function LifecycleSection() {
  return (
    <section id="lifecycle" className="border-t border-border/60 bg-card/30">
      <div className="mx-auto max-w-6xl px-6 py-32">
        <Reveal>
          <SectionHeading
            eyebrow="The Sora Lifecycle"
            title="Streamlined Asset Issuance"
            align="center"
            className="mx-auto"
          />
        </Reveal>

        <div className="relative mt-24 grid gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-6">
          <div
            aria-hidden
            className="absolute top-4 right-0 left-0 hidden h-px bg-border lg:block"
          />
          {LIFECYCLE_STEPS.map(({ number, title, description }, index) => (
            <Reveal
              key={number}
              delay={index * 0.06}
              className="group relative -m-4 rounded-2xl p-4 transition-colors duration-300 hover:bg-card/80"
            >
              <span className="relative z-10 flex size-8 items-center justify-center rounded-full border border-border bg-background font-mono text-xs text-foreground transition-all duration-300 group-hover:scale-110 group-hover:border-secondary group-hover:text-secondary group-hover:shadow-lg group-hover:shadow-secondary/30">
                {number}
              </span>

              <h3 className="mt-4 font-display text-sm font-semibold tracking-tight transition-colors duration-300 group-hover:text-secondary">
                {title}
              </h3>
              <p className="mt-1.5 text-xs text-muted-foreground transition-transform duration-300 group-hover:translate-x-1">
                {description}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
