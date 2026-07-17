import { describe, expect, it } from "vitest";

import { apiError, normalizePaginationError } from "./api-errors";

describe("API error envelopes", () => {
  it("maps an invalid Convex pagination cursor to the stable 422 envelope", async () => {
    const normalized = normalizePaginationError(
      new Error("Invalid pagination cursor supplied to paginate"),
      "opaque-client-value",
    );
    const response = apiError(normalized, "cursor-correlation");

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INVALID_CURSOR",
        message: "Pagination cursor is invalid or expired.",
        correlationId: "cursor-correlation",
      },
    });
  });

  it("does not relabel unrelated service failures or requests without a cursor", () => {
    const error = new Error("Storage temporarily unavailable");
    expect(normalizePaginationError(error, "opaque-client-value")).toBe(error);
    expect(normalizePaginationError(new Error("Invalid pagination cursor"), null)).toBeInstanceOf(
      Error,
    );
  });
});
