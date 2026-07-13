export interface IDashboardStats {
  totalAssets: number;
  totalAssetsDelta: string;
  tokenized: number;
  tokenizedPercent: string;
  totalAssetValue: string;
  totalAssetValueCaption: string;
  queueReady: number;
  apiReqs: string;
  apiHealth: string;
  networkFee: string;
  activeWallets: number;
}

export interface IStellarTransaction {
  txHash: string;
  assetCode: string;
  type: "Asset Issuance" | "Payment" | "Set Trustline";
  fee: string;
  status: "success" | "failed" | "pending";
}

export type TApiMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface IRecentApiCall {
  id: string;
  method: TApiMethod;
  endpoint: string;
  timeAgo: string;
}

export interface IApiPerformanceBar {
  label: string;
  value: number;
}

export interface IAssetValueDataPoint {
  date: string;
  value: number;
}

export interface IPortfolioDistributionItem {
  label: string;
  percent: number;
  color: string;
}

export interface ITokenizationQueueItem {
  id: string;
  name: string;
  valuationLabel: string;
  category: string;
  status: "Issue" | "Review";
}

export interface IWorkspaceHealth {
  apiGateway: "OPERATIONAL" | "DEGRADED" | "DOWN";
  stellarTestnet: "HEALTHY" | "DEGRADED" | "DOWN";
  ledgerSyncLag: string;
}

export interface IDashboardRecentAsset {
  id: string;
  assetId: string;
  name: string;
  class: string;
  valuation: string;
  status: "Tokenized" | "Pending Review" | "Draft";
  icon: "real-estate" | "trade-finance" | "energy";
}

export interface IDashboardData {
  orgName: string;
  stats: IDashboardStats;
  transactions: IStellarTransaction[];
  recentApiCalls: IRecentApiCall[];
  apiPerformanceBars: IApiPerformanceBar[];
  apiAvgLatency: string;
  assetValueOverTime: IAssetValueDataPoint[];
  portfolioDistribution: IPortfolioDistributionItem[];
  tokenizationQueue: ITokenizationQueueItem[];
  workspaceHealth: IWorkspaceHealth;
  recentAssets: IDashboardRecentAsset[];
}
