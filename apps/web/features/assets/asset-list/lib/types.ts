import { TAssetCategory } from "../../lib/types";

export type TAssetStatus = "Tokenized" | "Review" | "Draft";

export type TBlockchainStatus = "Issued" | "Ready" | "Not Issued";

export type TLifecycleStepKey = "create" | "docs" | "review" | "issued" | "active";

export interface ILifecycleStep {
  key: TLifecycleStepKey;
  label: string;
}

export interface IAssetLifecycle {
  /** Key of the step the asset currently sits at */
  currentStep: TLifecycleStepKey;
  /** Completion date (display string) for each step that has been reached */
  completedAt: Partial<Record<TLifecycleStepKey, string>>;
}

export interface IBlockchainInfo {
  assetCode: string;
  network: string;
  issuerId: string;
}

export interface IAsset {
  id: string;
  assetId: string;
  name: string;
  type: TAssetCategory;
  owner: string;
  estValue: number; // in millions
  country: string;
  status: TAssetStatus;
  blockchain: TBlockchainStatus;
  lifecycle: IAssetLifecycle;
  blockchainInfo: IBlockchainInfo;
}

export interface IAssetStats {
  totalAssets: number;
  totalAssetsDelta: string;
  draft: number;
  ready: number;
  tokenized: number;
  archived: number;
  totalValueLabel: string;
}
