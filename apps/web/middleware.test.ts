import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { middleware } from "./middleware";

describe("protected route middleware", () => {
  it("redirects a protected route when the session cookie is missing", () => {
    const response = middleware(new NextRequest("https://sora.test/assets"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://sora.test/login?redirect=%2Fassets");
  });

  it("does not trust a cookie enough to redirect away from login", () => {
    const request = new NextRequest("https://sora.test/login", {
      headers: { cookie: "sora_session=forged" },
    });

    const response = middleware(request);

    expect(response.headers.get("location")).toBeNull();
  });
});
