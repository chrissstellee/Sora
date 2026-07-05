import {
  Box,
  FilePlus2,
  FileText,
  History,
  KeyRound,
  LayoutDashboard,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  label: string;
  links: NavLink[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Overview",
    links: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Assets", href: "/assets", icon: Box },
    ],
  },
  {
    label: "Tokenization",
    links: [
      { label: "Tokenization Queue", href: "/tokenization-queue", icon: FilePlus2 },
      { label: "Documents", href: "/documents", icon: FileText },
    ],
  },
  {
    label: "Registry",
    links: [
      { label: "Ownership Registry", href: "/ownership-registry", icon: Users },
      { label: "Activity Log", href: "/activity-log", icon: History },
    ],
  },
  {
    label: "Developers",
    links: [{ label: "API Keys", href: "/api-keys", icon: KeyRound }],
  },
];
