"use client";

import { UploadCloud } from "lucide-react";
import * as React from "react";

import { cn } from "../../lib/utils";

export interface FileDropzoneProps {
  title?: string;
  description?: React.ReactNode;
  /** Short format labels shown as pills, e.g. ["PDF", "DOCX", "JPG", "PNG"] */
  acceptedFormats?: string[];
  /** Passed straight through to the underlying <input accept> attribute */
  accept?: string;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  className?: string;
}

const DEFAULT_DESCRIPTION = (
  <>
    Drag and drop your files here, or{" "}
    <span className="text-primary underline-offset-2 hover:underline">browse files</span>
  </>
);

export function FileDropzone({
  title = "Upload Documentation",
  description = DEFAULT_DESCRIPTION,
  acceptedFormats,
  accept,
  multiple = true,
  onFilesSelected,
  className,
}: FileDropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = React.useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    onFilesSelected(Array.from(fileList));
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragActive(true);
      }}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragActive(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-background px-6 py-10 text-center transition-colors",
        isDragActive && "border-primary bg-primary/5",
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <UploadCloud className="size-5" />
      </div>

      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>

      {acceptedFormats && acceptedFormats.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {acceptedFormats.map((format) => (
            <span
              key={format}
              className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground uppercase"
            >
              {format}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
