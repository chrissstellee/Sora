import { Button } from "@repo/ui/components/ui/button";
import { Card } from "@repo/ui/components/ui/card";

import { CODE_LINES, ENDPOINTS } from "../constants/landing";
import { Reveal } from "./shared/reveal";
import { SectionHeading } from "./shared/section-heading";

export function DevelopersSection() {
  return (
    <section id="developers" className="mx-auto max-w-6xl px-6 py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <SectionHeading
            eyebrow="Developer Experience"
            title="Built for developers, trusted by institutions."
            description="Developers don't need to build the registry or tokenization logic from scratch. Integrate Sora directly into your existing fintech stack with our RESTful APIs and SDKs."
          />

          <ul className="mt-6 flex flex-col gap-2">
            {ENDPOINTS.map((endpoint) => (
              <li
                key={endpoint.path}
                className="flex items-center gap-3 font-mono text-sm text-muted-foreground"
              >
                <span className="rounded border border-border bg-card px-1.5 py-0.5 text-[11px] text-secondary">
                  {endpoint.method}
                </span>
                {endpoint.path}
              </li>
            ))}
          </ul>

          <Button variant="outlineSecondary" className="mt-8">
            Explore API Documentation
          </Button>
        </Reveal>

        <Reveal delay={0.1}>
          <Card className="gap-0 overflow-hidden p-0 font-mono">
            <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
              <span className="size-2.5 rounded-full bg-destructive/70" />
              <span className="size-2.5 rounded-full bg-secondary/70" />
              <span className="size-2.5 rounded-full bg-success/70" />
              <span className="ml-3 text-xs text-muted-foreground">issue_asset.js</span>
            </div>
            <pre className="overflow-x-auto p-5 text-[13px] leading-6">
              <code>
                {CODE_LINES.map((line, index) => (
                  <div
                    key={index}
                    className={
                      line.tone === "comment" ? "text-muted-foreground/70" : "text-foreground/90"
                    }
                  >
                    {line.text || "\u00A0"}
                  </div>
                ))}
              </code>
            </pre>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}
