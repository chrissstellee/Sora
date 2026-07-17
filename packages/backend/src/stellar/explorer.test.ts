import { Keypair } from "@stellar/stellar-sdk";
import { describe, expect, it } from "vitest";

import { stellarExpertUrl } from "./explorer.js";

const account = Keypair.random().publicKey();

describe("typed StellarExpert Testnet links", () => {
  it("constructs only known resource links under the fixed Testnet base", () => {
    expect(stellarExpertUrl({ resource: "account", id: account })).toBe(
      `https://stellar.expert/explorer/testnet/account/${account}`,
    );
    expect(stellarExpertUrl({ resource: "tx", id: "A".repeat(64) })).toBe(
      `https://stellar.expert/explorer/testnet/tx/${"a".repeat(64)}`,
    );
    expect(stellarExpertUrl({ resource: "ledger", id: 42 })).toBe(
      "https://stellar.expert/explorer/testnet/ledger/42",
    );
    expect(stellarExpertUrl({ resource: "asset", code: "SORA5", issuer: account })).toBe(
      `https://stellar.expert/explorer/testnet/asset/SORA5-${account}`,
    );
  });

  it("rejects path, query, fragment, scheme, network, and identifier injection", () => {
    expect(stellarExpertUrl({ resource: "account", id: `${account}/../mainnet` })).toBeNull();
    expect(stellarExpertUrl({ resource: "tx", id: `${"a".repeat(63)}?x` })).toBeNull();
    expect(stellarExpertUrl({ resource: "ledger", id: "1#mainnet" })).toBeNull();
    expect(
      stellarExpertUrl({ resource: "asset", code: "SORA/../../mainnet", issuer: account }),
    ).toBeNull();
    expect(
      stellarExpertUrl({ resource: "asset", code: "SORA", issuer: "https://evil.test" }),
    ).toBeNull();
  });
});
