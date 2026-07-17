import { SpotlightCard } from "@repo/ui/components/ui-customs/spotlight-card";

import { SECURITY_ITEMS } from "../constants/landing";
import { Reveal } from "./shared/reveal";

export function SecuritySection() {
  return (
    <section className="border-t border-border/60 bg-card/30">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="grid grid-cols-2 gap-4">
            {SECURITY_ITEMS.map(({ icon: Icon, title, description }, index) => (
              <Reveal key={title} delay={index * 0.05}>
                <SpotlightCard className="h-full gap-3 p-5">
                  <Icon className="size-5 text-primary" strokeWidth={1.75} />
                  <div>
                    <h3 className="font-display text-sm font-semibold tracking-tight">{title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                  </div>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.15}>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Built for the Most Regulated Markets.
            </h2>
            <p className="mt-4 text-muted-foreground">
              We don&apos;t just move assets; we move legal certainty. Sora is built from the ground
              up to comply with global financial regulations, ensuring your transition to digital
              assets is seamless and risk-mitigated.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
