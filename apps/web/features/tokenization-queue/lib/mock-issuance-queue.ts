import type {
  IIssuanceQueueEntry,
  IRecentActivityEntry,
  IStellarNetworkStatus,
  ITokenizationStats,
} from "./types";

const CATEGORIES = ["Real Estate", "Commodities", "Finance", "Metals", "Aviation", "Energy"];
const STATUSES: IIssuanceQueueEntry["status"][] = ["Ready", "Draft", "Issued", "Failed"];

const NAME_PARTS_A = [
  "Manhattan",
  "Pacific",
  "Zurich",
  "London",
  "Atlas",
  "Meridian",
  "Sunrise",
  "Cascade",
  "Highland",
  "Continental",
  "Northgate",
  "Silverline",
  "Blue Harbor",
  "Ironwood",
  "Cobalt",
];

const NAME_PARTS_B = [
  "Skyline",
  "Freight",
  "Bond",
  "Gold Bullion",
  "Reserve",
  "Terminal",
  "Holdings",
  "Yield Note",
  "Vault",
  "Depot",
  "Fund",
  "Estate",
  "Logistics",
  "Turbine",
  "Refinery",
];

function categoryCode(category: string) {
  switch (category) {
    case "Real Estate":
      return "RE";
    case "Commodities":
      return "RM";
    case "Finance":
      return "FI";
    case "Metals":
      return "PM";
    case "Aviation":
      return "AV";
    case "Energy":
      return "EN";
    default:
      return "GN";
  }
}

function categoryLabel(category: string) {
  switch (category) {
    case "Real Estate":
      return "Real Estate / Property";
    case "Commodities":
      return "Commodities / Freight";
    case "Finance":
      return "Finance / Fixed Income";
    case "Metals":
      return "Metals / Bullion";
    case "Aviation":
      return "Aviation / Fleet";
    case "Energy":
      return "Energy / Infrastructure";
    default:
      return category;
  }
}

function networkForStatus(status: IIssuanceQueueEntry["status"]): IIssuanceQueueEntry["network"] {
  return status === "Draft" ? "TBD" : publicStellarConfig.uiLabel;
}

function buildEntry(
  seed: number,
  overrides: Partial<IIssuanceQueueEntry> & Pick<IIssuanceQueueEntry, "name" | "category">,
): IIssuanceQueueEntry {
  const category = overrides.category;
  const name = overrides.name;
  const code = categoryCode(category);

  const defaultStatus = STATUSES[seed % STATUSES.length]!;
  const status = overrides.status ?? defaultStatus;

  const paddedSeed = String(seed).padStart(4, "0");

  return {
    id: overrides.id ?? `ISQ-${paddedSeed}`,
    name,
    category,
    assetId: overrides.assetId ?? `XL-${code}-${9000 + seed}`,
    value: overrides.value ?? Number((0.3 + ((seed * 37) % 1200) / 100).toFixed(2)),
    code:
      overrides.code ??
      `${name
        .replace(/[^A-Z]/gi, "")
        .slice(0, 3)
        .toUpperCase()}${(seed % 9) + 1}`,
    status,
    network: overrides.network ?? networkForStatus(status),
    internalReference:
      overrides.internalReference ?? `${name.replace(/\s+/g, "-").toUpperCase()}-${code}`,
    assetCategory: overrides.assetCategory ?? categoryLabel(category),
    issuerFacilityId:
      overrides.issuerFacilityId ??
      `STLR-FAC-${90000 + seed}-${String.fromCharCode(65 + (seed % 26))}`,
  };
}

