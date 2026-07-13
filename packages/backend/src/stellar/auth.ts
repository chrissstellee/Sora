import { Keypair, WebAuth, TransactionBuilder } from "@stellar/stellar-sdk";

export { Keypair };

/**
 * Generates a SEP-10 challenge transaction XDR.
 * @param serverSeed The server's secret key (seed) to sign the challenge transaction.
 * @param clientAddress The public address of the client wallet.
 * @param homeDomain The home domain configured for the service (e.g., localhost:3000).
 * @param webAuthDomain The web authentication domain (e.g., localhost:3000).
 * @param networkPassphrase The network passphrase (e.g. Test SDF Network ; September 2015).
 * @returns The base64-encoded challenge transaction XDR.
 */
export function generateSEP10Challenge(
  serverSeed: string,
  clientAddress: string,
  homeDomain: string,
  webAuthDomain: string,
  networkPassphrase: string,
): string {
  const serverKeypair = Keypair.fromSecret(serverSeed);
  const timeoutSeconds = 300; // 5 minutes TTL

  return WebAuth.buildChallengeTx(
    serverKeypair,
    clientAddress,
    homeDomain,
    timeoutSeconds,
    networkPassphrase,
    webAuthDomain,
  );
}

/**
 * Verifies the signatures on a SEP-10 challenge transaction.
 * Throws an error if signature verification fails.
 * @param challengeXdr The base64-encoded challenge transaction XDR (with client signatures).
 * @param serverPublicKey The server's public key.
 * @param clientAddress The expected client wallet address.
 * @param homeDomain The expected home domain.
 * @param webAuthDomain The expected web authentication domain.
 * @param networkPassphrase The network passphrase.
 * @returns true if valid, throws otherwise.
 */
export function verifySEP10Challenge(
  challengeXdr: string,
  serverPublicKey: string,
  clientAddress: string,
  homeDomain: string,
  webAuthDomain: string,
  networkPassphrase: string,
): boolean {
  // verifyChallengeTxSigners parses the transaction, checks expiration,
  // validates server signature, and checks client signature matches one of the provided client signers.
  const signersFound = WebAuth.verifyChallengeTxSigners(
    challengeXdr,
    serverPublicKey,
    networkPassphrase,
    [clientAddress],
    homeDomain,
    webAuthDomain,
  );

  if (!signersFound || !signersFound.includes(clientAddress)) {
    throw new Error(`Signature for client address ${clientAddress} not found in the transaction`);
  }

  return true;
}

/**
 * Verifies that the signed challenge XDR matches the stored challenge XDR by comparing their transaction hashes.
 * @param signedXdr The signed challenge transaction XDR.
 * @param storedXdr The original unsigned challenge transaction XDR.
 * @param networkPassphrase The network passphrase.
 */
export function verifyChallengeMatch(
  signedXdr: string,
  storedXdr: string,
  networkPassphrase: string,
): boolean {
  try {
    const txSigned = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
    const txStored = TransactionBuilder.fromXDR(storedXdr, networkPassphrase);
    return txSigned.hash().toString("hex") === txStored.hash().toString("hex");
  } catch (err) {
    return false;
  }
}
