import { apiRequest, playwrightCookie } from "../phase2/env.mjs";

export { apiRequest, playwrightCookie };

export function readPhase5Environment({
  requireAsset = false,
  requireBothOrganizations = true,
} = {}) {
  const baseURL = process.env.PHASE5_BASE_URL;
  const orgA = process.env.PHASE5_ORG_A_SESSION_COOKIE;
  const orgB = process.env.PHASE5_ORG_B_SESSION_COOKIE;
  const assetId = process.env.PHASE5_ASSET_ID;
  const missing = [
    !baseURL && "PHASE5_BASE_URL",
    !orgA && "PHASE5_ORG_A_SESSION_COOKIE",
    requireBothOrganizations && !orgB && "PHASE5_ORG_B_SESSION_COOKIE",
    requireAsset && !assetId && "PHASE5_ASSET_ID",
  ].filter(Boolean);
  if (missing.length) {
    throw new Error(`NOT EXECUTED: missing required environment variables: ${missing.join(", ")}`);
  }

  let url;
  try {
    url = new URL(baseURL);
  } catch {
    throw new Error("NOT EXECUTED: PHASE5_BASE_URL must be an absolute HTTP(S) URL");
  }
  if (!/^https?:$/.test(url.protocol)) {
    throw new Error("NOT EXECUTED: PHASE5_BASE_URL must use HTTP or HTTPS");
  }
  for (const [name, value] of [
    ["PHASE5_ORG_A_SESSION_COOKIE", orgA],
    ["PHASE5_ORG_B_SESSION_COOKIE", orgB],
  ]) {
    if (value !== undefined && /[;\r\n]/.test(value)) {
      throw new Error(`NOT EXECUTED: ${name} must contain only the raw session cookie value`);
    }
  }
  return { baseURL: url.origin, orgA, orgB, assetId };
}
