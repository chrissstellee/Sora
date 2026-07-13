---
title: Phase 1 Sprint Plan — Wallet Authentication and Organization Isolation
status: proposed
capacity_validation: required
created: 2026-07-13
source_prd: prd.md
source_phase: mvp-phases.md
---

# Phase 1 Sprint Plan — Wallet Authentication and Organization Isolation

**Status: Proposed — capacity validation required**

## Sprint goal

Replace fake credential login with a verified Stellar wallet session and a server-protected Organization workspace in which every private read and write is scoped to the authenticated Organization.

## Outcome hypothesis

If Sora separates wallet connection from authentication, verifies wallet control through a single-use SEP-10 challenge, creates revocable server sessions, and derives Organization scope only from those sessions, then users can safely enter and restore a wallet-owned workspace without passwords, passkeys, or client-trusted tenant identifiers.

## Product and security decisions

- `/login` is wallet-only. Email, password, remember-me, forgot-password, and passkey authentication are removed.
- Wallet connection is not authentication. Application access begins only after server-side SEP-10 verification and session issuance.
- A first-time wallet completes SEP-10 before onboarding. It receives only a short-lived, single-use onboarding grant, not an Organization-authorized application session.
- Onboarding creates the Organization, owner user, wallet binding, and final session atomically.
- Organization name is required. Email is optional contact/profile data and is never used for login, recovery, identity matching, uniqueness, or authorization.
- No password or passkey is collected, generated, stored, or retained as a fallback.
- A returning wallet skips onboarding and restores its existing Organization after successful authentication.
- MVP cardinality is one wallet to one user to one Organization, with one owner user per Organization.
- Phase 1 uses the one configured Stellar Testnet environment. Mainnet and runtime network switching remain out of scope.
- Challenges have a five-minute fixed lifetime. Application sessions have an eight-hour fixed, non-rolling lifetime. Logout revokes the current session only.
- Server-side session revocation and cookie clearing define logout success. Wallet disconnect is best-effort cleanup after revocation.

## Planning assumptions

- Sprint duration, team capacity, and owners are unknown; no calendar commitment is implied.
- Relative sizes are XS, S, M, and L. Capacity must be validated before commitment.
- Phase 0 exit evidence, Testnet configuration, and ADR 0001 are available as inputs.
- The user reports Stellar Wallets Kit is already installed, so installation is not a story. P1-01 verifies the actual resolved package, version, imports, and adapter behavior before implementation.
- The current repository snapshot does not list Wallets Kit in `apps/web/package.json`, `pnpm-lock.yaml`, or installed modules. If that remains true at sprint start, it is a blocking prerequisite discrepancy and capacity must be revalidated; the team must not silently add unplanned installation or migration work.
- The active SEP-10 specification and the resolved Wallets Kit version are checked at implementation time because both standards and APIs can change.
- Every story requires its acceptance criteria and referenced requirements to pass.
- If all stories do not fit one sprint, preserve the dependency order and the phase exit gate. A partially protected application is not releasable Phase 1 behavior.

## Scope

**In scope:** Wallets Kit connection and Freighter demo support; wallet-only login; removal of email/password/passkey authentication; active SEP-10 challenge generation and verification; single-use challenge persistence; returning-user sessions; first-wallet onboarding grant; atomic Organization onboarding with optional contact email; secure session restoration and revocation; protected routes; a centralized Organization authorization boundary; tenant scoping of existing private data; successful wallet-login Activity Event; auth state/error UX; adversarial authentication, concurrency, and cross-Organization tests; replacement of ADR 0001 with the implemented Phase 1 trust boundary.

**Out of scope:** Wallets Kit installation work; email login, email verification, password reset, magic links, passkeys, recovery codes, and social login; using email for account recovery; multiple wallets per user; multiple users or roles per Organization; invites, Organization switching, and RBAC; wallet-loss recovery; Mainnet; production custody; asset persistence beyond the minimum seeded record needed to prove isolation; API keys, public REST APIs, and webhooks.

## Ordered stories

