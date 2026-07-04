import { ArrowRight } from "lucide-react";

import { Button } from "@repo/ui/components/ui/button";

import { Reveal } from "./shared/reveal";

export function CtaSection() {
  return (
    <section className="relative overflow-hidden px-6 py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-112 w-3xl -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[120px]"
      />

      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Ready to Tokenize Your First Asset?
        </h2>
        <p className="mt-4 text-muted-foreground">
          Join leading financial institutions in the future of asset management. Scalable, secure,
          and ready for deployment.
        </p>
        <Button variant="gradient" size="lg" className="mt-8">
          Launch Platform Now
          <ArrowRight />
        </Button>
      </Reveal>
    </section>
  );
}
