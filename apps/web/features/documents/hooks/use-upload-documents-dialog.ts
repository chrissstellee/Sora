"use client";

import * as React from "react";

interface IUseUploadDocumentsDialogResult {
  open: boolean;
  files: File[];
  openDialog: () => void;
  onOpenChange: (open: boolean) => void;
  addFiles: (files: File[]) => void;
  removeFile: (index: number) => void;
  reset: () => void;
}

export function useUploadDocumentsDialog(): IUseUploadDocumentsDialogResult {
  const [open, setOpen] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);

  const openDialog = () => setOpen(true);

  const onOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setTimeout(() => setFiles([]), 150);
    }
  };

  const addFiles = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const reset = () => setFiles([]);

  return { open, files, openDialog, onOpenChange, addFiles, removeFile, reset };
}
