import { ShieldCheck } from "lucide-react";

import type { IAuthCard, IAuthLink, IAuthNotice, IAuthNoticeItem, IAuthPrompt } from "../types";

export const AUTH_CARD: Record<"login" | "register", IAuthCard> = {
  login: {
    title: "Welcome back to Sora",
    description: "Sign in to manage your organization's tokenized assets and infrastructure.",
  },
  register: {
    title: "Create Account",
    description: "Begin your journey in the RWA frontier with cosmic infrastructure.",
  },
};

export const AUTH_LINKS: IAuthLink[] = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/docs", label: "Documentation" },
];

export const AUTH_FOOTER_VERSION = "1.0.0 (MVP)";

export const AUTH_NOTICE: IAuthNotice = {
  heading: "Enterprise Infrastructure:",
  body: "Sora securely manages tokenized real-world assets on Stellar through enterprise-grade infrastructure designed for organizations and developers.",
};

export const AUTH_NOTICE_ITEMS: IAuthNoticeItem[] = [
  {
    icon: ShieldCheck,
    title: "Enterprise Ready",
    description: "Securely manage tokenized real-world assets on Stellar.",
  },
];

export const AUTH_PROMPT: Record<"login" | "register", IAuthPrompt> = {
  login: {
    prompt: "Don't have an account?",
    action: "Create Account",
  },
  register: {
    prompt: "Already have an account?",
    action: "Log In",
  },
};
