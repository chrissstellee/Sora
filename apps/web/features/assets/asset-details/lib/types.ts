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

export interface IHolder {
  name: string;
  type: string;
  wallet: string;
  walletFull: string;
  percentage: number;
  balance: string;
  status: string;
}

export interface ITransfer {
  timestamp: string;
  type: string;
  from: string;
  to: string;
  amount: string;
  txHash: string;
}

import * as React from "react";

export interface ITimelineEvent {
  id: string;
  title: string;
  category: "BLOCKCHAIN" | "SYSTEM" | "DOCUMENTS";
  status: "SUCCESS" | "PENDING" | "FAILED";
  description: string;
  date: string;
  time: string;
  icon: React.ElementType;
  blockchainInfo?: {
    txHash: string;
    ledger: string;
    network: string;
    confirmations: string;
  };
}
