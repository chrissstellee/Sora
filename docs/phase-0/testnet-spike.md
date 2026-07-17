# Server-side Testnet issuance spike

The Phase 0 spike proves the minimum classic Stellar flow: create a distributor Trustline for an issuer's asset, send the asset from the issuer, and verify the distributor's balance through Horizon. It is deliberately isolated in `packages/backend/src/stellar/spike.ts`; it is not a product issuance endpoint or a reusable custody service.

## Safety boundary

- Stellar Testnet only; the transaction builders use the canonical Testnet passphrase.
- Server-side execution only through the backend package.
- New issuer and distributor keypairs for every run.
- Friendbot funds only the public accounts.
- Secret seeds remain in process memory and are neither persisted nor logged.
- Public account IDs, transaction hashes, ledgers, and explorer links may be written to sanitized evidence.
- Submission ambiguity never causes an automatic retry.
- Friendbot and Horizon access are excluded from deterministic CI.

## Run the spike

Prerequisites are Node.js 22, pnpm 10.25.0, installed dependencies, and outbound access to Stellar Testnet Horizon and Friendbot.

From the repository root:

```bash
pnpm --filter @repo/backend spike:testnet
```

The command overwrites `docs/phase-0/evidence/testnet-issuance.json`. Review the resulting diff before committing it. Do not run the command with production account material or replace the generated keypairs with reusable seeds.

## Observed flow

1. Generate random issuer and distributor keypairs in memory.
2. Fund both public accounts through Horizon's Friendbot client.
3. Load each account to capture its starting sequence.
4. Build the distributor's `changeTrust` transaction with a limit of `1000` and precompute its hash before signing and submission.
5. Submit the Trustline once. If submission is uncertain, query Horizon by the precomputed hash; if that lookup also fails, load the source account sequence, emit a sanitized ambiguity error, and stop without retrying.
6. Reload the issuer, build an issuer-to-distributor payment of `25`, precompute its hash, sign, and use the same submit-or-reconcile procedure.
7. Reload the distributor and require the asset balance to equal `25.0000000`.
8. Sanitize the selected public results and write the evidence JSON.

## Checked-in live evidence

The preserved receipt is [evidence/testnet-issuance.json](evidence/testnet-issuance.json). It records a successful run on 2026-07-13.

| Field                  | Observed value                                                     |
| ---------------------- | ------------------------------------------------------------------ |
| Network                | Stellar Testnet                                                    |
| Asset code             | `SORARJ9PGBJ`                                                      |
| Issued amount          | `25`                                                               |
| Trustline limit        | `1000`                                                             |
| Trustline transaction  | `a278faa82d25786f920ae95e259048e3a3f5e1c9617f2ae7d8438f9f202275a0` |
| Trustline ledger       | `3586695`                                                          |
| Payment transaction    | `29448364e610ee6e91bd94b2c099a691cabe78799d156bf3396b919735575adc` |
| Payment ledger         | `3586696`                                                          |
| Post-operation balance | `25.0000000`                                                       |
| Post-operation limit   | `1000.0000000`                                                     |

For both operations, the recorded submission hash equals the precomputed hash, `successful` is `true`, and `reconciledAfterUncertainSubmission` is `false`. The receipt also contains the public issuer and distributor IDs, their pre-operation sequences, Trustline existence before and after, last-modified ledger, and Testnet explorer links for both accounts and transactions.

The field `authorizationToMaintainLiabilities` is `[REDACTED]` because the generic sanitizer treats authorization-named fields as sensitive. The evidence proves the required Trustline, limit, balance, hashes, and ledgers without depending on that field.

## Evidence handling

The sanitizer recursively redacts keys associated with secrets, seeds, private material, authorization, API keys, or environment dumps. It also redacts seed-shaped values, API-key-shaped values, private-key markers, and bearer tokens in strings. Errors pass through the same text redaction before logging.

The repository scanner fails on Stellar seed patterns, production-looking API keys, private-key markers, and credential assignments. It reports only file names and finding categories, never the matched values.

If a seed appears in output or a committed artifact, discard the generated accounts, remove the unsafe artifact from the change set, regenerate the evidence with fresh accounts, and rerun `pnpm scan:secrets`.

## CI behavior

`.github/workflows/ci.yml` supplies public Testnet metadata and runs `pnpm verify`. It does not execute `spike:testnet`, call Friendbot, require funded accounts, or submit transactions. This keeps pull-request verification deterministic while retaining the live receipt as separate risk-spike evidence.
