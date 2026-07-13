import { describe, expect, it } from "vitest";
import { Keypair, TransactionBuilder } from "@stellar/stellar-sdk";
import { generateSEP10Challenge, verifyChallengeMatch, verifySEP10Challenge } from "./auth.js";

describe("auth tests", () => {
  it("generates, signs, matches, and verifies SEP-10 challenge", () => {
    const serverKeypair = Keypair.random();
    const clientKeypair = Keypair.random();
    const homeDomain = "localhost:3000";
    const webAuthDomain = "localhost:3000";
    const networkPassphrase = "Test SDF Network ; September 2015";

    // 1. Generate challenge
    const unsignedXdr = generateSEP10Challenge(
      serverKeypair.secret(),
      clientKeypair.publicKey(),
      homeDomain,
      webAuthDomain,
      networkPassphrase,
    );

    // 2. Sign transaction on client side
    const tx = TransactionBuilder.fromXDR(unsignedXdr, networkPassphrase);
    tx.sign(clientKeypair);
    const signedXdr = tx.toXDR();

    // 3. Verify they match
    const isMatch = verifyChallengeMatch(signedXdr, unsignedXdr, networkPassphrase);
    expect(isMatch).toBe(true);

    // 4. Verify mismatch for a different client
    const clientKeypair2 = Keypair.random();
    const unsignedXdr2 = generateSEP10Challenge(
      serverKeypair.secret(),
      clientKeypair2.publicKey(),
      homeDomain,
      webAuthDomain,
      networkPassphrase,
    );
    const isMatch2 = verifyChallengeMatch(signedXdr, unsignedXdr2, networkPassphrase);
    expect(isMatch2).toBe(false);

    // 5. Verify SEP-10 challenge verification
    const isValid = verifySEP10Challenge(
      signedXdr,
      serverKeypair.publicKey(),
      clientKeypair.publicKey(),
      homeDomain,
      webAuthDomain,
      networkPassphrase,
    );
    expect(isValid).toBe(true);
  });
});
