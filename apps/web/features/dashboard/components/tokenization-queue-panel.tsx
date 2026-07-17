import Link from "next/link";

import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";

import { TOKENIZATION_STATUS_BADGE_VARIANT } from "../constants/dashboard";

import type { ITokenizationQueueItem } from "../lib/types";

export function TokenizationQueuePanel({ items }: { items: ITokenizationQueueItem[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-mono text-sm font-semibold tracking-wider text-soft-primary uppercase">
            Tokenization Queue
          </CardTitle>
          <Button variant="outlineSecondary" size="xs" asChild>
            <Link href="/tokenization-queue">Action Required</Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/30 px-4 py-3"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-foreground">{item.name}</span>
              <span className="text-xs text-muted-foreground">{item.valuationLabel}</span>
            </div>
            <Badge
              variant={TOKENIZATION_STATUS_BADGE_VARIANT[item.status]}
              className="shrink-0 uppercase"
            >
              {item.status}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
