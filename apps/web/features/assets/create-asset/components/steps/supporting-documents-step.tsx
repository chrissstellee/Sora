import { FileText, Info, Trash2 } from "lucide-react";

import { FileDropzone } from "@repo/ui/components/ui-customs/file-dropzone";
import { Alert, AlertDescription } from "@repo/ui/components/ui/alert";
import { Button } from "@repo/ui/components/ui/button";

import type { IUploadedDocument } from "../../lib/types";

interface SupportingDocumentsStepProps {
  documents: IUploadedDocument[];
  onFilesSelected: (files: File[]) => void;
  onRemoveDocument: (id: string) => void;
}

export function SupportingDocumentsStep({
  documents,
  onFilesSelected,
  onRemoveDocument,
}: SupportingDocumentsStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <Alert className="border-border bg-muted/40">
        <Info className="size-4" />
        <AlertDescription className="text-xs text-muted-foreground">
          Sora securely stores supporting documentation as part of the asset record. Legal
          validation and regulatory compliance remain the responsibility of the issuing
          organization.
        </AlertDescription>
      </Alert>

      <FileDropzone
        acceptedFormats={["PDF", "DOCX", "JPG", "PNG"]}
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        onFilesSelected={onFilesSelected}
      />

      <div>
        <p className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Uploaded Artifacts ({documents.length})
        </p>
        <div className="flex flex-col gap-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 rounded-md border border-border bg-background p-3"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
                <FileText className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{doc.name}</p>
                <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                  {doc.tag}
                </p>
              </div>
              <div className="hidden shrink-0 text-right sm:block">
                <p className="text-xs text-muted-foreground">{doc.sizeLabel}</p>
                <p className="text-[10px] text-muted-foreground">{doc.uploadedAt}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button variant="ghost" size="sm" className="text-xs">
                  Preview
                </Button>
                <Button variant="ghost" size="sm" className="text-xs">
                  Replace
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove document"
                  onClick={() => onRemoveDocument(doc.id)}
                >
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
