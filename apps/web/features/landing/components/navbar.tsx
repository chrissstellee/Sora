"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

import { APP_NAME } from "@/core/constants";
import { Button } from "@repo/ui/components/ui/button";
import { cn } from "@repo/ui/lib/utils";

import { NAV_LINKS } from "../constants/landing";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <motion.div
        whileHover={{ scale: 1.03 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="flex items-center gap-2"
      >
        <img src="/sora-logo.png" alt="Sora Logo" className="h-8 w-8 rounded-md object-cover" />
        <span className="font-display text-lg font-semibold tracking-tight">{APP_NAME}</span>
      </motion.div>
    </Link>
  );
}

function NavLinks() {
  return (
    <nav className="hidden items-center gap-8 md:flex">
      {NAV_LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="font-mono text-xs tracking-wider text-muted-foreground uppercase transition-colors hover:text-foreground"
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}

function NavActions() {
  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" asChild>
        <Link href="/login">Sign In</Link>
      </Button>
    </div>
  );
}

/** Sticky top navigation bar with scroll-aware border transition. */
export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35 }}
      className={cn(
        "sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md transition-colors duration-300",
        isScrolled ? "border-border/60" : "border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo />
        <NavLinks />
        <NavActions />
      </div>
    </motion.header>
  );
}
