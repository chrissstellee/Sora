# Phase 5 operator runbook

Status: Shipped procedure; live operator rehearsal and five-run release campaign not executed

Use this runbook only with the dedicated Sora `demo-testnet` deployment. It never authorizes Mainnet, production custody, Friendbot, raw database edits, ledger-history deletion, or exposure of seeds, cookies, boundary keys, signed XDR, or envelopes.

## Before the campaign

Phase 5 live acceptance is blocked until the Phase 2, Phase 3, and Phase 4 open rows in their evidence matrices are closed at one recorded revision. In particular, the funded issuer/distributor pair, Phase 4 crash/recovery matrix, authenticated browser matrix, and live issuance gate must pass before formal Phase 5 runs count.

From the repository root, verify the implementation:

```powershell
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm check:phase5-safety
```

Do not interpret those deterministic checks as live Testnet, browser, wallet, accessibility, performance, or five-run evidence.

## Private configuration checklist

Configure values in the appropriate private Next.js, Convex, or operator environment. Do not paste their values into tickets, logs, screenshots, or evidence.

- `CONVEX_URL`
- `CONVEX_SERVER_BOUNDARY_KEY`
- `PHASE5_OPERATOR_KEY`
- `SORA_DEPLOYMENT_TIER=demo-testnet`
- `PHASE5_DEMO_ORGANIZATION_ID`
- `PHASE5_OPERATOR_USER_ID`
- `PHASE5_FREIGHTER_PUBLIC_KEY`
- approved `STELLAR_TESTNET_ISSUER_PUBLIC_KEY` and `STELLAR_TESTNET_DISTRIBUTOR_PUBLIC_KEY`
- matching server-only issuer and distributor seeds
- `PHASE5_FAULTS_ENABLED=true` only for the controlled recovery run

For deployed browser, performance, and isolation runs, configure the private operator process with:

- `PHASE5_BASE_URL`
- `PHASE5_ORG_A_SESSION_COOKIE`
- `PHASE5_ORG_B_SESSION_COOKIE`
- `PHASE5_ASSET_ID`
- `PHASE5_PERF_ASSET_ID` for the non-formal performance fixture
- `PHASE5_REVISION` for the exact 40-character deployed release commit
- `PHASE5_SEED_ID` for the named deterministic performance corpus

Use raw cookie values only; never commit or print them.

## Prepare and preflight one run

1. Create the next run namespace:

   ```powershell
   pnpm phase5:prepare -- --request-id <operator-generated-uuid> --browser-target chromium-freighter
   ```

2. Record the returned `runId` and generated `assetCode`. Repeating the same request ID is safe and returns the same run. Do not invoke prepare with a new request ID while a run is `Prepared` or `Active`.

3. Run preflight:

   ```powershell
   pnpm phase5:preflight -- --run-id <run-id>
   ```

4. Continue only when `passed` is `true` and every durable check is `Pass`. A `Fail` or `Not Executed` result blocks the formal attempt.

The command must show the exact Testnet deployment, worker health, unique run identity, fresh Organization session, matching Freighter operator target, no active source/ownership lease or issuance, custody and on-chain signer state, numeric source sequences, funded reserve-ready accounts, fresh Horizon ledger/clock, and available Testnet explorer. It never returns seed material.

## Timed happy path

Start the under-ten-minute timer when the run is prepared; the implementation records `startedAt` during prepare.

1. In Chromium, connect Freighter and complete SEP-10 authentication for the configured demo Organization.
2. Create exactly one Asset Record. The server attaches it to the active/prepared run.
3. Add one Supporting Document, complete the token proposal using the generated asset code, submit review, and approve the asset to `Ready`.
4. Open the Tokenization Queue and request issuance once. Never submit a second logical issuance for the same run.
5. Confirm the distributor Trustline when prompted. Refresh is safe while the issuance is pending.
6. Wait for the server-owned flow to reach `Confirmed` and the asset to reach `Active`. Open the validated transaction and ledger proof links.
7. Open `/ownership-registry?assetId=<asset-id>`. Wait for confirmed and observed supply to match. Record the exact asset identity, holder count, holder balances, first/last observed ledger when present, synchronization time, and snapshot hash.
8. Open account, asset, issuer, distributor, transaction, and ledger links independently. If a link is absent, treat that proof as unavailable.
9. Open `/activity-log`, filter by the run ID, and verify one coherent run history. Do not treat polling or unchanged refreshes as missing customer Activity.
10. Refresh the browser or establish a new valid session and confirm the same persisted issuance, ownership proof, and Activity history.

## Controlled ambiguous-submission run

At least one of the five formal runs must use this branch.

1. Ensure the run is `Active`, the authorized operator and Organization match, and `PHASE5_FAULTS_ENABLED=true` only in the demo Testnet environment.
2. Arm the one-shot fault before issuance submission:

   ```powershell
   pnpm phase5:fault:arm -- --run-id <run-id>
   ```

