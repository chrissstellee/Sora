export type THolderType = "Institutional" | "Retail";

export type TTrustlineStatus = "Authorized" | "Frozen" | "Unauthorized";

export type TTransferType = "Primary Issuance" | "Peer Transfer" | "Clawback";

export interface IHolderEntry {
  id: string;
  assetCode: string;
  assetSubLabel: string;
  investorName: string;
  holderType: THolderType;
  stellarWallet: string;
  ownershipPercent: number;
  tokenBalance: number;
  trustlineStatus: TTrustlineStatus;
  lastUpdated: string;
}

export interface ITransferFeedEntry {
  id: string;
  timestamp: string;
  asset: string;
  type: TTransferType;
  from: string;
  to: string;
  amountMoved: number;
  txHash: string;
}

export interface IOwnershipStats {
  totalTokenizedValueLabel: string;
  totalTokenizedValueDelta: string;
  totalActiveHolders: number;
  totalActiveHoldersCaption: string;
  transfers24h: number;
  transfers24hCaption: string;
  concentrationAssetLabel: string;
  concentrationCaption: string;
}
