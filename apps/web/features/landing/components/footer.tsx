import Link from "next/link";

import { APP_NAME } from "@/core/constants";

import { FOOTER_SECTIONS, SOCIALS } from "../constants/landing";

import type { IFooterLink } from "../lib/types";

function renderFooterLink(link: IFooterLink, className: string) {
  if (link.href === "#") {
    return <span className={className}>{link.label}</span>;
  }

  return (
    <Link href={link.href} className={className}>
      {link.label}
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 sm:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <img
                src="/sora-logo.png"
                alt="Sora Logo"
                className="h-12 w-12 rounded-md object-cover"
              />
              <span className="font-display text-3xl font-bold tracking-tight">{APP_NAME}</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Bridging the world&apos;s most valuable assets with the world&apos;s most efficient
              infrastructure.
            </p>
            <div className="mt-6 flex items-center gap-4">
              {SOCIALS.map(({ icon: Icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Icon className="size-4" strokeWidth={1.75} />
                </Link>
              ))}
            </div>
          </div>

          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
                {section.title}
              </p>
              <ul className="mt-4 flex flex-col gap-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {renderFooterLink(
                      link,
                      "text-sm text-muted-foreground transition-colors hover:text-foreground",
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; 2026 Sora Infrastructure. All Rights Reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
