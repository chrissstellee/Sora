"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export type AuthState =
  | "disconnected"
  | "connecting"
  | "connected-not-authenticated"
  | "awaiting-signature"
  | "verifying"
  | "onboarding-required"
  | "authenticated"
  | "wrong-network"
  | "rejected"
  | "expired"
  | "recoverable-error";

interface KitInstance {
  authModal: () => Promise<{ address: string }>;
  disconnect: () => Promise<void>;
  signTransaction: (
    xdr: string,
    opts: { networkPassphrase: string; address: string },
  ) => Promise<{ signedTxXdr: string }>;
}

let walletKitPromise: Promise<KitInstance> | null = null;

function initializeWalletKit(): Promise<KitInstance> {
  if (!walletKitPromise) {
    walletKitPromise = Promise.all([
      import("@creit-tech/stellar-wallets-kit"),
      import("@creit-tech/stellar-wallets-kit/modules/utils"),
    ])
      .then(([swk, utils]) => {
        swk.StellarWalletsKit.init({ modules: utils.defaultModules() });
        return swk.StellarWalletsKit;
      })
      .catch((error) => {
        walletKitPromise = null;
        throw error;
      });
  }

  return walletKitPromise as Promise<KitInstance>;
}

export function useAuth() {
  const router = useRouter();
  const authOperationRef = useRef(0);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthState>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize StellarWalletsKit dynamically on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      initializeWalletKit().catch((err) => {
        console.error("Failed to initialize StellarWalletsKit:", err);
        setError("Failed to load Stellar Wallets Kit");
        setAuthState("recoverable-error");
      });
    }
  }, []);

  // Restore session from HTTP cookie on load
  const checkSession = useCallback(async () => {
    const operation = authOperationRef.current;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (operation !== authOperationRef.current) return;

      if (data.authenticated && data.user) {
        setWalletAddress(data.user.walletAddress);
        setOrgName(data.user.orgName);
        setAuthState("authenticated");
      } else if (data.onboardingRequired) {
        setAuthState("onboarding-required");
      } else {
        setAuthState("disconnected");
      }
    } catch (err) {
      console.error("Session check failed:", err);
      if (operation === authOperationRef.current) {
        setAuthState("disconnected");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Connect wallet and sign challenge
  const login = async () => {
    authOperationRef.current += 1;
    setAuthState("connecting");
    setError(null);

    try {
      const currentKit = await initializeWalletKit();

      // 1. Prompt user to select wallet and connect
      const { address } = await currentKit.authModal();
      if (!address) {
        setAuthState("disconnected");
        return;
      }

      setWalletAddress(address);
      setAuthState("connected-not-authenticated");

      // 2. Fetch challenge XDR from server
      setAuthState("awaiting-signature");
      const challengeRes = await fetch(`/api/auth/challenge?address=${address}`);
      const challengeData = await challengeRes.json();

      if (!challengeRes.ok || challengeData.error) {
        throw new Error(challengeData.error || "Failed to generate auth challenge");
      }

      const challengeXdr = challengeData.challenge;

      // 3. Ask wallet to sign challenge
      let signedTxXdr;
      try {
        const passphrase =
          process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015";
        const signatureResult = await currentKit.signTransaction(challengeXdr, {
          networkPassphrase: passphrase,
          address,
        });
        signedTxXdr = signatureResult.signedTxXdr;
      } catch (signErr) {
        console.error("Wallet signature rejected:", signErr);
        setAuthState("rejected");
        setError("Signature request was rejected by wallet.");
        return;
      }

      // 4. Verify signature on the server
      setAuthState("verifying");
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          challengeXdr: signedTxXdr,
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || verifyData.error) {
        throw new Error(verifyData.error || "Verification failed");
      }

      if (verifyData.status === "authenticated") {
        setOrgName(verifyData.orgName || "Organization");
        setAuthState("authenticated");
        router.push("/dashboard");
      } else if (verifyData.status === "onboarding-required") {
        setAuthState("onboarding-required");
        router.push("/register");
      }
    } catch (err) {
      console.error("Login flow error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred during login");
      setAuthState("recoverable-error");
    }
  };

  // Complete onboarding
  const onboard = async (orgNameInput: string, emailInput?: string) => {
    authOperationRef.current += 1;
    setAuthState("verifying");
    setError(null);

    try {
      const res = await fetch("/api/auth/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName: orgNameInput,
          email: emailInput || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Onboarding failed");
      }

      setOrgName(data.user.orgName);
      setAuthState("authenticated");
      router.push("/dashboard");
    } catch (err) {
      console.error("Onboarding failed:", err);
      setError(err instanceof Error ? err.message : "Failed to onboard organization");
      setAuthState("onboarding-required");
    }
  };

  // Logout session
  const logout = async () => {
    authOperationRef.current += 1;
    setError(null);

    const [sessionResult, walletResult] = await Promise.allSettled([
      fetch("/api/auth/logout", { method: "POST" }).then((response) => {
        if (!response.ok) throw new Error("Server session revocation failed");
      }),
      initializeWalletKit().then((kit) => kit.disconnect()),
    ]);

    if (sessionResult.status === "rejected") {
      console.error("Logout fetch failed:", sessionResult.reason);
    }
    if (walletResult.status === "rejected") {
      console.error("Wallet disconnect failed:", walletResult.reason);
    }

    setWalletAddress(null);
    setOrgName(null);
    setAuthState("disconnected");
    router.push("/login");
  };

  return {
    walletAddress,
    orgName,
    authState,
    error,
    isLoading,
    login,
    onboard,
    logout,
  };
}