| ID    | Story / outcome                                                                              | Size | Dependency   | PRD references                                             |
| ----- | -------------------------------------------------------------------------------------------- | ---: | ------------ | ---------------------------------------------------------- |
| P1-01 | Verify the installed Wallets Kit integration and close the Phase 1 authentication contract   |    S | Phase 0 exit | FR-1, FR-2, FR-27; NFR-1–4, NFR-14                         |
| P1-02 | Add Organization-aware identity, challenge, session, and activity persistence                |    L | P1-01        | FR-2, FR-3, FR-5, FR-24; NFR-1, NFR-3, NFR-4, NFR-14       |
| P1-03 | Replace credential-era screens with wallet-only entry, onboarding, and explicit auth states  |    M | P1-01        | FR-1, FR-3, FR-27; NFR-4, NFR-18                           |
| P1-04 | Generate server-signed, wallet-bound, network-bound SEP-10 challenges                        |    L | P1-01–02     | FR-1, FR-2, FR-27; NFR-1–4, NFR-14–16, NFR-18              |
| P1-05 | Verify SEP-10 atomically and issue either a returning-user session or onboarding grant       |    L | P1-02, P1-04 | FR-2, FR-3, FR-27; NFR-1–4, NFR-14–16, NFR-18              |
| P1-06 | Atomically onboard a first-time authenticated wallet into one Organization                   |    L | P1-03, P1-05 | FR-3, FR-5, FR-27; NFR-1, NFR-3, NFR-4, NFR-10, NFR-18     |
| P1-07 | Restore, protect, expire, and revoke application sessions                                    |    L | P1-05–06     | FR-3, FR-4, FR-27; NFR-1–4, NFR-14–16, NFR-18              |
| P1-08 | Enforce one centralized Organization authorization boundary on every private operation       |    L | P1-02, P1-07 | FR-5; NFR-1, NFR-3, NFR-4, NFR-15, NFR-18                  |
| P1-09 | Record safe login activity and prove the complete authentication and isolation threat matrix |    M | P1-03–08     | FR-2, FR-4, FR-5, FR-24, FR-27; NFR-1–4, NFR-14–16, NFR-18 |

## Sprint acceptance criteria

The `P1-AC` identifiers below are sprint acceptance IDs, not PRD functional requirement IDs.

### P1-01 — Integration and trust-boundary contract

1. **P1-AC1.1:** The app resolves the already-installed Wallets Kit package from the workspace, records its exact version and import surface, and proves Freighter address selection, signing, rejection, disconnect, and network reporting against the chosen Testnet configuration.
2. **P1-AC1.2:** A failed package-resolution check blocks P1-03 through P1-05 and produces an explicit prerequisite issue; it is not silently converted into planned installation scope.
3. **P1-AC1.3:** A replacement ADR defines the complete Browser → Wallets Kit → Next.js authentication routes → Convex persistence/data authorization boundary, including how direct browser-to-Convex bypass is prevented.
4. **P1-AC1.4:** The ADR fixes the home domain, web-auth domain, Testnet passphrase, server signing-key ownership, five-minute challenge TTL, eight-hour fixed session TTL, cookie name/policy, current-session logout policy, and safe error-code vocabulary.
5. **P1-AC1.5:** The ADR records whether the endpoint returns a standards-compatible SEP-10 JWT or deliberately exchanges a verified SEP-10 response for Sora's opaque cookie session; any deviation from the active SEP-10 token response is explicit and tested.

### P1-02 — Organization-aware auth persistence

1. **P1-AC2.1:** Convex defines Organization, user/wallet identity, one-time auth challenge, hashed session, and Activity Event records with required indexes and lifecycle timestamps.
2. **P1-AC2.2:** The wallet mapping supports the MVP invariant of at most one user and one Organization per normalized wallet address, including concurrent creation attempts.
3. **P1-AC2.3:** Session persistence contains only a cryptographic token hash and safe metadata; raw tokens, cookies, signed XDR, wallet signatures, passwords, and passkeys are absent.
4. **P1-AC2.4:** Challenge persistence records only the data or digest required for wallet/network binding, expiry, atomic consumption, and replay detection; secret signing material remains outside Convex.
5. **P1-AC2.5:** Every existing private/tenant-owned record used for the isolation proof, including retained starter task records, has a required `organizationId` and an Organization-first query index.

### P1-03 — Wallet-only authentication UX

1. **P1-AC3.1:** `/login` contains no email, password, remember-me, forgot-password, passkey, or fake form-submit authentication path; its primary action is wallet connection and SEP-10 authentication.
2. **P1-AC3.2:** Password validation, password-strength UI, passkey components, and fake redirect hooks are removed when they have no remaining use.
3. **P1-AC3.3:** `/register` cannot create credentials or bypass wallet proof. It is either the authenticated onboarding view or redirects into the wallet-first flow.
4. **P1-AC3.4:** Onboarding requires Organization name, permits email to be omitted, and labels email as contact/profile information that is not used to sign in or recover access.
5. **P1-AC3.5:** The UI distinguishes disconnected, connecting, connected-not-authenticated, awaiting signature, verifying, onboarding-required, authenticated, wrong-network, rejected, expired, and recoverable-error states.

### P1-04 — SEP-10 challenge generation

