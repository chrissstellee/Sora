export const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";
export const TESTNET_HORIZON_URL = "https://horizon-testnet.stellar.org";
export const TESTNET_EXPLORER_URL = "https://stellar.expert/explorer/testnet";
export const TESTNET_UI_LABEL = "Stellar Testnet";

export interface StellarNetworkConfig {
  network: "testnet";
  networkPassphrase: typeof TESTNET_PASSPHRASE;
  horizonUrl: typeof TESTNET_HORIZON_URL;
  explorerUrl: typeof TESTNET_EXPLORER_URL;
  uiLabel: typeof TESTNET_UI_LABEL;
}

export type StellarPublicConfig = StellarNetworkConfig;

export interface StellarConfigEnvironment {
  networkPassphrase?: string;
  horizonUrl?: string;
  explorerUrl?: string;
  uiLabel?: string;
}

const requireExact = <T extends string>(
  name: string,
  actual: string | undefined,
  expected: T,
): T => {
  if (!actual) throw new Error(`Missing required Stellar configuration: ${name}`);
  if (actual !== expected) throw new Error(`${name} must identify Stellar Testnet`);
  return actual as T;
};

export function parseTestnetConfig(environment: StellarConfigEnvironment): StellarNetworkConfig {
  const horizonUrl = requireExact("horizonUrl", environment.horizonUrl, TESTNET_HORIZON_URL);
  const explorerUrl = requireExact("explorerUrl", environment.explorerUrl, TESTNET_EXPLORER_URL);

  try {
    new URL(horizonUrl);
    new URL(explorerUrl);
  } catch {
    throw new Error("Stellar URLs must be valid HTTPS URLs");
  }

  return {
    network: "testnet",
    networkPassphrase: requireExact(
      "networkPassphrase",
      environment.networkPassphrase,
      TESTNET_PASSPHRASE,
    ),
    horizonUrl,
    explorerUrl,
    uiLabel: requireExact("uiLabel", environment.uiLabel, TESTNET_UI_LABEL),
  };
}

export function toPublicStellarConfig(config: StellarNetworkConfig): StellarPublicConfig {
  return { ...config };
}

export const STELLAR_TESTNET_CONFIG: StellarNetworkConfig = {
  network: "testnet",
  networkPassphrase: TESTNET_PASSPHRASE,
  horizonUrl: TESTNET_HORIZON_URL,
  explorerUrl: TESTNET_EXPLORER_URL,
  uiLabel: TESTNET_UI_LABEL,
};
