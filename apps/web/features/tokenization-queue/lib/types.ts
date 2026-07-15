import type { TESTNET_UI_LABEL } from "@repo/backend/stellar/config";

export type TIssuanceStatus = "Ready" | "Pending" | "Submitted" | "Confirmed" | "Failed";
export type TIssuanceNetwork = typeof TESTNET_UI_LABEL;
export type TStepState =
  | "Prepared"
  | "Submitted"
  | "Reconciling"
  | "Confirmed"
  | "SafeToRetry"
  | "NeedsReview";

export interface IIssuanceAttempt {
  purpose: "trustline" | "issuance-payment";
  attemptNumber: number;
  state: TStepState;
  sourceAccount: string;
  sequence: string;
  minTime: number;
  maxTime: number;
  hash: string;
  submittedAt?: number;
  confirmedAt?: number;
  ledger?: number;
  ledgerCloseTime?: number;
}

export interface IIssuanceSnapshot {
  issuanceId: string;
  assetId: string;
  assetName: string;
  category: string;
  estimatedValue: string;
  currency: string;
  countryCode: string;
  network: "Testnet";
  status: Exclude<TIssuanceStatus, "Ready">;
  assetVersion: number;
  assetCode: string;
  supply: string;
  internalReference: string;
  issuerAccount: string;
  distributorAccount: string;
  trustlineState: string;
  paymentState: string;
  safeErrorCode?: string;
  attempts: IIssuanceAttempt[];
  trustlineProof: null | {
    type: "verified-existing" | "transaction";
    hash?: string;
    ledger?: number;
    checkedAt?: number;
    limit?: string;
  };
  paymentProof: null | {
    hash: string;
    ledger?: number;
    ledgerCloseTime?: number;
    amount: string;
  };
}

export interface IIssuanceQueueEntry {
  id: string;
  name: string;
  assetId: string;
  assetVersion: number;
  category: string;
  countryCode: string;
  value: number;
  currency: string;
  code: string;
  supply: string;
  status: TIssuanceStatus;
  network: TIssuanceNetwork;
  internalReference: string;
  issuance?: IIssuanceSnapshot;
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

export interface IIssuanceConfiguration {
  network: "Testnet";
  issuerAccount: string;
  distributorAccount: string;
}
