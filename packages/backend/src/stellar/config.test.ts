import { describe, expect, it } from "vitest";

import { parseTestnetConfig, STELLAR_TESTNET_CONFIG, toPublicStellarConfig } from "./config.js";

describe("parseTestnetConfig", () => {
  it("accepts the canonical Testnet configuration", () => {
    expect(
      parseTestnetConfig({
        networkPassphrase: STELLAR_TESTNET_CONFIG.networkPassphrase,
        horizonUrl: STELLAR_TESTNET_CONFIG.horizonUrl,
        explorerUrl: STELLAR_TESTNET_CONFIG.explorerUrl,
        uiLabel: STELLAR_TESTNET_CONFIG.uiLabel,
      }),
    ).toEqual(STELLAR_TESTNET_CONFIG);
  });

  it.each(["networkPassphrase", "horizonUrl", "explorerUrl", "uiLabel"] as const)(
    "rejects missing %s",
    (key) => {
      const input: Parameters<typeof parseTestnetConfig>[0] = {
        networkPassphrase: STELLAR_TESTNET_CONFIG.networkPassphrase,
        horizonUrl: STELLAR_TESTNET_CONFIG.horizonUrl,
        explorerUrl: STELLAR_TESTNET_CONFIG.explorerUrl,
        uiLabel: STELLAR_TESTNET_CONFIG.uiLabel,
      };
      input[key] = undefined;
      expect(() => parseTestnetConfig(input)).toThrow(/Missing required Stellar configuration/);
    },
  );

  it("rejects mixed Mainnet metadata", () => {
    expect(() =>
      parseTestnetConfig({
        networkPassphrase: "Public Global Stellar Network ; September 2015",
        horizonUrl: STELLAR_TESTNET_CONFIG.horizonUrl,
        explorerUrl: STELLAR_TESTNET_CONFIG.explorerUrl,
        uiLabel: STELLAR_TESTNET_CONFIG.uiLabel,
      }),
    ).toThrow(/Testnet/);
  });

  it.each([
    ["horizonUrl", "not-a-url"],
    ["explorerUrl", "ftp://stellar.example"],
  ] as const)("rejects malformed or noncanonical %s", (key, value) => {
    expect(() =>
      parseTestnetConfig({
        networkPassphrase: STELLAR_TESTNET_CONFIG.networkPassphrase,
        horizonUrl: STELLAR_TESTNET_CONFIG.horizonUrl,
        explorerUrl: STELLAR_TESTNET_CONFIG.explorerUrl,
        uiLabel: STELLAR_TESTNET_CONFIG.uiLabel,
        [key]: value,
      }),
    ).toThrow();
  });

  it("rejects a mixed Testnet passphrase and non-Testnet endpoint", () => {
    expect(() =>
      parseTestnetConfig({
        networkPassphrase: STELLAR_TESTNET_CONFIG.networkPassphrase,
        horizonUrl: "https://horizon.stellar.org",
        explorerUrl: STELLAR_TESTNET_CONFIG.explorerUrl,
        uiLabel: STELLAR_TESTNET_CONFIG.uiLabel,
      }),
    ).toThrow(/Testnet/);
  });

  it("exposes only browser-safe network metadata", () => {
    expect(toPublicStellarConfig(STELLAR_TESTNET_CONFIG)).not.toHaveProperty("friendbotUrl");
    expect(Object.keys(toPublicStellarConfig(STELLAR_TESTNET_CONFIG)).sort()).toEqual(
      ["explorerUrl", "horizonUrl", "network", "networkPassphrase", "uiLabel"].sort(),
    );
  });
});
