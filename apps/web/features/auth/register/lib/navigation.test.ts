import { describe, expect, it } from "vitest";

import { shouldRedirectFromRegister } from "./navigation";

describe("shouldRedirectFromRegister", () => {
  it("does not redirect while onboarding state is being restored", () => {
    expect(shouldRedirectFromRegister("disconnected", true)).toBe(false);
  });

  it("redirects disconnected users after session restoration finishes", () => {
    expect(shouldRedirectFromRegister("disconnected", false)).toBe(true);
  });

  it("keeps users with a restored onboarding grant on registration", () => {
    expect(shouldRedirectFromRegister("onboarding-required", false)).toBe(false);
  });
});
