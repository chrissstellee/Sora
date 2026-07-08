import type {
  IHolderEntry,
  IOwnershipStats,
  ITransferFeedEntry,
  THolderType,
  TTrustlineStatus,
} from "./types";

const ASSET_CODES = ["SORA-PRIME", "SOLA-X", "DOTW", "PLH", "ZUR4", "LGB8"];
const ASSET_SUBLABELS: Record<string, string> = {
  "SORA-PRIME": "Prime Real Estate",
  "SOLA-X": "Clean Energy Fund",
  DOTW: "Deed of Title Warehouse",
  PLH: "Pacific Logistics Holdings",
  ZUR4: "Zurich Bond #4",
  LGB8: "London Gold Bullion",
};

const INSTITUTIONAL_INVESTORS = [
  "BlackRock Asset Mgmt.",
  "Global Pension Fund A",
  "Vanguard Structured Credit",
  "Fidelity Digital Assets",
  "Apollo Real Estate Fund",
];

const RETAIL_INVESTORS = [
  "Secondary Market Holder",
  "Individual Wallet Holder",
  "Retail Aggregator Pool",
  "Self-Directed IRA Holder",
  "Community Investor Pool",
];

const TRUSTLINE_STATUSES: TTrustlineStatus[] = ["Authorized", "Frozen", "Unauthorized"];

function randomWallet(seed: number) {
  const prefix = "G" + (seed * 2654435761).toString(36).toUpperCase().slice(0, 4);
  const suffix = (seed * 40503).toString(36).toUpperCase().slice(0, 4);
  return `${prefix}...${suffix}`;
}

function buildHolder(seed: number, overrides?: Partial<IHolderEntry>): IHolderEntry {
  const defaultAssetCode = ASSET_CODES[seed % ASSET_CODES.length]!;
  const defaultTrustlineStatus = TRUSTLINE_STATUSES[seed % TRUSTLINE_STATUSES.length]!;

  const assetCode = overrides?.assetCode ?? defaultAssetCode;
  const holderType: THolderType =
    overrides?.holderType ?? (seed % 3 === 0 ? "Retail" : "Institutional");
  const investorPool = holderType === "Institutional" ? INSTITUTIONAL_INVESTORS : RETAIL_INVESTORS;

  const defaultInvestorName = investorPool[seed % investorPool.length]!;
  const investorName = overrides?.investorName ?? defaultInvestorName;
  const ownershipPercent =
    overrides?.ownershipPercent ?? Number((0.4 + ((seed * 37) % 6500) / 100).toFixed(2));
  const day = 24 - (seed % 20);

  return {
    id: overrides?.id ?? `HLD-${String(seed).padStart(4, "0")}`,
    assetCode,
    assetSubLabel: overrides?.assetSubLabel ?? ASSET_SUBLABELS[assetCode] ?? assetCode,
    investorName,
    holderType,
    stellarWallet: overrides?.stellarWallet ?? randomWallet(seed),
    ownershipPercent,
    tokenBalance:
      overrides?.tokenBalance ?? Number((ownershipPercent * 10000 + seed * 13).toFixed(2)),
    trustlineStatus: overrides?.trustlineStatus ?? defaultTrustlineStatus,
    lastUpdated:
      overrides?.lastUpdated ??
      `2023-11-${String(day).padStart(2, "0")} ${String(9 + (seed % 12)).padStart(2, "0")}:${String((seed * 7) % 60).padStart(2, "0")}:${String((seed * 11) % 60).padStart(2, "0")}`,
  };
}

const FEATURED_HOLDERS: IHolderEntry[] = [
  {
    id: "HLD-0001",
    assetCode: "SORA-PRIME",
    assetSubLabel: "Prime Real Estate",
    investorName: "BlackRock Asset Mgmt.",
    holderType: "Institutional",
    stellarWallet: "GD7R...L209",
    ownershipPercent: 64.0,
    tokenBalance: 640000.0,
    trustlineStatus: "Authorized",
    lastUpdated: "2023-11-24 14:22:01",
  },
  {
    id: "HLD-0002",
    assetCode: "SOLA-X",
    assetSubLabel: "Clean Energy Fund",
    investorName: "Global Pension Fund A",
    holderType: "Institutional",
    stellarWallet: "GB2A...K8P1",
    ownershipPercent: 12.5,
    tokenBalance: 125000.0,
    trustlineStatus: "Authorized",
    lastUpdated: "2023-11-24 13:05:44",
  },
  {
    id: "HLD-0003",
    assetCode: "SORA-PRIME",
    assetSubLabel: "Prime Real Estate",
    investorName: "Secondary Market Holder",
    holderType: "Retail",
    stellarWallet: "GC4W...M9S3",
    ownershipPercent: 2.1,
    tokenBalance: 21000.0,
    trustlineStatus: "Frozen",
    lastUpdated: "2023-11-23 09:12:12",
  },
];

function generateHolders(count: number): IHolderEntry[] {
  const holders: IHolderEntry[] = [];
  for (let i = 0; i < count; i++) {
    holders.push(buildHolder(i + 4));
  }
  return holders;
}

export const MOCK_HOLDERS: IHolderEntry[] = [...FEATURED_HOLDERS, ...generateHolders(58)];

export const MOCK_OWNERSHIP_STATS: IOwnershipStats = {
  totalTokenizedValueLabel: "$1,420,950,200",
  totalTokenizedValueDelta: "+4.2% (30d)",
  totalActiveHolders: 8642,
  totalActiveHoldersCaption: "+12% growth trend",
  transfers24h: 1124,
  transfers24hCaption: "Avg. Latency: 4.2s",
  concentrationAssetLabel: "SORA-PRIME: 64% HELD",
  concentrationCaption: "Whale Wallet Warning",
};

export const MOCK_TRANSFER_FEED: ITransferFeedEntry[] = [
  {
    id: "TXF-0001",
    timestamp: "2023-11-24 16:45:12",
    asset: "DOTW",
    type: "Primary Issuance",
    from: "Sora_Treasury",
    to: "GA4L...X912",
    amountMoved: 50000.0,
    txHash: "8af1...33d2",
  },
  {
    id: "TXF-0002",
    timestamp: "2023-11-24 16:44:05",
    asset: "SORA-PRIME",
    type: "Peer Transfer",
    from: "GB4W...22R4",
    to: "GD2Q...00W1",
    amountMoved: 1240.0,
    txHash: "f2e8...a12c",
  },
  {
    id: "TXF-0003",
    timestamp: "2023-11-24 16:42:58",
    asset: "PLH",
    type: "Clawback",
    from: "GC6K...L890",
    to: "Burn_Address",
    amountMoved: -500.0,
    txHash: "889c...df44",
  },
];

/** Display-only total shown in the pagination footer, matching the other registry pages. */
export const MOCK_TOTAL_HOLDER_ENTITIES = 1284;