3. Request issuance once. The fault is consumed after submission acceptance but before local result persistence.
4. Expect an ambiguous/submitted or reconciling state. Do not create another issuance, change the asset code, clear records, or submit an ad hoc Stellar transaction.
5. Use the product's Resume action. Recovery must use the persisted hash, source sequence, and original transaction identity.
6. Wait for conclusive reconciliation. The acceptable end state is one confirmed ledger payment, one confirmed issuance, one Active transition, one ownership proof, and Activity containing `demo.fault_armed`, `demo.fault_consumed`, reconciliation, and confirmation history.
7. If the result remains `Needs review` or inconclusive, stop the formal run and escalate with sanitized public identifiers. It does not count toward the five passes.

## Finalize one run

After the complete journey and independent proof checks, generate the live manifest:

```powershell
pnpm phase5:evidence -- --run-id <run-id>
```

The command rechecks the under-ten-minute limit, preflight, one Active asset, one confirmed payment identity, reconciled pinned ownership snapshot, required Activity events, recovery evidence when applicable, and the live Horizon transaction proof. A failure leaves no new manifest. A successful call creates one immutable JSON file under `docs/phase-5/evidence/runs` and refuses to overwrite an existing file.

Set `PHASE5_REVISION` to the exact 40-character release commit when the run is performed. Do not use a dirty-working-tree description as a release revision.

Repeat prepare, preflight, journey, proof checks, and evidence capture until five consecutive runs pass at the same exact revision. Do not edit code or configuration between counted attempts. Then run:

```powershell
pnpm check:phase5-manifests
```

The gate requires at least five sanitized manifests, one common revision, and at least one `after-submit-before-result-persist` recovery run.

## Browser, accessibility, and performance evidence

Install all three Playwright engines once:

```powershell
pnpm phase5:browser:install
```

With the deployed URL and private session variables configured:

```powershell
pnpm phase5:seed
pnpm phase5:perf
pnpm phase5:e2e
```

Retain `test-results/phase5/performance.json`, the per-engine trace ZIPs, command output, and failure artifacts. The report includes raw and p95 dashboard/API/rendered-search timings, cold/warm cache classification, preview origin, browser versions, exact revision, seed ID, selected asset, debounce-inclusive asset searches, and obsolete-request ownership searches.

Separately record:

- real SEP-10/Freighter completion in Chromium
- keyboard-only happy and recovery paths
- visible focus, labels, announcements, non-color states, and reduced motion
- a manual NVDA/Chrome pass

Do not claim Freighter support for Firefox or WebKit unless separately proven by a supported wallet environment.

## Recovery branches

| Condition                          | Safe operator action                                                               | Formal-run effect                       |
| ---------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------- |
| Preflight `Fail`                   | Follow the returned safe action, then rerun preflight                              | Run does not start                      |
| Preflight `Not Executed`           | Restore the missing dependency, then rerun                                         | Run does not start                      |
| Horizon lag or outage before proof | Keep last-good data visible; wait and request one authorized refresh               | Do not finalize                         |
| Ownership supply mismatch          | Preserve last-good snapshot; wait for ledger convergence and refresh               | Do not label zero or complete           |
| Manual refresh throttled           | Wait for `retryAfterMs`; do not create parallel refreshes                          | No data loss                            |
| Explorer outage                    | Use Sora's saved proof identifiers; retry explorer later                           | Do not claim independent explorer check |
| Session expired                    | Reauthenticate with the approved wallet; do not alter run records                  | Resume same run if still valid          |
| Ambiguous issuance                 | Use Resume and wait for hash/sequence reconciliation                               | Never blind-retry                       |
| `Needs review`                     | Stop and escalate with sanitized run ID, asset identity, hash, and ledger evidence | Attempt does not count                  |
| Evidence gate failure              | Fix only the documented external/run condition; never edit data or manifests       | Attempt does not count                  |
| Ten-minute limit exceeded          | Preserve records, prepare a later new run after review                             | Attempt does not count                  |

## Reset semantics

The supported reset is private and non-destructive:

```powershell
pnpm phase5:reset -- --run-id <run-id>
```

Use it only to close the named `Prepared` or `Active` attempt as `Fail` before preparing a new namespace. It refuses to run while that run has a `Pending` or `Submitted` issuance; reconcile active work first. Reset records completion and `operator-reset`, clears only an `Armed` controlled fault, and preserves all prior run, asset, issuance, transaction-attempt, reconciliation, Activity, ownership, and Stellar history. A reset attempt never counts as one of the five passes.

Do not work around a reset refusal with a raw database edit, record deletion, status rewrite, code/configuration change, or ad hoc Stellar transaction. Escalate if active work cannot be reconciled safely.

## Release decision

Phase 5 exits only when [the evidence matrix](evidence-matrix.md) has no required `Fail` or `Not Executed` row, the five live manifests pass verification at one release commit, and a prepared operator completes the runbook without developer coaching or undocumented repair.
