import type { IAsset, IAssetStats, TAssetType } from "./types";

const TYPES: TAssetType[] = ["Real Estate", "Aviation", "Energy", "Maritime"];
const STATUSES: IAsset["status"][] = ["Tokenized", "Review", "Draft"];
const BLOCKCHAIN_STATES: IAsset["blockchain"][] = ["Issued", "Ready", "Not Issued"];
const COUNTRIES = ["United States", "United Kingdom", "Singapore", "UAE", "Germany"];

const BUILDING_NAMES = [
  "Harbor View Tower",
  "Meridian Business Park",
  "Cascade Logistics Hub",
  "Amber Ridge Apartments",
];
const AIRCRAFT_NAMES = ["737 MAX Fleet", "E195-E2 Regional Fleet", "A350 Widebody Pair"];
const ENERGY_NAMES = ["Windridge Farm II", "Desert Sun Array"];
const MARITIME_NAMES = ["M.V. Coral Horizon", "S.S. Nordic Star"];

const OWNERS = [
  "Global Equity Fund",
  "Apex Leasing",
  "Horizon Power",
  "Pacific Trans",
  "Ironwood Capital",
  "Meridian Partners",
  "Blue Harbor Holdings",
  "Northstar Infrastructure",
];

function nameForType(type: TAssetType, seed: number) {
  const pool =
    type === "Real Estate"
      ? BUILDING_NAMES
      : type === "Aviation"
        ? AIRCRAFT_NAMES
        : type === "Energy"
          ? ENERGY_NAMES
          : MARITIME_NAMES;
  return pool[seed % pool.length]!;
}

function prefixForType(type: TAssetType) {
  return type === "Real Estate"
    ? "LON"
    : type === "Aviation"
      ? "AIR"
      : type === "Energy"
        ? "NRG"
        : "MAR";
}

/** Builds the lifecycle + blockchain-info payload for a row from its status. */
function lifecycleFor(
  status: IAsset["status"],
  seed: number,
): Pick<IAsset, "lifecycle" | "blockchainInfo"> {
  const assetCode = `SKY-${String(seed).padStart(3, "0")}`;

  if (status === "Tokenized") {
    return {
      lifecycle: {
        currentStep: "active",
        completedAt: {
          create: "Dec 12, 2023",
          docs: "Dec 14, 2023",
          review: "Dec 20, 2023",
          issued: "Jan 04, 2024",
        },
      },
      blockchainInfo: { assetCode, network: "Stellar Mainnet", issuerId: "GCSA...992L" },
    };
  }

  if (status === "Review") {
    return {
      lifecycle: {
        currentStep: "review",
        completedAt: { create: "Feb 02, 2024", docs: "Feb 06, 2024" },
      },
      blockchainInfo: { assetCode, network: "Stellar Mainnet", issuerId: "GCSA...441P" },
    };
  }

  return {
    lifecycle: {
      currentStep: "create",
      completedAt: { create: "Mar 01, 2024" },
    },
    blockchainInfo: { assetCode, network: "Stellar Mainnet", issuerId: "---" },
  };
}

// Hand-picked rows matching the reference screenshot exactly.
const FEATURED_ASSETS: IAsset[] = [
  {
    id: "1",
    assetId: "SRA-LON-001",
    name: "London Sky Office",
    type: "Real Estate",
    owner: "Global Equity Fund",
    estValue: 450,
    country: "United Kingdom",
    status: "Tokenized",
    blockchain: "Issued",
    ...lifecycleFor("Tokenized", 1),
  },
  {
    id: "2",
    assetId: "SRA-AIR-442",
    name: "A320 Neo Fleet",
    type: "Aviation",
    owner: "Apex Leasing",
    estValue: 82.5,
    country: "United States",
    status: "Review",
    blockchain: "Ready",
    ...lifecycleFor("Review", 442),
  },
  {
    id: "3",
    assetId: "SRA-NRG-012",
    name: "Solar Array V",
    type: "Energy",
    owner: "Horizon Power",
    estValue: 12.2,
    country: "Germany",
    status: "Draft",
    blockchain: "Not Issued",
    ...lifecycleFor("Draft", 12),
  },
  {
    id: "4",
    assetId: "SRA-MAR-089",
    name: "S.S. Aurora Bulk",
    type: "Maritime",
    owner: "Pacific Trans",
    estValue: 310,
    country: "Singapore",
    status: "Tokenized",
    blockchain: "Issued",
    ...lifecycleFor("Tokenized", 89),
  },
];

/** Generates additional rows so filters/sorting/pagination have real data to work with. */
function generateAssets(count: number, startId: number): IAsset[] {
  return Array.from({ length: count }, (_, i) => {
    const seed = startId + i;
    const type = TYPES[seed % TYPES.length]!;
    const status = STATUSES[seed % STATUSES.length]!;

    return {
      id: String(seed),
      assetId: `SRA-${prefixForType(type)}-${String(100 + seed).padStart(3, "0")}`,
      name: `${nameForType(type, seed)} ${Math.floor(seed / TYPES.length) + 1}`,
      type,
      owner: OWNERS[seed % OWNERS.length]!,
      estValue: Math.round(((seed * 37) % 500) + 5 + ((seed * 13) % 100) / 10),
      country: COUNTRIES[seed % COUNTRIES.length]!,
      status,
      blockchain: BLOCKCHAIN_STATES[seed % BLOCKCHAIN_STATES.length]!,
      ...lifecycleFor(status, seed),
    };
  });
}

// Capped at 15 total rows: 4 featured + 11 generated.
export const MOCK_ASSETS: IAsset[] = [...FEATURED_ASSETS, ...generateAssets(11, 5)];

export const MOCK_ASSET_STATS: IAssetStats = {
  totalAssets: 1284,
  totalAssetsDelta: "+12.5%",
  draft: 42,
  ready: 18,
  tokenized: 1192,
  archived: 32,
  totalValueLabel: "$2.4B",
};
