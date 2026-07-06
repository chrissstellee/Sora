import * as React from "react";

import { cn } from "../../lib/utils";

// ---------------------------------------------------------------------------
// PageBreadcrumb — simple ordered list of crumbs rendered above the title.
// Pass plain strings for non-linked crumbs, or wrap in an <a>/Link for links.
// ---------------------------------------------------------------------------

export interface PageBreadcrumbItem {
  label: React.ReactNode;
  href?: string;
}

interface PageBreadcrumbProps {
  items: PageBreadcrumbItem[];
  className?: string;
}

function PageBreadcrumb({ items, className }: PageBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1.5 text-sm", className)}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-1.5">
              <span
                className={cn(
                  isLast
                    ? "font-medium text-foreground"
                    : "text-muted-foreground transition-colors hover:text-foreground",
                )}
              >
                {item.label}
              </span>
              {!isLast && (
                <span className="text-muted-foreground/50" aria-hidden="true">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// PageHeader — the main component
// ---------------------------------------------------------------------------

export interface PageHeaderProps {
  /** Breadcrumb items rendered above the title. */
  breadcrumbs?: PageBreadcrumbItem[];
  /** Main page title — rendered as an <h1>. */
  title: string;
  /** Optional subtitle / description below the title. */
  description?: string;
  /** Optional slot for action buttons (rendered to the right of the title row). */
  actions?: React.ReactNode;
  /** Extra Tailwind classes for the root wrapper. */
  className?: string;
}

export function PageHeader({
  breadcrumbs,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-2 flex flex-col gap-4", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && <PageBreadcrumb items={breadcrumbs} />}

      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>

        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
