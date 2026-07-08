import { FileText } from "lucide-react";
import * as React from "react";

import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/ui/sheet";

import type { IDocumentEntry, TDocumentStatus } from "../lib/types";

const STATUS_BADGE_VARIANT: Record<TDocumentStatus, "success" | "info" | "error"> = {
  Verified: "success",
  Pending: "info",
  Expired: "error",
};

interface DocumentPreviewSheetProps {
  document: IDocumentEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function InfoTile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
      <span className="block font-mono text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">{children}</span>
    </div>
  );
}

export function DocumentPreviewSheet({ document, open, onOpenChange }: DocumentPreviewSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 overflow-y-auto p-0">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Preview</SheetTitle>
          <SheetDescription>{document?.name ?? "Document Name"}</SheetDescription>
        </SheetHeader>

        {document && (
          <div className="flex flex-1 flex-col gap-6 p-4">
            <button
              type="button"
              className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-muted/30 py-16 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <FileText className="size-8" />
              <span className="text-xs">Click to view full screen</span>
            </button>

            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold tracking-wider text-secondary uppercase">
                Document Identity
              </h3>
              <span className="text-base font-semibold text-foreground">{document.name}</span>
              <span className="font-mono text-xs text-muted-foreground">Hash: {document.hash}</span>
            </section>

            <div className="grid grid-cols-2 gap-2">
              <InfoTile label="Type">{document.type}</InfoTile>
              <InfoTile label="Status">
                <Badge variant={STATUS_BADGE_VARIANT[document.status]} className="uppercase">
                  {document.status}
                </Badge>
              </InfoTile>
            </div>

            <section className="rounded-md border border-border bg-muted/30 p-3">
              <h3 className="mb-2 text-xs font-semibold tracking-wider text-secondary uppercase">
                Metadata Provenance
              </h3>
              <dl className="flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Uploaded By</dt>
                  <dd className="text-foreground">{document.uploadedBy}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Timestamp</dt>
                  <dd className="text-foreground">{document.timestamp}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">IPFS CID</dt>
                  <dd className="font-mono text-foreground">{document.ipfsCid}</dd>
                </div>
              </dl>
            </section>
          </div>
        )}

        <SheetFooter className="border-t border-border">
          <Button variant="gradient" className="w-full">
            Download PDF
          </Button>
          <Button variant="outline" className="w-full">
            Replace Document
          </Button>
          <Button
            variant="outline"
            className="w-full border-error/40 text-error hover:bg-error/10 hover:text-error"
          >
            Delete From Registry
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
