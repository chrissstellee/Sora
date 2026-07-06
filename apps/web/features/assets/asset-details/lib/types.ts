export type TDocumentType = "Legal" | "Financial" | "Technical" | "Compliance" | "Other";

export interface IAssetDocument {
  id: string;
  name: string;
  type: TDocumentType;
  date: string;
  sizeLabel: string;
  uploadedBy: string;
}

export interface IAssetDetailBasicInfo {
  name: string;
  category: string;
  value: string;
  currency: string;
  country: string;
}

export interface IAssetDetailOwnershipInfo {
  legalOwner: string;
  registrationNumber: string;
  ownershipType: string;
  contactEmail: string;
}

export interface IRecentActivity {
  id: string;
  description: string;
  timeAgo: string;
  icon: "created" | "document" | "review" | "issued";
}
