import { CheckCircle2, Cpu, FileText, PlusCircle, Settings2, Share2 } from "lucide-react";

import type { IAssetDocument, IHolder, IRecentActivity, ITimelineEvent, ITransfer } from "./types";

export const MOCK_DOCUMENTS: IAssetDocument[] = [
  {
    id: "doc-1",
    name: "Property Deed.pdf",
    type: "Legal",
    date: "Oct 12, 2023",
    sizeLabel: "2.4 MB",
    uploadedBy: "admin@skyline.com",
  },
  {
    id: "doc-2",
    name: "Valuation Report Q4.pdf",
    type: "Financial",
    date: "Oct 14, 2023",
    sizeLabel: "1.1 MB",
    uploadedBy: "admin@skyline.com",
  },
  {
    id: "doc-3",
    name: "Environmental Compliance Certificate.pdf",
    type: "Compliance",
    date: "Oct 18, 2023",
    sizeLabel: "874 KB",
    uploadedBy: "compliance@skyline.com",
  },
];

export const MOCK_RECENT_ACTIVITY: IRecentActivity[] = [
  {
    id: "act-1",
    description: "Asset Created",
    timeAgo: "2 days ago",
    icon: "created",
  },
  {
    id: "act-2",
    description: "Document Uploaded: Property Deed.pdf",
    timeAgo: "1 day ago",
    icon: "document",
  },
  {
    id: "act-3",
    description: "Document Uploaded: Valuation Report Q4.pdf",
    timeAgo: "1 day ago",
    icon: "document",
  },
];

export const MOCK_HOLDERS: IHolder[] = [
  {
    name: "Skyline Holdings LLC",
    type: "Institutional",
    wallet: "606Q...R6T2",
    walletFull: "G06Q2C3E5O6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7R6T2",
    percentage: 45.0,
    balance: "562,500",
    status: "Active",
  },
  {
    name: "Global REIT Fund",
    type: "Institutional",
    wallet: "GB7X...P9W1",
    walletFull: "GB7X2C3E5O6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7P9W1",
    percentage: 30.0,
    balance: "375,000",
    status: "Active",
  },
  {
    name: "Retail Pool A",
    type: "Retail",
    wallet: "GCA3...L5S8",
    walletFull: "GCA32C3E5O6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7L5S8",
    percentage: 15.0,
    balance: "187,500",
    status: "Active",
  },
  {
    name: "Treasury",
    type: "Corporate",
    wallet: "GDMM...Z1E0",
    walletFull: "GDMM2C3E5O6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7Z1E0",
    percentage: 10.0,
    balance: "125,000",
    status: "Active",
  },
];

export const MOCK_TRANSFERS: ITransfer[] = [
  {
    timestamp: "Oct 24, 14:22",
    type: "Transfer",
    from: "606Q...R6T2",
    to: "GCA3...L5S8",
    amount: "1,200",
    txHash: "a8f1...b3e2",
  },
  {
    timestamp: "Oct 22, 09:15",
    type: "Distribution",
    from: "Issuance",
    to: "GDMM...Z1E0",
    amount: "1.25M",
    txHash: "3e21...8f9a",
  },
];

export const MOCK_EVENTS: ITimelineEvent[] = [
  {
    id: "evt-1",
    title: "Asset Issued on Mainnet",
    category: "BLOCKCHAIN",
    status: "SUCCESS",
    description:
      "The asset was successfully tokenized and issued on the Stellar network by System Oracle.",
    date: "Oct 24, 2023",
    time: "14:22:10 UTC",
    icon: Cpu,
    blockchainInfo: {
      txHash: "CC4F...9A1C",
      ledger: "53,921,084",
      network: "Stellar Mainnet",
      confirmations: "FINALIZED",
    },
  },
  {
    id: "evt-2",
    title: "Transaction Submitted",
    category: "BLOCKCHAIN",
    status: "SUCCESS",
    description: "Issue transaction signed and broadcast to Stellar Horizon.",
    date: "Oct 24, 2023",
    time: "14:21:55",
    icon: Share2,
  },
  {
    id: "evt-3",
    title: "Ready for Tokenization",
    category: "SYSTEM",
    status: "SUCCESS",
    description: "Legal review complete. Asset status updated to 'Ready for Issuance'.",
    date: "Oct 22, 2023",
    time: "09:12:04",
    icon: CheckCircle2,
  },
  {
    id: "evt-4",
    title: "Configuration Finalized",
    category: "SYSTEM",
    status: "SUCCESS",
    description: "Token parameters (supply, divisibility, trustlines) locked by Alex Rivera.",
    date: "Oct 21, 2023",
    time: "16:45:30",
    icon: Settings2,
  },
  {
    id: "evt-5",
    title: "Documents Uploaded",
    category: "DOCUMENTS",
    status: "SUCCESS",
    description: "Asset deed and legal certificates (2 files) uploaded to encrypted storage.",
    date: "Oct 19, 2023",
    time: "11:30:12",
    icon: FileText,
  },
  {
    id: "evt-6",
    title: "Asset Created",
    category: "SYSTEM",
    status: "SUCCESS",
    description: "Draft entry for Downtown Office Tower initialized in ledger manager.",
    date: "Oct 18, 2023",
    time: "10:05:00",
    icon: PlusCircle,
  },
];
