import Link from "next/link";

import { AUTH_FOOTER_VERSION, AUTH_LINKS } from "../constants/auth";

export function AuthFooter() {
  return (
    <footer className="mt-10 flex flex-col items-center gap-3 text-center">
      <nav className="flex items-center gap-6">
        {AUTH_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <p className="font-mono text-xs text-muted-foreground/60">Version {AUTH_FOOTER_VERSION}</p>
    </footer>
  );
}
