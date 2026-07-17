import { describe, expect, it } from "vitest";

import {
  MAX_DOCUMENT_BYTES,
  MAX_SIGNED_INT64,
  canonicalReviewManifest,
  canonicalizeSupply,
  canonicalizeTokenizationProfile,
  detectDocumentMediaType,
  sanitizeDocumentFilename,
  sha256Hex,
  validateDocumentBytes,
} from "./tokenization.js";

describe("canonical tokenization profile", () => {
  it("stores positive seven-decimal signed-int64 units without floating point", () => {
    expect(canonicalizeSupply("001")).toEqual({ units: 10_000_000n, amount: "1.0000000" });
    expect(canonicalizeSupply("0.0000001")).toEqual({ units: 1n, amount: "0.0000001" });
    const max = canonicalizeSupply("922337203685.4775807");
    expect(max.units).toBe(MAX_SIGNED_INT64);
  });

  it.each(["0", "-1", "1.00000001", "1e2", "922337203685.4775808"])(
    "rejects unsafe supply %s",
    (value) => expect(() => canonicalizeSupply(value)).toThrow("INVALID_CANONICAL_SUPPLY"),
  );

  it("normalizes code, reference, amount, and fixed network", () => {
    expect(
      canonicalizeTokenizationProfile({
        assetCode: " sora1 ",
        proposedSupply: "25.5",
        internalReference: "  Deal   7 ",
      }),
    ).toEqual({
      assetCode: "SORA1",
      supplyUnits: 255_000_000n,
      supply: "25.5000000",
      internalReference: "Deal 7",
      network: "Testnet",
    });
  });
});

describe("stored document validation", () => {
  const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);

  it("detects bytes and enforces extension independently of browser MIME", () => {
    expect(validateDocumentBytes({ bytes: pdf, filename: " evidence.pdf " })).toEqual({
      filename: "evidence.pdf",
      mediaType: "application/pdf",
      byteSize: pdf.length,
    });
    expect(() => validateDocumentBytes({ bytes: pdf, filename: "evidence.png" })).toThrow(
      "DOCUMENT_EXTENSION_MISMATCH",
    );
  });

  it("recognizes supported signatures and rejects malformed bytes", () => {
    expect(detectDocumentMediaType(new Uint8Array([0xff, 0xd8, 0xff, 0xdb]))).toBe("image/jpeg");
    expect(() => detectDocumentMediaType(new Uint8Array([1, 2, 3]))).toThrow(
      "DOCUMENT_TYPE_UNSUPPORTED",
    );
  });

  it("normalizes unsafe filenames and enforces the stored byte limit", () => {
    expect(sanitizeDocumentFilename("../report.pdf")).toBe(".._report.pdf");
    expect(() =>
      validateDocumentBytes({ bytes: new Uint8Array(MAX_DOCUMENT_BYTES + 1), filename: "x.pdf" }),
    ).toThrow("DOCUMENT_TOO_LARGE");
  });
});

describe("review manifests", () => {
  it("canonicalizes document order and fingerprints the bounded basis", async () => {
    const basis = {
      assetId: "asset-1",
      assetVersion: 4,
      profileId: "profile-1",
      profileVersion: 2,
      documents: [
        { documentId: "b", version: 1, sha256: "b".repeat(64) },
        { documentId: "a", version: 2, sha256: "a".repeat(64) },
      ],
    };
    const reversed = { ...basis, documents: [...basis.documents].reverse() };
    expect(canonicalReviewManifest(basis)).toBe(canonicalReviewManifest(reversed));
    expect(await sha256Hex(canonicalReviewManifest(basis))).toMatch(/^[a-f0-9]{64}$/);
  });
});
