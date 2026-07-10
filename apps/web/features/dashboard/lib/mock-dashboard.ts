import type { IDashboardData } from "./types";

export const MOCK_DASHBOARD_DATA: IDashboardData = {
  orgName: "Acme Holdings",

  stats: {
    totalAssets: 1284,
    totalAssetsDelta: "+13.5%",
    tokenized: 942,
    tokenizedPercent: "73.2% of Portfolio",
    totalAssetValue: "$1.24B",
    totalAssetValueCaption: "Adjusted for current market volatility",
    queueReady: 42,
    apiReqs: "2.4M",
    apiHealth: "99.7% Health",
    networkFee: "0.00001 XLM",
    activeWallets: 16,
  },

  transactions: [
    {
      txHash: "6x4ef2...e321",
      assetCode: "RE_LDN_01",
      type: "Asset Issuance",
      fee: "0.00001",
      status: "success",
    },
    {
      txHash: "8x9c22...f881",
      assetCode: "INV_NY_24",
      type: "Payment",
      fee: "0.00002",
      status: "success",
    },
    {
      txHash: "0x9e10...a422",
      assetCode: "GOLD_BAR",
      type: "Set Trustline",
      fee: "0.00001",
      status: "success",
    },
  ],

  recentApiCalls: [
    {
      id: "api-1",
      method: "GET",
      endpoint: "/v1/assets/token_442",
      timeAgo: "2s ago",
    },
    {
      id: "api-2",
      method: "POST",
      endpoint: "/v1/mint/execute",
      timeAgo: "9s ago",
    },
    {
      id: "api-3",
      method: "GET",
      endpoint: "/v1/stats/daily",
      timeAgo: "31s ago",
    },
  ],

  apiPerformanceBars: [
    { label: "Mon", value: 55 },
    { label: "Tue", value: 72 },
    { label: "Wed", value: 60 },
    { label: "Thu", value: 85 },
    { label: "Fri", value: 70 },
    { label: "Sat", value: 45 },
    { label: "Sun", value: 90 },
  ],

  apiAvgLatency: "89.3ms",

  assetValueOverTime: [
    { date: "Jan 01", value: 820 },
    { date: "Jan 08", value: 850 },
    { date: "Jan 15", value: 870 },
    { date: "Jan 22", value: 900 },
    { date: "Jan 31", value: 950 },
    { date: "Feb 07", value: 1020 },
    { date: "Feb 14", value: 1240 },
  ],

  portfolioDistribution: [
    { label: "Real Estate", percent: 75, color: "var(--chart-2)" },
    { label: "Financials", percent: 15, color: "var(--chart-1)" },
    { label: "Equities", percent: 10, color: "var(--chart-3)" },
  ],

  tokenizationQueue: [
    {
      id: "tq-1",
      name: "Luxury Lofts - Block A",
      valuationLabel: "$4.2M Valuation · Real Estate",
      category: "Real Estate",
      status: "Issue",
    },
    {
      id: "tq-2",
      name: "Invoice Bundle #441",
      valuationLabel: "$530k Valuation · Finance",
      category: "Finance",
      status: "Issue",
    },
  ],

  workspaceHealth: {
    apiGateway: "OPERATIONAL",
    stellarMainnet: "HEALTHY",
    ledgerSyncLag: "0.8s",
  },

  recentAssets: [
    {
      id: "asset-1",
      assetId: "ID: MHB-2318-NY",
      name: "Manhattan Heights Bond",
      class: "Real Estate",
      valuation: "$240,000,000",
      status: "Tokenized",
      icon: "real-estate",
    },
    {
      id: "asset-2",
      assetId: "ID: GFR-994-B",
      name: "Global Freight Receivables",
      class: "Trade Finance",
      valuation: "$12,450,000",
      status: "Pending Review",
      icon: "trade-finance",
    },
    {
      id: "asset-3",
      assetId: "ID: SFE-T1-44",
      name: "Solar Farm Equity - Tier 1",
      class: "Renewable Energy",
      valuation: "$85,000,000",
      status: "Tokenized",
      icon: "energy",
    },
  ],
};
