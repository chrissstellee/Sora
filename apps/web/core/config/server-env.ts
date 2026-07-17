import { Keypair } from "@repo/backend/stellar/auth";

const globalForKeypair = globalThis as unknown as {
  serverKeypair?: Keypair;
};

/**
 * Returns the server's signing keypair.
 * If SORA_SIGNING_SEED is provided in the environment, it uses that.
 * Otherwise, it generates a random ephemeral keypair for local development.
 */
export function getServerKeypair(): Keypair {
  if (process.env.SORA_SIGNING_SEED) {
    try {
      return Keypair.fromSecret(process.env.SORA_SIGNING_SEED);
    } catch {
      throw new Error("Invalid SORA_SIGNING_SEED configured in environment");
    }
  }

  // Fallback to ephemeral keypair for development
  if (!globalForKeypair.serverKeypair) {
    globalForKeypair.serverKeypair = Keypair.random();
    console.warn(
      "⚠️ SORA_SIGNING_SEED not found. Ephemeral server keypair generated for this session:",
    );
    console.warn(`👉 Public Key: ${globalForKeypair.serverKeypair.publicKey()}`);
  }

  return globalForKeypair.serverKeypair;
}

/**
 * Resolves the home domain from the request or environment.
 */
export function getHomeDomain(request: Request): string {
  if (process.env.NEXT_PUBLIC_HOME_DOMAIN) {
    return process.env.NEXT_PUBLIC_HOME_DOMAIN;
  }
  const url = new URL(request.url);
  return url.host; // e.g. localhost:3000
}

/**
 * Resolves the web auth domain from the request or environment.
 */
export function getWebAuthDomain(request: Request): string {
  if (process.env.NEXT_PUBLIC_WEB_AUTH_DOMAIN) {
    return process.env.NEXT_PUBLIC_WEB_AUTH_DOMAIN;
  }
  const url = new URL(request.url);
  return url.host; // e.g. localhost:3000
}
