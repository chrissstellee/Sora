"use client";

import { ArrowUpRight, BookOpen, ChevronDown, FileJson } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Badge } from "@repo/ui/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { cn } from "@repo/ui/lib/utils";

import {
  MOCK_ENDPOINT_CATEGORIES,
  MOCK_ENDPOINT_GROUPS,
  TOKENIZATION_CURL_SNIPPET,
  TOKENIZATION_REQUEST_SAMPLE,
} from "../../lib/mock-developers";

import type { IApiEndpoint, IApiEndpointGroup, TApiMethod } from "../../lib/types";

const METHOD_BADGE_VARIANT: Record<TApiMethod, "default" | "secondary" | "outline" | "gray"> = {
  POST: "default",
  GET: "secondary",
  PUT: "outline",
  DELETE: "gray",
};

function EndpointRow({ endpoint }: { endpoint: IApiEndpoint }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border py-3 last:border-b-0 sm:flex-row sm:items-center sm:gap-3">
      <div className="flex items-center gap-2">
        <Badge variant={METHOD_BADGE_VARIANT[endpoint.method]} className="w-16 justify-center">
          {endpoint.method}
        </Badge>
        <span className="font-mono text-xs text-foreground">{endpoint.path}</span>
      </div>
      <span className="text-xs text-muted-foreground sm:ml-2">{endpoint.description}</span>
    </div>
  );
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
        {title}
      </span>
      <pre className="overflow-x-auto rounded-md border border-border bg-background p-3 font-mono text-[11px] leading-relaxed text-foreground">
        {code}
      </pre>
    </div>
  );
}

function EndpointExplorerSection({ group }: { group: IApiEndpointGroup }) {
  const [open, setOpen] = React.useState(Boolean(group.defaultOpen));

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-6 py-0 text-left"
      >
        <span className="text-sm font-semibold text-foreground">{group.title}</span>
        <ChevronDown
          className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <CardContent className="border-t border-border pb-4">
          <div className="flex flex-col">
            {group.endpoints.map((endpoint) => (
              <EndpointRow key={endpoint.id} endpoint={endpoint} />
            ))}
          </div>

          {group.id === "tokenization-api" && (
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <CodeBlock title="Request Sample" code={TOKENIZATION_REQUEST_SAMPLE} />
              <CodeBlock title="cURL Snippet" code={TOKENIZATION_CURL_SNIPPET} />
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function ApiReferenceTab() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-sm font-semibold tracking-wider text-soft-primary uppercase">
            REST API Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Sora abstracts the underlying complexity of the Stellar network behind business-friendly
            REST APIs, letting you integrate real-world assets into your applications without
            needing deep blockchain expertise.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {MOCK_ENDPOINT_CATEGORIES.map((category) => (
          <Card key={category.id} className="gap-1 py-4">
            <div className="flex flex-col gap-1 px-5">
              <span className="text-sm font-semibold text-soft-primary">{category.label}</span>
              <span className="font-mono text-xs text-muted-foreground">
                {category.endpointCount} endpoints
              </span>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-6">
        <h2 className="font-mono text-lg font-semibold tracking-wider text-foreground uppercase">
          Endpoint Explorer
        </h2>
        {MOCK_ENDPOINT_GROUPS.map((group) => (
          <EndpointExplorerSection key={group.id} group={group} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-sm font-semibold tracking-wider text-soft-primary uppercase">
            Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            All API requests must include your secret key in the Authorization header using the
            Bearer token pattern.
          </p>
          <pre className="overflow-x-auto rounded-md border border-border bg-background p-3 font-mono text-xs text-foreground">
            Authorization: Bearer &lt;YOUR_API_KEY&gt;
          </pre>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="#"
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
            <BookOpen className="size-4" />
          </div>
          <span className="flex-1 text-sm font-medium text-foreground">Full API Documentation</span>
          <ArrowUpRight className="size-4 text-muted-foreground" />
        </Link>

        <Link
          href="#"
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
            <FileJson className="size-4" />
          </div>
          <span className="flex-1 text-sm font-medium text-foreground">Postman Collection</span>
          <ArrowUpRight className="size-4 text-muted-foreground" />
        </Link>
      </div>
    </div>
  );
}