1. **P1-AC4.1:** A Next.js server route generates a cryptographically random, server-signed challenge that conforms to the active SEP-10 structure and canonical Testnet configuration.
2. **P1-AC4.2:** The challenge is bound to the requested wallet address, Testnet passphrase, configured home/web-auth domains, and five-minute time bounds, and uses sequence number zero so it cannot be submitted to the ledger.
3. **P1-AC4.3:** Malformed addresses, unsupported networks, missing configuration, and rate-limit conditions return stable, user-safe errors and create no session.
4. **P1-AC4.4:** The browser verifies the server signature, network passphrase, sequence number, time bounds, expected first operation, and domain fields before asking the wallet to sign.
5. **P1-AC4.5:** Challenge issuance and error paths do not expose the server signing seed or other secret material to the browser, Convex, logs, analytics, or errors.

### P1-05 — Verification and identity continuation

1. **P1-AC5.1:** The verification route validates XDR structure, server signature, client signer/threshold, wallet identity, sequence number, time bounds, network passphrase, domains, and the matching unconsumed challenge before issuing any authorization state.
2. **P1-AC5.2:** Invalid, malformed, unsigned, wrong-signer, expired, replayed, wrong-network, wrong-home-domain, and wrong-web-auth-domain submissions fail without a session or onboarding grant.
3. **P1-AC5.3:** Challenge consumption is atomic. Parallel verification submissions for one challenge produce exactly one successful continuation.
4. **P1-AC5.4:** A known wallet receives a cryptographically random opaque session token in an `HttpOnly`, `SameSite=Lax`, path-scoped cookie that is `Secure` outside local development; Convex receives only its hash.
5. **P1-AC5.5:** An unknown wallet receives only a short-lived, wallet-bound, single-use onboarding grant. It cannot read protected Organization data or be treated as an application session.

### P1-06 — Atomic Organization onboarding

1. **P1-AC6.1:** A valid onboarding grant can create one Organization using a required name and create its owner/wallet identity with an optional email profile value.
2. **P1-AC6.2:** Organization, owner identity, wallet binding, onboarding-grant consumption, and final hashed session are committed atomically; failure leaves no orphan or partially authorized record.
3. **P1-AC6.3:** Retry and concurrent onboarding for the same wallet create at most one Organization/user binding and return a safe, deterministic result.
4. **P1-AC6.4:** Email omission succeeds. Email presence does not require uniqueness or verification and cannot create, restore, or recover a session.
5. **P1-AC6.5:** Re-authenticating the wallet resolves the same Organization and skips onboarding.

### P1-07 — Session lifecycle and protected routes

1. **P1-AC7.1:** Refresh restores an active session and Organization context from the server cookie without another wallet signature and without relying on Wallets Kit connection state.
2. **P1-AC7.2:** Missing, forged, unknown, expired, or revoked sessions cannot render protected content or invoke protected server behavior.
3. **P1-AC7.3:** Direct navigation to a protected route is denied server-side before private content renders; client-only redirects are insufficient.
4. **P1-AC7.4:** Logout atomically revokes the current server session, clears the cookie, clears client auth state, then attempts Wallets Kit disconnect without making revocation depend on disconnect success.
5. **P1-AC7.5:** Logout is idempotent, and replaying the prior cookie after logout fails.
6. **P1-AC7.6:** Wallet account or network change clears the authenticated client view and requires a new SEP-10 flow; it cannot inherit the prior session identity.

### P1-08 — Organization authorization and isolation

1. **P1-AC8.1:** One shared server authorization boundary rejects missing, expired, revoked, or inconsistent sessions and returns trusted `userId`, `walletAddress`, and `organizationId` context.
2. **P1-AC8.2:** Every private read and write derives Organization scope from that context. A client-supplied wallet, user, or Organization identifier is never authorization evidence.
3. **P1-AC8.3:** Protected Next.js and Convex call paths cannot be bypassed through direct client calls to an unguarded public function.
4. **P1-AC8.4:** Seeded Organization A cannot read, mutate, enumerate, or infer the existence of Organization B's records by changing identifiers, query filters, or direct function inputs.
5. **P1-AC8.5:** Authorization failures use non-disclosing responses and safe logs that do not reveal whether a foreign record exists.
6. **P1-AC8.6:** Missing, deleted, disabled, or inconsistent wallet/user/Organization mappings fail closed.

### P1-09 — Activity, threat tests, and verification

1. **P1-AC9.1:** Successful wallet authentication records an immutable Activity Event with Organization, actor, event type, timestamp, outcome, correlation ID, and safe metadata.
2. **P1-AC9.2:** Activity Events, logs, analytics, database records, and errors contain no raw session token, token hash used as a bearer credential, cookie, signed XDR, wallet signature, challenge nonce, signing seed, password, or passkey data.
3. **P1-AC9.3:** Automated tests cover all P1-04 through P1-08 rejection, replay, concurrency, restoration, logout, onboarding, route-protection, and cross-Organization cases.
4. **P1-AC9.4:** UI assertions or screenshots prove that login has no email/password/passkey path and onboarding treats email only as optional profile data.
5. **P1-AC9.5:** `pnpm verify` passes with no secret-scan finding and no regression to the Phase 0 Testnet boundary.
6. **P1-AC9.6:** A Phase 1 evidence matrix maps every phase exit condition to an automated test, CI run, or captured verification result.

