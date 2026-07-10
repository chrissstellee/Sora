import { IPermissionScopeOption } from "../lib/types";

export const TABS = [
  { value: "api-keys", label: "API Keys" },
  { value: "api-reference", label: "API Reference" },
  { value: "webhooks", label: "Webhooks" },
  // { value: "sdks", label: "SDKs" },
] as const;

export const PERMISSION_SCOPE_OPTIONS: IPermissionScopeOption[] = [
  { value: "assets", label: "Assets" },
  { value: "documents", label: "Documents" },
  { value: "tokenization", label: "Tokenization" },
  { value: "ownership-registry", label: "Ownership Registry" },
  { value: "read-only", label: "Read Only" },
  { value: "full-access", label: "Full Access (Admin)" },
];
