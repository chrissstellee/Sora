import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "./use-auth";

const { authModal, disconnect, push, signTransaction } = vi.hoisted(() => ({
  authModal: vi.fn(),
  disconnect: vi.fn(),
  push: vi.fn(),
  signTransaction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@creit-tech/stellar-wallets-kit", () => ({
  StellarWalletsKit: {
    init: vi.fn(),
    authModal,
    disconnect,
    signTransaction,
  },
}));

vi.mock("@creit-tech/stellar-wallets-kit/modules/utils", () => ({
  defaultModules: () => [],
}));

const jsonResponse = (body: unknown, ok = true) =>
  Promise.resolve({
    json: () => Promise.resolve(body),
    ok,
  } as Response);

describe("useAuth", () => {
  beforeEach(() => {
    authModal.mockReset();
    disconnect.mockReset();
    push.mockReset();
    signTransaction.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("restores onboarding state after navigation and submits without a client grant token", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockImplementation((input, init) => {
      if (input === "/api/auth/me") {
        return jsonResponse({ authenticated: false, onboardingRequired: true });
      }
      if (input === "/api/auth/onboard" && init?.method === "POST") {
        return jsonResponse({
          status: "authenticated",
          user: { walletAddress: "GABC", orgName: "Sora Labs" },
        });
      }
      throw new Error(`Unexpected request: ${String(input)}`);
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.authState).toBe("onboarding-required"));

    await act(() => result.current.onboard("Sora Labs", "team@sora.test"));

    const onboardCall = fetchMock.mock.calls.find(([input]) => input === "/api/auth/onboard");
    expect(JSON.parse(String(onboardCall?.[1]?.body))).toEqual({
      orgName: "Sora Labs",
      email: "team@sora.test",
    });
    expect(push).toHaveBeenCalledWith("/dashboard");
  });

  it("waits for Wallets Kit initialization when connect is clicked immediately", async () => {
    const address = `G${"A".repeat(55)}`;
    authModal.mockResolvedValue({ address });
    signTransaction.mockResolvedValue({ signedTxXdr: "signed-xdr" });

    vi.mocked(fetch).mockImplementation((input) => {
      if (input === "/api/auth/me") {
        return jsonResponse({ authenticated: false });
      }
      if (String(input).startsWith("/api/auth/challenge")) {
        return jsonResponse({ challenge: "challenge-xdr" });
      }
      if (input === "/api/auth/verify") {
        return jsonResponse({ status: "authenticated", orgName: "Sora Labs" });
      }
      throw new Error(`Unexpected request: ${String(input)}`);
    });

    const { result } = renderHook(() => useAuth());

    await act(() => result.current.login());

    expect(authModal).toHaveBeenCalledOnce();
    expect(result.current.authState).toBe("authenticated");
    expect(push).toHaveBeenCalledWith("/dashboard");
  });

  it("does not let a slow session check overwrite a completed login", async () => {
    const address = `G${"B".repeat(55)}`;
    let resolveSession!: (response: Response) => void;
    const sessionResponse = new Promise<Response>((resolve) => {
      resolveSession = resolve;
    });

    authModal.mockResolvedValue({ address });
    signTransaction.mockResolvedValue({ signedTxXdr: "signed-xdr" });

    vi.mocked(fetch).mockImplementation((input) => {
      if (input === "/api/auth/me") return sessionResponse;
      if (String(input).startsWith("/api/auth/challenge")) {
        return jsonResponse({ challenge: "challenge-xdr" });
      }
      if (input === "/api/auth/verify") {
        return jsonResponse({ status: "authenticated", orgName: "Sora Labs" });
      }
      throw new Error(`Unexpected request: ${String(input)}`);
    });

    const { result } = renderHook(() => useAuth());

    await act(() => result.current.login());
    expect(result.current.authState).toBe("authenticated");

    await act(async () => {
      resolveSession(await jsonResponse({ authenticated: false }));
      await sessionResponse;
    });

    expect(result.current.authState).toBe("authenticated");
  });

  it("revokes the session and disconnects the selected wallet on logout", async () => {
    disconnect.mockResolvedValue(undefined);
    vi.mocked(fetch).mockImplementation((input, init) => {
      if (input === "/api/auth/me") {
        return jsonResponse({
          authenticated: true,
          user: { walletAddress: "GABC", orgName: "Sora Labs" },
        });
      }
      if (input === "/api/auth/logout" && init?.method === "POST") {
        return jsonResponse({ success: true });
      }
      throw new Error(`Unexpected request: ${String(input)}`);
    });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.authState).toBe("authenticated"));

    await act(() => result.current.logout());

    expect(disconnect).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledWith("/api/auth/logout", { method: "POST" });
    expect(result.current.walletAddress).toBeNull();
    expect(result.current.authState).toBe("disconnected");
    expect(push).toHaveBeenCalledWith("/login");
  });
});