## Execution order

Critical path: **P1-01 → P1-02 → P1-04 → P1-05 → P1-06 → P1-07 → P1-08 → P1-09**.

P1-03 can begin after P1-01 and run alongside P1-02 and P1-04 using the agreed auth-state and route contracts. P1-07 session work may begin for returning wallets while P1-06 onboarding is completed, but protected navigation is not accepted until both paths pass. P1-09 test fixtures and threat cases should be written with each story; the final evidence matrix remains last.

Security-path stories and negative tests are not de-scopable. Cosmetic auth-state polish may move if capacity is constrained, but the Phase 1 exit gate does not move.

## Phase exit gate / epic definition of done

Phase 1 exits only with:

- A package preflight proving the resolved Wallets Kit version/imports and Freighter behavior in the workspace.
- An accepted replacement for ADR 0001 that matches the implemented SEP-10, session-cookie, Convex, and direct-client authorization boundary.
- A valid wallet signature opening the protected dashboard, with first-time onboarding occurring exactly once and returning wallets skipping it.
- Automated rejection of invalid, unsigned, malformed, expired, replayed, wrong-signer, wrong-network, and wrong-domain challenges.
- A refresh restoring an unexpired session and logout immediately invalidating the prior cookie.
- Server-side denial of unauthenticated direct-route and direct-data-function access.
- Seeded cross-Organization read, write, enumeration, and non-disclosure tests passing at the data-function layer.
- Database and log inspection proving only hashed session state is persisted and no raw authentication material is stored or logged.
- UI evidence showing wallet-only login, no password/passkey path, and optional contact-only email during onboarding.
- A safe wallet-login Activity Event and a complete, passing Phase 1 evidence matrix.
- Passing `pnpm verify` with the Phase 0 Testnet safety boundary intact.

## Demo checkpoint

1. Open the wallet-only login page and show that no email, password, or passkey login exists.
2. Connect Freighter on Testnet, sign the SEP-10 challenge, and authenticate a new wallet.
3. Create an Organization with a required name and omit or optionally enter contact email.
4. Reach the protected dashboard, refresh, and show the same Organization context without signing again.
5. Log out, reopen the protected URL directly, and prove access is denied.
6. Authenticate the same wallet again and show that onboarding is skipped.
7. Demonstrate a wrong-network, expired, or replayed challenge failure with a safe recovery path.
8. Run the seeded cross-Organization denial suite and inspect the safe login event/session record.

## Risks and mitigations

- **Wallets Kit installation claim differs from repository state:** run P1-01 before commitment; block rather than hide dependency or API migration work.
- **Wallet connection is mistaken for authentication:** keep connected and authenticated states separate in types, UI, routes, and tests.
- **SEP-10 is only partially implemented:** use the active specification, replace ADR 0001, and test the full challenge structure, domains, network, signer, expiry, and replay behavior.
- **Opaque cookie sessions drift from interoperable SEP-10 token behavior:** document the deliberate boundary and test it, or return a standards-compatible token and exchange it safely according to the ADR.
- **An unknown wallet receives tenant access too early:** issue only an onboarding-limited continuation grant until atomic Organization provisioning succeeds.
- **Concurrent verification or onboarding creates duplicates:** use atomic challenge/grant consumption and wallet uniqueness enforcement with concurrency tests.
- **Client identifiers bypass tenancy:** derive Organization only from the verified session and test direct Next.js/Convex bypass attempts.
- **Middleware is treated as authorization:** enforce at every server/data operation; middleware or layouts provide routing UX only.
- **Logout disconnects the wallet but leaves a session alive:** revoke and clear server state first; treat wallet disconnect as best-effort.
- **Email is mistaken for a credential or recovery channel:** label it as optional contact data, exclude it from identity/session queries, and retain email verification/recovery out of scope.
- **Sensitive XDR or session material reaches persistence/logs:** use explicit redaction rules, safe event schemas, and automated secret/log assertions.

## Open ownership decisions

Before commitment, assign accountable owners for Wallets Kit/package preflight, replacement ADR approval, Next.js SEP-10/session routes, Convex schema and authorization boundary, auth/onboarding UX, adversarial test fixtures, security evidence review, and final phase-gate sign-off.

## Standards references

- Active SEP-10 specification: https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md
- Stellar Wallets Kit repository and current usage surface: https://github.com/Creit-Tech/Stellar-Wallets-Kit
