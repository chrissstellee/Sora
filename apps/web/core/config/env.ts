import { z } from "zod";

import { parseTestnetConfig, toPublicStellarConfig } from "@repo/backend/stellar/config";

const envSchema = z.object({
  NEXT_PUBLIC_CONVEX_URL: z.string().url({
    message: "NEXT_PUBLIC_CONVEX_URL must be a valid URL",
  }),
  NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE: z.string().min(1),
  NEXT_PUBLIC_STELLAR_HORIZON_URL: z.string().url(),
  NEXT_PUBLIC_STELLAR_EXPLORER_URL: z.string().url(),
  NEXT_PUBLIC_STELLAR_UI_LABEL: z.string().min(1),
});

// This will throw an error if validation fails
const validateEnv = () => {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE: process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE,
    NEXT_PUBLIC_STELLAR_HORIZON_URL: process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL,
    NEXT_PUBLIC_STELLAR_EXPLORER_URL: process.env.NEXT_PUBLIC_STELLAR_EXPLORER_URL,
    NEXT_PUBLIC_STELLAR_UI_LABEL: process.env.NEXT_PUBLIC_STELLAR_UI_LABEL,
  });

  if (!parsed.success) {
    console.error(
      "❌ Invalid environment variables:",
      JSON.stringify(parsed.error.format(), null, 2),
    );
    throw new Error("Invalid environment variables");
  }

  return parsed.data;
};

export const env = validateEnv();

const stellarConfig = parseTestnetConfig({
  networkPassphrase: env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE,
  horizonUrl: env.NEXT_PUBLIC_STELLAR_HORIZON_URL,
  explorerUrl: env.NEXT_PUBLIC_STELLAR_EXPLORER_URL,
  uiLabel: env.NEXT_PUBLIC_STELLAR_UI_LABEL,
});

export const publicStellarConfig = toPublicStellarConfig(stellarConfig);
