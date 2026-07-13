# ADR 0001: SEP-10, Next.js, and Convex boundary

Status: Accepted for Phase 0

## Decision

Phase 0 does not implement SEP-10. The Next.js browser receives only public Convex and canonical Stellar Testnet metadata; it must not create, accept, display, persist, or sign with issuer or distributor seeds.

The existing `@repo/backend` package owns shared Testnet configuration, domain contracts, transaction construction, and the isolated server-side spike. Convex currently remains the starter task schema: durable issuance records, custody, reconciliation jobs, and SEP-10 sessions are not implemented.

When SEP-10 is implemented, Next.js route handlers will verify SEP-10 challenges and own the secure session cookies. Convex will persist hashed session state and Organization state; it will not receive raw session tokens through this boundary.

## Alternatives

- Implement SEP-10 in a Next.js route now. Rejected because authentication is outside the Phase 0 risk spike.
- Generate or accept raw seeds in the browser. Rejected because this crosses the server-only signing boundary.
- Move the spike into Convex now. Rejected because that would imply product integration before persistence and custody are designed.

## Consequences

- The UI can identify Testnet without gaining signing authority.
- The spike remains a backend-local command, not a product issuance endpoint.
- Future integration must preserve the split between Next.js verification and secure-cookie ownership and Convex hashed-session and Organization persistence.
- Custody, authorization, expiration, revocation, and rotation controls still require implementation.

## Reconsideration trigger

Reconsider when authenticated Stellar accounts, durable issuance storage, or product-facing issuance begins, or when platform constraints prevent Next.js from owning secure cookies or Convex from persisting hashed session and Organization state. A replacement ADR must define the SEP-10 trust boundary, session-token handling, Convex persistence, signing/custody model, and secret controls first.
