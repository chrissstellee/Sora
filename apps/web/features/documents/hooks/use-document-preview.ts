"use client";

import * as React from "react";

import type { IDocumentEntry } from "../lib/types";

interface IUseDocumentPreviewResult {
  open: boolean;
  activeDocument: IDocumentEntry | null;
  openPreview: (document: IDocumentEntry) => void;
  onOpenChange: (open: boolean) => void;
}

export function useDocumentPreview(): IUseDocumentPreviewResult {
  const [open, setOpen] = React.useState(false);
  const [activeDocument, setActiveDocument] = React.useState<IDocumentEntry | null>(null);

  const openPreview = (document: IDocumentEntry) => {
    setActiveDocument(document);
    setOpen(true);
  };

  const onOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setTimeout(() => setActiveDocument(null), 150);
    }
  };

  return { open, activeDocument, openPreview, onOpenChange };
}
