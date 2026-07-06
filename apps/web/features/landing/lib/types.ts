import type { LucideIcon } from "lucide-react";

export interface INavLink {
  label: string;
  href: string;
}

export interface IFeatureItem {
  title: string;
  description: string;
}

export interface IFeatureCard extends IFeatureItem {
  icon: LucideIcon;
}

export interface IEndpointItem {
  method: string;
  path: string;
}

export type TCodeTone = "default" | "comment";

export interface ICodeLine {
  text: string;
  tone: TCodeTone;
}

export interface ISecurityItem extends IFeatureItem {
  icon: LucideIcon;
}

export interface IFooterLink {
  label: string;
  href: string;
}

export type TFooterLinkInput = string | IFooterLink;

export interface IFooterSection {
  title: string;
  links: IFooterLink[];
}

export interface ISocialLink extends IFooterLink {
  icon: LucideIcon;
}

export interface ITrustItem {
  icon: LucideIcon;
  label: string;
}

export interface ILifecycleStep {
  number: string;
  title: string;
  description: string;
}
