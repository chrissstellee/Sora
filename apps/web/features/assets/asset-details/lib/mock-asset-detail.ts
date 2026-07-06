import type { IAssetDocument, IRecentActivity } from "./types";

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
