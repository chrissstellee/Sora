export type TIssuanceStatus = "Ready" | "Draft" | "Issued" | "Failed";

export type TIssuanceNetwork = typeof TESTNET_UI_LABEL | "TBD";

export interface IIssuanceQueueEntry {
  id: string;
  name: string;
  assetId: string;
  category: string;
  /** Value in millions of USD. */
  value: number;
  code: string;
  status: TIssuanceStatus;
  network: TIssuanceNetwork;
  /** Metadata surfaced in the "01 · Metadata Verification" section of the configure dialog. */
  internalReference: string;
  assetCategory: string;
  issuerFacilityId: string;
  /** Pre-fills the blockchain params step when re-opening a configured/failed asset. */
  blockchainParams?: IBlockchainParams;
}

export type TActivityType = "success" | "info" | "error";

export interface IRecentActivityEntry {
  id: string;
  type: TActivityType;
  message: string;
  meta: string;
}

export interface IStellarNetworkStatus {
  testnetHealth: "OPTIMAL" | "DEGRADED" | "DOWN";
  baseFee: string;
  syncProgress: number;
  networkLoadPercent: number;
}

export interface ITokenizationStats {
  readyForTokenization: number;
  readyEstimatedValueLabel: string;
  confirmedAssets: number;
  queueStockLabel: string;
  issuedToday: number;
  txVolumeLabel: string;
  failedIssuance: number;
  failedCaption: string;
}

export interface IBlockchainParams {
  assetCode: string;
  decimals: string;
  totalSupply: string;
}
import type { TESTNET_UI_LABEL } from "@repo/backend/stellar/config";
