"use client";

import * as React from "react";

import type { IIssuanceQueueEntry } from "../lib/types";

interface IUseConfigureAssetDialogResult {
  open: boolean;
  /** The entry being configured, or null when the dialog is in generic/blank mode. */
  activeEntry: IIssuanceQueueEntry | null;
  /** Opens the dialog pre-filled with a specific row's data. */
  openForEntry: (entry: IIssuanceQueueEntry) => void;
  /** Opens the dialog in blank mode for configuring a brand-new digital asset. */
  openBlank: () => void;
  onOpenChange: (open: boolean) => void;
}

export function useConfigureAssetDialog(): IUseConfigureAssetDialogResult {
  const [open, setOpen] = React.useState(false);
  const [activeEntry, setActiveEntry] = React.useState<IIssuanceQueueEntry | null>(null);

  const openForEntry = (entry: IIssuanceQueueEntry) => {
    setActiveEntry(entry);
    setOpen(true);
  };

  const openBlank = () => {
    setActiveEntry(null);
    setOpen(true);
  };

  const onOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      // Clear the active entry after the close animation has a moment to run.
      setTimeout(() => setActiveEntry(null), 150);
    }
  };

  return { open, activeEntry, openForEntry, openBlank, onOpenChange };
}
