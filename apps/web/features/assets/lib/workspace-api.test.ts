import { afterEach, describe, expect, it, vi } from "vitest";

import { WorkspaceApiError, createAsset, listAssets, updateAsset } from "./workspace-api";

const input = {
  name: "Harbor Warehouse",
  category: "Real Estate" as const,
  description: "A persisted warehouse asset near the commercial harbor.",
  estimatedValue: "1200000.00",
  currency: "USD" as const,
  countryCode: "PH",
  legalOwner: "Sora Holdings",
  registrationNumber: "REG-100",
  ownershipType: "Organization" as const,
  contactEmail: "owner@example.com",
};

afterEach(() => vi.unstubAllGlobals());

describe("workspace asset API", () => {
  it("sends canonical create fields with a stable request id and no cache", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ asset: {}, replayed: false }), { status: 201 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await createAsset(input, "request-1");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/assets",
      expect.objectContaining({
        method: "POST",
        cache: "no-store",
        body: JSON.stringify({ ...input, requestId: "request-1" }),
      }),
    );
  });

  it("passes cursor and server search to the list endpoint", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ items: [], nextCursor: null, mode: "search" })),
      );
    vi.stubGlobal("fetch", fetchMock);

    await listAssets(new AbortController().signal, "Harbor", "cursor-2");

    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/assets?limit=25&q=Harbor&cursor=cursor-2");
  });

  it("sends expectedVersion with update input", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ asset: {}, outcome: "updated" })));
    vi.stubGlobal("fetch", fetchMock);

    await updateAsset("asset-1", input, 3);

    expect(JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)).toEqual({
      ...input,
      expectedVersion: 3,
    });
  });

  it("preserves structured conflict details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: "VERSION_CONFLICT",
              message: "Review the latest version",
              correlationId: "corr-1",
            },
          }),
          { status: 409 },
        ),
      ),
    );

    const failure = await updateAsset("asset-1", input, 1).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(WorkspaceApiError);
    expect(failure).toMatchObject({
      status: 409,
      code: "VERSION_CONFLICT",
      correlationId: "corr-1",
    });
  });
});
