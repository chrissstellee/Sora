import { describe, expect, it } from "vitest";

import { assetRecordSchema, normalizeRegistrationNumber } from "./asset-record.js";

const valid = {
  name: "  Solar   Farm  ",
  category: "Energy",
  description: "A utility-scale renewable energy installation.",
  estimatedValue: "000123456789012345.6",
  currency: "USD",
  countryCode: "ph",
  legalOwner: "Sora Energy Inc.",
  registrationNumber: " sec- 123-abc ",
  ownershipType: "Organization",
  contactEmail: "OWNER@EXAMPLE.COM",
  contactPhone: "+63 (917) 555-0100",
};

describe("asset record contract", () => {
  it("canonicalizes fields without floating-point precision loss", () => {
    const parsed = assetRecordSchema.parse(valid);
    expect(parsed.estimatedValue).toBe("123456789012345.60");
    expect(parsed.name).toBe("Solar Farm");
    expect(parsed.countryCode).toBe("PH");
    expect(parsed.contactEmail).toBe("owner@example.com");
    expect(normalizeRegistrationNumber(parsed.registrationNumber)).toBe("SEC123ABC");
  });

  it.each(["0", "0.00", "0.001", "1234567890123456789.00"])(
    "rejects invalid amount boundary %s",
    (estimatedValue) => {
      expect(assetRecordSchema.safeParse({ ...valid, estimatedValue }).success).toBe(false);
    },
  );

  it("accepts the minimum value and 18 integer digits", () => {
    expect(assetRecordSchema.parse({ ...valid, estimatedValue: "0.01" }).estimatedValue).toBe(
      "0.01",
    );
    expect(
      assetRecordSchema.parse({ ...valid, estimatedValue: "999999999999999999" }).estimatedValue,
    ).toBe("999999999999999999.00");
  });

  it("rejects malformed phone numbers", () => {
    expect(assetRecordSchema.safeParse({ ...valid, contactPhone: "call-me" }).success).toBe(false);
  });
});
