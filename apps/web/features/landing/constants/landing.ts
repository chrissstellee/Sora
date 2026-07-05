import {
  BarChart3,
  Boxes,
  Code2,
  Github,
  Linkedin,
  Lock,
  Network,
  ScrollText,
  ShieldCheck,
  Star,
  Twitter,
  Zap,
} from "lucide-react";

import type {
  ICodeLine,
  IEndpointItem,
  IFeatureCard,
  IFeatureItem,
  IFooterSection,
  ILifecycleStep,
  INavLink,
  ISecurityItem,
  ISocialLink,
  ITrustItem,
  TFooterLinkInput,
} from "../types";

export const NAV_LINKS: INavLink[] = [
  { label: "Problems", href: "#problems" },
  { label: "Features", href: "#features" },
  { label: "Lifecycle", href: "#lifecycle" },
  { label: "Developers", href: "#developers" },
];

export const SIDE_FEATURES: IFeatureCard[] = [
  {
    icon: BarChart3,
    title: "Ownership Registry",
    description: "Manage secondary market transfers and cap tables with institutional precision.",
  },
  {
    icon: Boxes,
    title: "Tokenization Engine",
    description: "Configurable asset issuance logic built specifically for the Stellar network.",
  },
];

export const SMALL_FEATURES: IFeatureItem[] = [
  {
    title: "Asset Management",
    description: "Full lifecycle tracking of digital asset records.",
  },
  {
    title: "Developer APIs",
    description: "RESTful endpoints for seamless platform integration.",
  },
  {
    title: "Activity & Audit Logs",
    description: "Immutable history of every internal platform action.",
  },
  {
    title: "Organization Workspaces",
    description: "Role-based access for complex institutional teams.",
  },
];

export const STATUS_QUO_ITEMS: string[] = [
  "Manual document management taking weeks of legal overhead across siloed databases.",
  "Fragmented ownership registries and custom blockchain logic built from scratch.",
  "Internal review processes that lack a unified infrastructure for asset lifecycle.",
];

export const SORA_WAY_ITEMS: string[] = [
  "Document Management & Enterprise Workflow in a single dashboard.",
  "Stellar Integration engine for seamless digital asset issuance.",
  "Ownership Registry and Activity Logs with institutional precision.",
];

export const ENDPOINTS: IEndpointItem[] = [
  { method: "POST", path: "/assets" },
  { method: "POST", path: "/assets/{id}/tokenize" },
  { method: "GET", path: "/ownership" },
];

export const CODE_LINES: ICodeLine[] = [
  { text: "const Sora = require('@sora/sdk')", tone: "default" },
  { text: "", tone: "default" },
  { text: "/* Initialize Sora Node */", tone: "comment" },
  { text: "const node = new Sora.Node({", tone: "default" },
  { text: "  apiKey: process.env.SORA_API_KEY,", tone: "default" },
  { text: "}).environment('production')", tone: "default" },
  { text: "", tone: "default" },
  { text: "/* Tokenize Prepared Asset */", tone: "comment" },
  { text: "await node.assets.tokenize('asset_82j9d2', {", tone: "default" },
  { text: "  issuer: 'G...73KD',", tone: "default" },
  { text: "  supply: 1000000,", tone: "default" },
  { text: "  details: {", tone: "default" },
  { text: "    type: 'REAL_ESTATE',", tone: "default" },
  { text: "    compliance: 'REG_D_506C'", tone: "default" },
  { text: "  }", tone: "default" },
  { text: "});", tone: "default" },
];

export const SECURITY_ITEMS: ISecurityItem[] = [
  {
    icon: ShieldCheck,
    title: "SOC2 Type II",
    description: "Enterprise-grade security controls verified.",
  },
  {
    icon: Lock,
    title: "RBAC Control",
    description: "Granular permissions for every team member.",
  },
  {
    icon: ScrollText,
    title: "Audit Logs",
    description: "Immutable history of every platform action.",
  },
  {
    icon: Network,
    title: "Stellar Integration",
    description: "Native connectivity to the Stellar network.",
  },
];

export const PRODUCT_LINKS: TFooterLinkInput[] = [
  "Asset Management",
  "Internal Review Workflow",
  "Ownership Registry",
  "Stellar Integration",
];

export const RESOURCE_LINKS: TFooterLinkInput[] = [
  { label: "Documentation", href: "/docs" },
  "API Reference",
  "Legal Frameworks",
  "Security Audit",
];

export const FOOTER_SECTIONS: IFooterSection[] = [
  {
    title: "Product",
    links: PRODUCT_LINKS.map((item) =>
      typeof item === "string" ? { label: item, href: "#" } : item
    ),
  },
  {
    title: "Resources",
    links: RESOURCE_LINKS.map((item) =>
      typeof item === "string" ? { label: item, href: "#" } : item
    ),
  },
];

export const SOCIALS: ISocialLink[] = [
  { icon: Github, label: "GitHub", href: "#" },
  { icon: Twitter, label: "Twitter", href: "#" },
  { icon: Linkedin, label: "LinkedIn", href: "#" },
];

export const TRUST_ITEMS: ITrustItem[] = [
  { icon: Star, label: "Powered by Stellar" },
  { icon: Zap, label: "API-First Infrastructure" },
  { icon: ShieldCheck, label: "Enterprise Ready" },
];

export const LIFECYCLE_STEPS: ILifecycleStep[] = [
  { number: "01", title: "Create Asset", description: "Digital asset record with business info." },
  {
    number: "02",
    title: "Attach Supporting Documents",
    description: "Legal docs, property titles, contracts.",
  },
  {
    number: "03",
    title: "Review & Approve",
    description: "Internal review, validate fields, prepare for issuance.",
  },
  {
    number: "04",
    title: "Configure Digital Asset",
    description: "Asset code, supply, issuer account.",
  },
  {
    number: "05",
    title: "Issue on Stellar",
    description: "Digital asset issuance, transaction details.",
  },
  {
    number: "06",
    title: "Manage & Integrate",
    description: "Ownership records, audit logs, REST APIs.",
  },
];

export const FOOTER_META = {
  badgeLabel: "Built for Developers & Institutions",
  codeIcon: Code2,
};
