"use client";

import { Bell, HelpCircle, Search } from "lucide-react";

import { publicStellarConfig } from "@/core/config/env";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { SidebarTrigger } from "@repo/ui/components/ui/sidebar";

export function Topbar() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-6 backdrop-blur-md">
      <SidebarTrigger className="md:hidden" />

      <div className="ml-auto flex items-center gap-3">
        <span className="rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning">
          Demo Data
        </span>
        <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-soft-primary">
          {publicStellarConfig.uiLabel}
        </span>
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search hash, asset, address..."
            className="h-10 rounded-full bg-card pl-9"
          />
        </div>

        <Button variant="ghost" size="icon-sm" aria-label="Notifications">
          <Bell className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Help">
          <HelpCircle className="size-4" />
        </Button>
        <button className="size-8 shrink-0 overflow-hidden rounded-full border border-border">
          <img src="/sora-og-image.png" alt="Account" className="size-full object-cover" />
        </button>
      </div>
    </header>
  );
}
