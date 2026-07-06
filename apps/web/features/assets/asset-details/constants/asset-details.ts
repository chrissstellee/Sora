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
