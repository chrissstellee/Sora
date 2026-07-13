import { Buffer } from "node:buffer";

import {
  Account,
  Asset,
  BASE_FEE,
  Keypair,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { describe, expect, it } from "vitest";

import {
  buildIssuancePaymentTransaction,
  buildTrustlineTransaction,
  precomputedHash,
} from "./transactions.js";

const issuer = Keypair.fromRawEd25519Seed(Buffer.from(Array.from({ length: 32 }, (_, i) => i + 1)));
const distributor = Keypair.fromRawEd25519Seed(
  Buffer.from(Array.from({ length: 32 }, (_, i) => 32 - i)),
);

describe("classic Testnet envelopes", () => {
  it("builds distributor changeTrust with a stable precomputed hash", () => {
    const tx = buildTrustlineTransaction({
      sourceAccount: distributor.publicKey(),
      sourceSequence: "41",
      assetCode: "SORA0",
      issuerAccount: issuer.publicKey(),
      limit: "1000",
    });
    expect(tx.source).toBe(distributor.publicKey());
    expect(tx.operations[0]).toMatchObject({ type: "changeTrust", limit: "1000.0000000" });
    expect(precomputedHash(tx)).toMatch(/^[a-f0-9]{64}$/);
    const mainnetTx = new TransactionBuilder(new Account(distributor.publicKey(), "41"), {
      fee: BASE_FEE,
      networkPassphrase: Networks.PUBLIC,
    })
      .setTimeout(60)
      .addOperation(
        Operation.changeTrust({ asset: new Asset("SORA0", issuer.publicKey()), limit: "1000" }),
      )
      .build();
    expect(precomputedHash(tx)).not.toBe(precomputedHash(mainnetTx));
  });
  it("builds issuer payment to the distributor on Testnet", () => {
    const tx = buildIssuancePaymentTransaction({
      sourceAccount: issuer.publicKey(),
      sourceSequence: "7",
      assetCode: "SORA0",
      distributorAccount: distributor.publicKey(),
      amount: "25",
    });
    expect(tx.source).toBe(issuer.publicKey());
    expect(tx.operations[0]).toMatchObject({
      type: "payment",
      destination: distributor.publicKey(),
      amount: "25.0000000",
    });
    expect(precomputedHash(tx)).toBe(precomputedHash(tx));
  });
});
