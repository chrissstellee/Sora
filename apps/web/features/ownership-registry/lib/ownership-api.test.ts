import { afterEach, describe, expect, it, vi } from "vitest";

import { getOwnership, requestOwnershipRefresh } from "./ownership-api";

afterEach(() => vi.unstubAllGlobals());

describe("ownership API client", () => {
  it("sends cursor and normalized server search without scanning in the browser", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          asset: {},
          snapshot: null,
          sync: { state: "unavailable" },
          holders: { items: [], nextCursor: null },
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await getOwnership("asset/id", { cursor: "cursor:1", limit: 50, q: "  gabc  " });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/assets/asset%2Fid/ownership?limit=50&cursor=cursor%3A1&q=GABC",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("sends only the refresh reason and request id", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ status: "accepted" }), { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);

    await requestOwnershipRefresh(
      "7774cf25-d03c-4f65-9856-6f611a65002f",
      "manual",
      "a33f7006-9552-4337-88db-ae6e897d7fd2",
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/assets/7774cf25-d03c-4f65-9856-6f611a65002f/ownership/refresh",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          reason: "manual",
          requestId: "a33f7006-9552-4337-88db-ae6e897d7fd2",
        }),
      }),
    );
  });
});
