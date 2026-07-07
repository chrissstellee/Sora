import { ArrowUpRight, CheckCircle2, Clock, FileText } from "lucide-react";

import type { TDocumentType } from "../lib/types";

export const STATUS_BADGE_VARIANT = {
  Tokenized: "secondary",
  Review: "default",
  Draft: "gray",
} as const;

export const TABS = [
  { value: "documents", label: "Documents" },
  { value: "tokenization", label: "Tokenization" },
  { value: "ownership", label: "Ownership" },
  { value: "activity", label: "Activity" },
] as const;

export const DOC_TYPE_CLASS: Record<TDocumentType, string> = {
  Legal: "text-primary bg-primary/10",
  Financial: "text-secondary bg-secondary/10",
  Technical: "text-info bg-info/10",
  Compliance: "text-warning bg-warning/10",
  Other: "text-muted-foreground bg-muted",
};

export const ACTIVITY_ICON = {
  created: CheckCircle2,
  document: FileText,
  review: Clock,
  issued: ArrowUpRight,
};

export const HOLDER_TYPES = [
  { value: "all", label: "All" },
  { value: "institutional", label: "Institutional" },
  { value: "retail", label: "Retail" },
  { value: "corporate", label: "Corporate" },
] as const;

export const CATEGORY_COLORS = {
  BLOCKCHAIN: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  SYSTEM: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  DOCUMENTS: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
} as const;

export const LIFECYCLE_CHECKPOINTS = [
  { label: "Asset Created", completed: true },
  { label: "Ownership Information", completed: true },
  { label: "Supporting Documents", completed: true },
  { label: "Ready for Tokenization", completed: true },
  { label: "Issued on Stellar", completed: true },
  { label: "Active", completed: true },
] as const;
