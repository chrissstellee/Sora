# Phase 5 evidence

This directory defines the sanitized per-run manifest contract. It does not contain live evidence.

- [`manifest.schema.json`](manifest.schema.json) is the documentation schema for a per-run manifest.
- [`manifest.example.json`](manifest.example.json) is placeholder data with outcome `Not Executed`. It is not proof and must never be copied into `runs`.
- `runs/` is created only by a successful `pnpm phase5:evidence -- --run-id <run-id>` command.

## Evidence rules

1. Run evidence is generated only after the server rechecks preflight, one Active run asset, one confirmed payment identity, equal confirmed/observed ownership supply, required Activity events, recovery evidence when applicable, the ten-minute limit, and the live Horizon transaction proof.
2. The generator uses exclusive creation. Never edit, overwrite, rename to conceal sequence, or hand-author a live run manifest.
3. `revision` must be the exact 40-character release commit. A dirty-working-tree description is not acceptable.
4. Do not include seeds, private keys, session or cookie values, boundary/operator keys, signed XDR, envelopes, raw provider responses, document content, stack traces, or unrestricted exceptions.
5. Retain external artifacts referenced by the release matrix—browser traces, screenshots, raw timings, accessibility records, and sanitized Testnet receipts—without embedding private data in the run manifest.
6. Five consecutive live manifests at one revision are required. At least one must have `recoveryScenario` equal to `after-submit-before-result-persist`.

Validate the live directory from the repository root:

```powershell
pnpm check:phase5-manifests
```

With no `runs` directory or fewer than five manifests, the command deliberately reports `Not Executed`. That is a release blocker, not a verifier failure to work around.
