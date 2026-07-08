"use client";

import * as React from "react";

import { DocumentPreviewSheet } from "./components/document-preview-sheet";
import { DocumentsHeader } from "./components/documents-header";
import { DocumentsStats } from "./components/documents-stats";
import { DocumentsTable } from "./components/documents-table";
import { DocumentsToolbar } from "./components/documents-toolbar";
import { UploadDocumentsDialog } from "./components/upload-documents-dialog";
import { useDocumentFilters } from "./hooks/use-document-filters";
import { useDocumentPreview } from "./hooks/use-document-preview";
import { useDocuments } from "./hooks/use-documents";
import { useUploadDocumentsDialog } from "./hooks/use-upload-documents-dialog";

export function DocumentsPage() {
  const { documents, stats, isLoading } = useDocuments();
  const { filters, setSearch, setType, setStatus, setCountry, filteredDocuments } =
    useDocumentFilters(documents);
  const { open, activeDocument, openPreview, onOpenChange } = useDocumentPreview();
  const {
    open: uploadOpen,
    files,
    openDialog: openUploadDialog,
    onOpenChange: onUploadOpenChange,
    addFiles,
    removeFile,
    reset: resetUpload,
  } = useUploadDocumentsDialog();

  const handleUpload = () => {
    // TODO: wire up to the real upload endpoint once available.
    onUploadOpenChange(false);
    resetUpload();
  };

  const handleExport = React.useCallback(() => {
    // TODO: Wire actual export behavior when backend support is available.
    console.log("Export tokenization queue CSV");
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <DocumentsHeader onUploadClick={openUploadDialog} />

      <DocumentsStats stats={stats} />

      <DocumentsToolbar
        filters={filters}
        onSearchChange={setSearch}
        onTypeChange={setType}
        onStatusChange={setStatus}
        onCountryChange={setCountry}
        onExport={handleExport}
      />

      <DocumentsTable documents={filteredDocuments} isLoading={isLoading} onPreview={openPreview} />

      <DocumentPreviewSheet document={activeDocument} open={open} onOpenChange={onOpenChange} />

      <UploadDocumentsDialog
        open={uploadOpen}
        onOpenChange={onUploadOpenChange}
        files={files}
        onFilesSelected={addFiles}
        onRemoveFile={removeFile}
        onUpload={handleUpload}
      />
    </div>
  );
}
