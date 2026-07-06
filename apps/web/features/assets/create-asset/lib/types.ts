import { TAssetCategory } from "../../lib/types";

export type TCreateAssetStepKey =
  | "basic-information"
  | "ownership-details"
  | "supporting-documents"
  | "review-submit";

export type TDraftStatus = "Draft" | "Ready for Review" | "Submitted";

export interface IBasicInformation {
  assetName: string;
  assetCategory: TAssetCategory | "";
  assetDescription: string;
  estimatedValue: string;
  currency: string;
  country: string;
  physicalAddress: string;
}

export interface IOwnershipDetails {
  legalOwner: string;
  organizationName: string;
  ownershipType: string;
  registrationNumber: string;
  contactEmail: string;
  contactPhone: string;
  internalOwnershipNotes: string;
}

export interface IUploadedDocument {
  id: string;
  name: string;
  sizeLabel: string;
  tag: string;
  uploadedAt: string;
}

export interface ICreateAssetFormState {
  basicInformation: IBasicInformation;
  ownershipDetails: IOwnershipDetails;
  documents: IUploadedDocument[];
}

export interface ICreateAssetStepConfig {
  key: TCreateAssetStepKey;
  label: string;
}
