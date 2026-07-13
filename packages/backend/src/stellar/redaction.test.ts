import { describe, expect, it } from "vitest";

import { sanitizeForEvidence, sanitizedError } from "./redaction.js";

const seed = `S${"A".repeat(55)}`;
const apiKey = ["sk", "live", "ABC123"].join("_");

describe("evidence redaction", () => {
  it("removes seeds, production-looking keys, private-key markers, and environment dumps", () => {
    const output = JSON.stringify(
      sanitizeForEvidence({ seed, apiKey, environment: { TOKEN: seed }, publicAccount: "GABC" }),
    );
    expect(output).not.toContain(seed);
    expect(output).not.toContain(apiKey);
    expect(output).not.toContain("TOKEN");
    expect(output).toContain("GABC");
  });
  it("redacts SDK-style error messages without echoing the value", () => {
    expect(sanitizedError(new Error(`submission failed for ${seed}`)).message).toBe(
      "submission failed for [REDACTED]",
    );
  });
});
