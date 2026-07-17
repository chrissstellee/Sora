"use client";

import { Button } from "@repo/ui/components/ui/button";

import { useAuth } from "../../hooks/use-auth";

export function LoginForm() {
  const { authState, login, error, walletAddress } = useAuth();

  const getStatusMessage = () => {
    switch (authState) {
      case "disconnected":
        return "Connect your hardware or browser wallet to access your workspace.";
      case "connecting":
        return "Opening Wallets Kit... Please select your Stellar wallet.";
      case "connected-not-authenticated":
        return `Connected: ${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-6)}. Preparing challenge...`;
      case "awaiting-signature":
        return "Awaiting Signature: Please sign the SEP-10 challenge transaction in your wallet.";
      case "verifying":
        return "Verifying wallet ownership and session authenticity on server...";
      case "onboarding-required":
        return "Authentication successful! Redirecting to onboard your organization...";
      case "authenticated":
        return "Session authenticated! Redirecting to dashboard...";
      case "rejected":
        return "Signature request rejected. Please try again.";
      case "wrong-network":
        return "Wrong Network: Please configure your wallet to use Stellar Testnet.";
      case "expired":
        return "Session or challenge expired. Please re-authenticate.";
      case "recoverable-error":
        return error || "An error occurred. Please try again.";
      default:
        return "Initialising...";
    }
  };

  const getButtonText = () => {
    switch (authState) {
      case "disconnected":
        return "Connect Stellar Wallet";
      case "connecting":
        return "Selecting Wallet...";
      case "connected-not-authenticated":
        return "Connected";
      case "awaiting-signature":
        return "Awaiting Signature...";
      case "verifying":
        return "Verifying...";
      case "onboarding-required":
      case "authenticated":
        return "Success";
      case "rejected":
      case "expired":
      case "recoverable-error":
        return "Try Again";
      default:
        return "Connect Wallet";
    }
  };

  const isLoading =
    authState === "connecting" || authState === "awaiting-signature" || authState === "verifying";

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card/50 p-6 text-center shadow-inner backdrop-blur-sm">
        {/* Wallet Icon / Status Indicator */}
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-soft-primary/20 bg-soft-primary/10 text-3xl">
          {isLoading ? (
            <span className="animate-pulse">🔒</span>
          ) : authState === "authenticated" || authState === "onboarding-required" ? (
            <span>✅</span>
          ) : authState === "rejected" || authState === "recoverable-error" ? (
            <span>⚠️</span>
          ) : (
            <span>💻</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <h3 className="font-mono text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Authentication Status
          </h3>
          <p className="max-w-sm font-sans text-sm leading-relaxed text-foreground/80">
            {getStatusMessage()}
          </p>
        </div>
      </div>

      {error && authState === "recoverable-error" && (
        <p className="form-error rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-center text-xs font-medium text-destructive">
          {error}
        </p>
      )}

      <Button
        type="button"
        variant={
          authState === "authenticated" || authState === "onboarding-required"
            ? "default"
            : authState === "rejected" || authState === "recoverable-error"
              ? "outline"
              : "gradient"
        }
        className="h-11 w-full font-semibold"
        onClick={login}
        disabled={isLoading}
        loading={isLoading}
      >
        {getButtonText()}
      </Button>
    </div>
  );
}
