import { ArrowRight } from "lucide-react";

import { Button } from "@repo/ui/components/ui/button";

import { Reveal } from "./shared/reveal";

export function CtaSection() {
  return (
    <section className="relative overflow-hidden px-6 py-28">
      {/* ambient glow, two offset layers for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-112 w-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-primary/15 blur-[120px] [animation-duration:6s]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-48 w-48 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-primary/30 blur-[80px] [animation-delay:1.5s] [animation-duration:6s]"
      />
      {/* ledger grid, fades toward the edges */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] mask-[radial-gradient(ellipse_65%_65%_at_50%_50%,black,transparent)] bg-size-[56px_56px] opacity-[0.15]"
      />

      <Reveal className="relative mx-auto max-w-2xl rounded-3xl border border-border/50 bg-linear-to-b from-background/80 to-background/40 px-8 py-14 text-center shadow-2xl shadow-primary/10 backdrop-blur-sm sm:px-14">
        {/* corner ticks, gives the card a "instrument panel" feel */}
        <span
          aria-hidden
          className="absolute top-4 left-4 h-3 w-3 border-t border-l border-primary/40"
        />
        <span
          aria-hidden
          className="absolute top-4 right-4 h-3 w-3 border-t border-r border-primary/40"
        />
        <span
          aria-hidden
          className="absolute bottom-4 left-4 h-3 w-3 border-b border-l border-primary/40"
        />
        <span
          aria-hidden
          className="absolute right-4 bottom-4 h-3 w-3 border-r border-b border-primary/40"
        />

        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          Onboarding institutional partners
        </span>

        <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Ready to Tokenize Your First Asset?
        </h2>
        <p className="mt-4 text-muted-foreground">
          Join leading financial institutions in the future of asset management. Scalable, secure,
          and ready for deployment.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button variant="gradient" size="lg" className="group w-full sm:w-auto">
            Launch Platform Now
            <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