const FEATURED_ENTRIES: IIssuanceQueueEntry[] = [
  {
    id: "ISQ-0001",
    name: "Manhattan Skyline II",
    assetId: "XL-RE-9022",
    category: "Real Estate",
    value: 1.24,
    code: "MNHT2",
    status: "Ready",
    network: publicStellarConfig.uiLabel,
    internalReference: "MANHATTAN-SKYLINE-II-RE",
    assetCategory: "Real Estate / Property",
    issuerFacilityId: "STLR-FAC-99101-A",
  },
  {
    id: "ISQ-0002",
    name: "Pacific Freight VII",
    assetId: "XL-RM-9613",
    category: "Commodities",
    value: 0.45,
    code: "PCF7",
    status: "Draft",
    network: "TBD",
    internalReference: "PACIFIC-FREIGHT-7-COMM",
    assetCategory: "Commodities / Freight",
    issuerFacilityId: "STLR-FAC-99201-B",
  },
  {
    id: "ISQ-0003",
    name: "Zurich Bond #4",
    assetId: "XL-FI-2293",
    category: "Finance",
    value: 2.8,
    code: "ZUR4",
    status: "Issued",
    network: publicStellarConfig.uiLabel,
    internalReference: "ZURICH-BOND-4-FI",
    assetCategory: "Finance / Fixed Income",
    issuerFacilityId: "STLR-FAC-99304-C",
  },
  {
    id: "ISQ-0004",
    name: "London Gold Bullion",
    assetId: "XL-PM-8112",
    category: "Metals",
    value: 12.5,
    code: "LGB8",
    status: "Failed",
    network: publicStellarConfig.uiLabel,
    internalReference: "LONDON-GOLD-BULLION-PM",
    assetCategory: "Metals / Bullion",
    issuerFacilityId: "STLR-FAC-99418-D",
  },
];

function generateEntries(count: number): IIssuanceQueueEntry[] {
  const entries: IIssuanceQueueEntry[] = [];

  for (let i = 0; i < count; i++) {
    const seed = i + 5;
    const nameA = NAME_PARTS_A[seed % NAME_PARTS_A.length]!;
    const nameB = NAME_PARTS_B[(seed * 3) % NAME_PARTS_B.length]!;
    const category = CATEGORIES[seed % CATEGORIES.length]!;

    entries.push(
      buildEntry(seed, {
        name: `${nameA} ${nameB} ${seed % 5 === 0 ? "" : `#${(seed % 9) + 1}`}`.trim(),
        category,
      }),
    );
  }

  return entries;
}

export const MOCK_ISSUANCE_QUEUE: IIssuanceQueueEntry[] = [
  ...FEATURED_ENTRIES,
  ...generateEntries(56),
];

export const MOCK_TOKENIZATION_STATS: ITokenizationStats = {
  readyForTokenization: 24,
  readyEstimatedValueLabel: "+ Estimated Value 21.4M",
  confirmedAssets: 156,
  queueStockLabel: "Queue Stock: Normal",
  issuedToday: 8,
  txVolumeLabel: "TX Volume: 2.1M USD",
  failedIssuance: 2,
  failedCaption: "Requires Re-Validation",
};

export const MOCK_RECENT_ACTIVITY: IRecentActivityEntry[] = [
  {
    id: "act-1",
    type: "success",
    message: `Zurich Bond #4 successfully issued to ${publicStellarConfig.uiLabel}`,
    meta: "3 minutes ago · Block: #92102PL · Fee: 0.0001 XLM",
  },
  {
    id: "act-2",
    type: "info",
    message: "Configuration updated for Manhattan Skyline II",
    meta: "16 minutes ago · Admin: SYS_SORA_01",
  },
  {
    id: "act-3",
    type: "error",
    message: "Issuance failed for London Gold Bullion: Insufficient Fees",
    meta: `42 minutes ago · Network: ${publicStellarConfig.uiLabel}`,
  },
  {
    id: "act-4",
    type: "success",
    message: "Pacific Freight VII draft saved and queued for review",
    meta: "1 hour ago · Admin: SYS_SORA_01",
  },
  {
    id: "act-5",
    type: "info",
    message: "Asset code PCF7 reserved for Pacific Freight VII",
    meta: "1 hour ago · Block: #92098AR",
  },
];

export const MOCK_NETWORK_STATUS: IStellarNetworkStatus = {
  testnetHealth: "OPTIMAL",
  baseFee: "100 Stroops",
  syncProgress: 100.0,
  networkLoadPercent: 2.4,
};

/** Display-only total shown in the pagination footer */
export const MOCK_TOTAL_QUEUED_ENTRIES = 1284;
import { publicStellarConfig } from "@/core/config/env";
