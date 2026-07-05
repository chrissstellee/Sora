import Link from "next/link";

const VERSION = "1.0.0 (MVP)";

const links = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/docs", label: "Documentation" },
];

export function AuthFooter() {
  return (
    <footer className="mt-10 flex flex-col items-center gap-3 text-center">
      <nav className="flex items-center gap-6">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <p className="font-mono text-xs text-muted-foreground/60">Version {VERSION}</p>
    </footer>
  );
}
