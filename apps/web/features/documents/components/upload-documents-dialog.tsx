"use client";

import { FileText, X } from "lucide-react";

import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@repo/ui/components/ui-customs/credenza";
import { FileDropzone } from "@repo/ui/components/ui-customs/file-dropzone";
import { Button } from "@repo/ui/components/ui/button";

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface UploadDocumentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: File[];
  onFilesSelected: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  onUpload: () => void;
}

export function UploadDocumentsDialog({
  open,
  onOpenChange,
  files,
  onFilesSelected,
  onRemoveFile,
  onUpload,
}: UploadDocumentsDialogProps) {
  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent maxWidth="520px">
        <CredenzaHeader>
          <CredenzaTitle>Upload Documents</CredenzaTitle>
          <CredenzaDescription>
            Add verification documents and asset legalities to the registry.
          </CredenzaDescription>
        </CredenzaHeader>

        <CredenzaBody>
          <div className="flex flex-col gap-4">
            <FileDropzone
              acceptedFormats={["PDF", "DOCX", "JPG", "PNG"]}
              onFilesSelected={onFilesSelected}
            />

            {files.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {files.length} {files.length === 1 ? "File" : "Files"} Selected
                </span>
                <ul className="flex flex-col gap-2">
                  {files.map((file, index) => (
                    <li
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-2.5 rounded-md border border-border bg-muted/40 px-3 py-2"
                    >
                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium text-foreground">
                          {file.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${file.name}`}
                        onClick={() => onRemoveFile(index)}
                      >
                        <X />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CredenzaBody>

        <CredenzaFooter className="flex-row justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="gradient" disabled={files.length === 0} onClick={onUpload}>
            Upload {files.length > 0 ? `(${files.length})` : ""}
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
