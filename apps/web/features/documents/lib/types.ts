export type TDocumentType =
  | "Legal Contract"
  | "Audit Report"
  | "Authentication"
  | "Valuation"
  | "Insurance";

export type TDocumentStatus = "Verified" | "Pending" | "Expired";

export type TDocumentKind = "pdf" | "image" | "spreadsheet" | "other";

export interface IDocumentEntry {
  id: string;
  name: string;
  kind: TDocumentKind;
  linkedAssetId: string;
  type: TDocumentType;
  uploadedBy: string;
  date: string;
  size: string;
  status: TDocumentStatus;
  /** Surfaced in the preview drawer's "Document Identity" section. */
  hash: string;
  timestamp: string;
  ipfsCid: string;
}

export interface IDocumentsStats {
  storageUsedLabel: string;
  storageUsedPercent: number;
  totalDocuments: number;
  totalDocumentsDelta: string;
  recentUploads: number;
  missingDocuments: number;
  missingDocumentsCaption: string;
}
