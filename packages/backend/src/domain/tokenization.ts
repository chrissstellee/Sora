import { z } from "zod";

export const STELLAR_AMOUNT_SCALE = 10_000_000n;
export const MAX_SIGNED_INT64 = 9_223_372_036_854_775_807n;
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const MAX_ACTIVE_DOCUMENTS = 10;
export const REVIEW_CHECKLIST_VERSION = 1;

const collapseWhitespace = (value: string) => value.normalize("NFKC").trim().replace(/\s+/g, " ");

export const tokenizationProfileInputSchema = z.object({
  assetCode: z
    .string()
    .trim()
    .toUpperCase()
    .pipe(z.string().regex(/^[A-Z0-9]{1,12}$/, "Use 1-12 uppercase letters or digits")),
  proposedSupply: z.string().trim(),
  internalReference: z.string().transform(collapseWhitespace).pipe(z.string().min(1).max(120)),
});

export interface CanonicalSupply {
  units: bigint;
  amount: string;
}

export function canonicalizeSupply(value: string): CanonicalSupply {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d{1,7})?$/.test(normalized)) {
    throw new Error("INVALID_CANONICAL_SUPPLY");
  }
  const [integer = "0", fraction = ""] = normalized.split(".");
  const units = BigInt(integer) * STELLAR_AMOUNT_SCALE + BigInt(fraction.padEnd(7, "0") || "0");
  if (units <= 0n || units > MAX_SIGNED_INT64) throw new Error("INVALID_CANONICAL_SUPPLY");
  const whole = units / STELLAR_AMOUNT_SCALE;
  const decimals = (units % STELLAR_AMOUNT_SCALE).toString().padStart(7, "0");
  return { units, amount: `${whole}.${decimals}` };
}

export function canonicalizeTokenizationProfile(input: unknown) {
  const parsed = tokenizationProfileInputSchema.parse(input);
  const supply = canonicalizeSupply(parsed.proposedSupply);
  return {
    assetCode: parsed.assetCode,
    supplyUnits: supply.units,
    supply: supply.amount,
    internalReference: parsed.internalReference,
    network: "Testnet" as const,
  };
}

export const DOCUMENT_MEDIA_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
] as const;

export type DocumentMediaType = (typeof DOCUMENT_MEDIA_TYPES)[number];

const EXTENSION_BY_MEDIA_TYPE: Record<DocumentMediaType, readonly string[]> = {
  "application/pdf": ["pdf"],
  "application/msword": ["doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
  "image/png": ["png"],
  "image/jpeg": ["jpg", "jpeg"],
};

export function sanitizeDocumentFilename(value: string): string {
  const filename = [...value.normalize("NFKC").replace(/[\\/]/g, "_")]
    .map((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127 ? "_" : character;
    })
    .join("")
    .trim();
  if (!filename || filename === "." || filename === "..") throw new Error("INVALID_DOCUMENT_NAME");
  return filename.slice(0, 180);
}

export function detectDocumentMediaType(bytes: Uint8Array): DocumentMediaType {
  if (bytes.byteLength === 0) throw new Error("DOCUMENT_EMPTY");
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
    return "application/msword";
  }
  if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]) && containsAscii(bytes, "word/")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  throw new Error("DOCUMENT_TYPE_UNSUPPORTED");
}

export function validateDocumentBytes(input: { bytes: Uint8Array; filename: string }) {
  if (input.bytes.byteLength > MAX_DOCUMENT_BYTES) throw new Error("DOCUMENT_TOO_LARGE");
  const filename = sanitizeDocumentFilename(input.filename);
  const mediaType = detectDocumentMediaType(input.bytes);
  const extension = filename.includes(".") ? filename.split(".").at(-1)!.toLowerCase() : "";
  if (!EXTENSION_BY_MEDIA_TYPE[mediaType].includes(extension)) {
    throw new Error("DOCUMENT_EXTENSION_MISMATCH");
  }
  return { filename, mediaType, byteSize: input.bytes.byteLength };
}

export interface ReviewManifestBasis {
  assetId: string;
  assetVersion: number;
  profileId: string;
  profileVersion: number;
  documents: Array<{ documentId: string; version: number; sha256: string }>;
}

export function canonicalReviewManifest(basis: ReviewManifestBasis): string {
  return JSON.stringify({
    assetId: basis.assetId,
    assetVersion: basis.assetVersion,
    checklistVersion: REVIEW_CHECKLIST_VERSION,
    profileId: basis.profileId,
    profileVersion: basis.profileVersion,
    documents: [...basis.documents].sort(
      (a, b) => a.documentId.localeCompare(b.documentId) || a.version - b.version,
    ),
  });
}

export async function sha256Hex(value: Uint8Array | string): Promise<string> {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  const digest = await crypto.subtle.digest("SHA-256", Uint8Array.from(bytes).buffer);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}

function containsAscii(bytes: Uint8Array, value: string): boolean {
  const needle = new TextEncoder().encode(value);
  outer: for (let offset = 0; offset <= bytes.length - needle.length; offset += 1) {
    for (let index = 0; index < needle.length; index += 1) {
      if (bytes[offset + index] !== needle[index]) continue outer;
    }
    return true;
  }
  return false;
}
