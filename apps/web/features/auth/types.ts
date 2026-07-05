import type { LucideIcon } from "lucide-react";

export interface IAuthLink {
  href: string;
  label: string;
}

export interface IAuthCard {
  title: string;
  description: string;
}

export interface IAuthFieldContent {
  label: string;
  placeholder: string;
  type?: string;
}

export interface IAuthNotice {
  heading: string;
  body: string;
}

export interface IAuthPrompt {
  prompt: string;
  action: string;
}

export interface IAuthNoticeItem {
  icon: LucideIcon;
  title: string;
  description: string;
}
