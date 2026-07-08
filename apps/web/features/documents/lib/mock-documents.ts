import type { IDocumentEntry, IDocumentsStats, TDocumentStatus, TDocumentType } from "./types";

const DOCUMENT_TYPES: TDocumentType[] = [
  "Legal Contract",
  "Audit Report",
  "Authentication",
  "Valuation",
  "Insurance",
];

const STATUSES: TDocumentStatus[] = ["Verified", "Pending", "Expired"];

const UPLOADERS = [
  "Marcus Vance",
  "Elena Rodriguez",
  "System (Automated)",
  "Priya Nair",
  "Daniel Cho",
];

const NAME_STEMS = [
  "Title_Deed",
  "Bill_of_Lading",
  "Insurance_Policy",
  "Valuation_Report",
  "Custody_Agreement",
  "Compliance_Cert",
  "Audit_Summary",
  "Ownership_Record",
  "Lease_Agreement",
  "Inspection_Report",
];

const ASSET_PREFIXES = ["RE", "AU", "AR", "FI", "AV", "EN"];

function kindForType(type: TDocumentType): IDocumentEntry["kind"] {
  if (type === "Valuation" || type === "Audit Report") return "spreadsheet";
  if (type === "Authentication") return "image";
  return "pdf";
}

function buildEntry(seed: number, overrides?: Partial<IDocumentEntry>): IDocumentEntry {
  const defaultType = DOCUMENT_TYPES[seed % DOCUMENT_TYPES.length]!;
  const defaultStatus = STATUSES[seed % STATUSES.length]!;
  const defaultUploader = UPLOADERS[seed % UPLOADERS.length]!;
  const stem = NAME_STEMS[seed % NAME_STEMS.length]!;
  const prefix = ASSET_PREFIXES[seed % ASSET_PREFIXES.length]!;

  const type = overrides?.type ?? defaultType;
  const status = overrides?.status ?? defaultStatus;
  const uploader = overrides?.uploadedBy ?? defaultUploader;
  const day = 20 - (seed % 20);

  return {
    id: overrides?.id ?? `DOC-${String(seed).padStart(4, "0")}`,
    name: overrides?.name ?? `${prefix}_SanFran_${stem}_${String(seed).padStart(3, "0")}`,
    kind: overrides?.kind ?? kindForType(type),
    linkedAssetId: overrides?.linkedAssetId ?? `#SORA-${prefix}-${400 + seed}`,
    type,
    uploadedBy: uploader,
    date: overrides?.date ?? `2023-11-${String(day).padStart(2, "0")}`,
    size: overrides?.size ?? `${(1 + ((seed * 7) % 14)).toFixed(1)} MB`,
    status,
    hash:
      overrides?.hash ??
      `0x${(seed * 91173).toString(16).padStart(8, "0")}...${(seed * 331).toString(16).slice(0, 4)}`,
    timestamp:
      overrides?.timestamp ??
      `2023-11-${String(day).padStart(2, "0")} ${String(9 + (seed % 12)).padStart(2, "0")}:${String((seed * 7) % 60).padStart(2, "0")}:01 UTC`,
    ipfsCid:
      overrides?.ipfsCid ??
      `Qm${(seed * 7919).toString(36)}...${(seed * 104729).toString(36).slice(0, 4)}p`,
  };
}

const FEATURED_ENTRIES: IDocumentEntry[] = [
  {
    id: "DOC-0001",
    name: "RE_SanFran_Title_Deed_042",
    kind: "pdf",
    linkedAssetId: "#SORA-RE-442",
    type: "Legal Contract",
    uploadedBy: "Marcus Vance",
    date: "2023-11-24",
    size: "4.2 MB",
    status: "Verified",
    hash: "0x4f2e...9a1c",
    timestamp: "2023-11-24 14:32:01 UTC",
    ipfsCid: "QmXoyp...5pU4p",
  },
  {
    id: "DOC-0002",
    name: "Gold_Reserve_Audit_Q3_2023",
    kind: "spreadsheet",
    linkedAssetId: "#SORA-AU-891",
    type: "Audit Report",
    uploadedBy: "System (Automated)",
    date: "2023-11-23",
    size: "12.8 MB",
    status: "Pending",
    hash: "0x8b7a...2e0f",
    timestamp: "2023-11-23 03:10:44 UTC",
    ipfsCid: "QmT9kf...81nQz",
  },
  {
    id: "DOC-0003",
    name: "Art_Authenticity_Cert_NYC",
    kind: "image",
    linkedAssetId: "#SORA-AR-228",
    type: "Authentication",
    uploadedBy: "Elena Rodriguez",
    date: "2023-11-20",
    size: "1.1 MB",
    status: "Expired",
    hash: "0x1c4d...77ab",
    timestamp: "2023-11-20 11:02:19 UTC",
    ipfsCid: "QmR4vd...93jLm",
  },
];

function generateEntries(count: number): IDocumentEntry[] {
  const entries: IDocumentEntry[] = [];
  for (let i = 0; i < count; i++) {
    entries.push(buildEntry(i + 4));
  }
  return entries;
}

export const MOCK_DOCUMENTS: IDocumentEntry[] = [...FEATURED_ENTRIES, ...generateEntries(58)];

export const MOCK_DOCUMENTS_STATS: IDocumentsStats = {
  storageUsedLabel: "842.5 GB",
  storageUsedPercent: 68,
  totalDocuments: 14293,
  totalDocumentsDelta: "+124 this week",
  recentUploads: 8,
  missingDocuments: 14,
  missingDocumentsCaption: "Verification Required",
};

/** Display-only total shown in the pagination footer, matching the Assets list page's pattern. */
export const MOCK_TOTAL_QUEUED_DOCUMENTS = 1284;
