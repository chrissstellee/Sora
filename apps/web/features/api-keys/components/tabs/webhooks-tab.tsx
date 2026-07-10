"use client";

import { ShieldCheck, Webhook } from "lucide-react";

import { DataTable } from "@repo/ui/components/ui-customs/data-table";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";

import { DELIVERY_COLUMNS } from "../../constants/delivery-columns";
import { WEBHOOK_COLUMNS } from "../../constants/webhook-columns";
import { useWebhooks } from "../../hooks/use-webhooks";

const PAYLOAD_EXAMPLE = `{
  "id": "evt_9823a1",
  "object": "event",
  "type": "asset.issued",
  "created": 1730217923,
  "data": {
    "asset_id": "AST-9921",
    "amount": "1000000",
    "currency": "USD",
    "owner": "sa_0x82..."
  },
  "signature": "sora_sig_af0n..."
}`;

const SECURITY_TIPS = [
  "Verify the payload using the HMAC SHA-256 algorithm.",
  "Use the unique signing secret provided for each endpoint.",
  "Prevent replay attacks by checking the timestamp on the payload.",
];

export function WebhooksTab() {
  const { webhooks, eventTypes, recentDeliveries, isLoading } = useWebhooks();

  return (
    <div className="flex flex-col gap-6">
      <Card variant="accented">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle className="font-mono text-sm font-semibold tracking-wider text-secondary uppercase">
                Webhook Endpoints
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Configure URLs to receive real-time notifications when events occur in your Sora
                account.
              </p>
            </div>
            <Button variant="gradient" className="gap-1.5">
              <Webhook className="size-3.5" />
              Create Webhook
            </Button>
          </div>
        </CardHeader>

        <CardContent className="min-w-0 px-0">
          <DataTable
            columns={WEBHOOK_COLUMNS}
            data={webhooks}
            rowKey={(row) => row.id}
            itemLabel="webhooks"
            emptyMessage="No webhook endpoints configured."
            isLoading={isLoading}
            showPagination={false}
            containerClassName="min-w-0 rounded-none border-0"
            maxHeight="400px"
          />
        </CardContent>
      </Card>

      <div className="mt-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-mono text-lg font-semibold tracking-wider text-foreground uppercase">
            Available Event Types
          </h2>
          <p className="text-xs text-muted-foreground">
            Select specific events to trigger your webhook notifications.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {eventTypes.map((category) => (
            <Card key={category.id} className="gap-1 py-4">
              <div className="flex flex-col gap-1 px-5">
                <span className="text-sm font-semibold text-soft-primary">{category.label}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {category.eventCount} events
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card className="min-w-0 gap-4 py-5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-mono text-sm font-semibold tracking-wide text-secondary uppercase">
              Recent Deliveries
            </CardTitle>
            <Button variant="ghost" size="sm" className="gap-1 text-xs text-primary">
              View Delivery Log
            </Button>
          </div>
        </CardHeader>

        <CardContent className="min-w-0 px-0">
          <DataTable
            columns={DELIVERY_COLUMNS}
            data={recentDeliveries}
            rowKey={(row) => row.id}
            itemLabel="deliveries"
            emptyMessage="No deliveries yet."
            isLoading={isLoading}
            showPagination={false}
            maxHeight="400px"
            containerClassName="min-w-0 rounded-none border-0"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-sm font-semibold tracking-wider text-soft-primary uppercase">
              Webhook Payload Example
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-md border border-border bg-background p-3 font-mono text-[11px] leading-relaxed text-foreground">
              {PAYLOAD_EXAMPLE}
            </pre>
          </CardContent>
        </Card>

        <Card className="flex justify-between">
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-3 font-mono text-xl font-semibold tracking-wider text-foreground uppercase">
              <ShieldCheck className="size-8 rounded-md bg-secondary/20 p-1 text-secondary" />
              Webhook Security
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="mb-2 text-sm text-muted-foreground">
              Sora ensures every webhook payload is authentic and untampered with via cryptographic
              signatures.
            </p>
            <ul className="flex flex-col gap-4">
              {SECURITY_TIPS.map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-sm text-foreground">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-secondary" />
                  {tip}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="mt-2 w-full">
              Review Documentation
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
