import { afterEach, describe, expect, it, vi } from "vitest";

import { apiRequest, assertMinimumFixtureSize } from "./env.mjs";

describe("Phase 2 fixture size", () => {
  it.each([5_000, 5_001])("accepts a fixture with %i total assets", (total) => {
    expect(() => assertMinimumFixtureSize(total, 5_000, "Fixture")).not.toThrow();
  });

  it.each([undefined, 4_999])("rejects an incomplete fixture with %s assets", (total) => {
    expect(() => assertMinimumFixtureSize(total, 5_000, "Fixture")).toThrow(
      /expected at least 5000/,
    );
  });
});

describe("Phase 2 API requests", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("retries a transient connection reset with bounded backoff", async () => {
    vi.useFakeTimers();
    const connectionReset = Object.assign(new TypeError("fetch failed"), {
      cause: { code: "ECONNRESET" },
    });
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(connectionReset)
      .mockResolvedValueOnce({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    const request = apiRequest("http://localhost:3000", "session", "/api/assets", {
      method: "POST",
      body: "{}",
    });
    await vi.advanceTimersByTimeAsync(250);

    await expect(request).resolves.toMatchObject({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry a non-transient client response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ error: { code: "VALIDATION_ERROR" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      apiRequest("http://localhost:3000", "session", "/api/assets", {
        method: "POST",
        body: "{}",
      }),
    ).rejects.toThrow("POST /api/assets failed (VALIDATION_ERROR)");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries a transient service response", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        arrayBuffer: async () => new ArrayBuffer(0),
      })
      .mockResolvedValueOnce({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    const request = apiRequest("http://localhost:3000", "session", "/api/workspace/summary");
    await vi.advanceTimersByTimeAsync(250);

    await expect(request).resolves.toMatchObject({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
