import { describe, expect, it } from "vitest";

import {
  ACTIVITY_EVENT_TYPES,
  ACTIVITY_REGISTRY,
  canonicalActivityType,
  canonicalizeActivityInput,
} from "./activity.js";

describe("Phase 5 Activity registry", () => {
  it("has a definition for every canonical event and maps durable legacy names", () => {
    expect(Object.keys(ACTIVITY_REGISTRY).sort()).toEqual([...ACTIVITY_EVENT_TYPES].sort());
    expect(canonicalActivityType("wallet_login")).toBe("auth.wallet_login");
    expect(canonicalActivityType("asset.approved")).toBe("asset.review_approved");
    expect(canonicalActivityType("unknown.event")).toBeUndefined();
  });

  it("creates bounded allowlisted metadata", () => {
    expect(
      canonicalizeActivityInput({
        eventType: "issuance.confirmed",
        actorKind: "system",
        subjectId: "issuance-1",
        outcome: "success",
        correlationId: "correlation-1",
        runId: "run-1",
        metadata: { network: "Testnet", amount: "25.0000000", ledger: 123 },
      }),
    ).toMatchObject({
      subjectType: "issuance",
      metadata: '{"network":"Testnet","amount":"25.0000000","ledger":123}',
    });
  });

  it("rejects the wrong actor and secret-bearing or unknown metadata", () => {
    expect(() =>
      canonicalizeActivityInput({
        eventType: "issuance.confirmed",
        actorKind: "user",
        subjectId: "issuance-1",
        outcome: "success",
        correlationId: "correlation-1",
      }),
    ).toThrow("ACTIVITY_ACTOR_INVALID");
    expect(() =>
      canonicalizeActivityInput({
        eventType: "demo.run_prepared",
        actorKind: "system",
        subjectId: "run-1",
        outcome: "success",
        correlationId: "correlation-1",
        metadata: { sessionToken: "forbidden" },
      }),
    ).toThrow("ACTIVITY_METADATA_NOT_ALLOWED");
  });

  it("enumerates every material state-changing module through the canonical writer", async () => {
    const expectedByModule = {
      "auth.ts": ["auth.wallet_login", "auth.wallet_onboarded"],
      "assets.ts": ["asset.created", "asset.updated"],
      "documents.ts": ["document.uploaded", "document.replaced", "document.deleted"],
      "tokenization.ts": [
        "asset.token_proposal_updated",
        "asset.review_submitted",
        "asset.review_returned",
        "asset.review_approved",
        "asset.archived",
      ],
      "issuances.ts": [
        "issuance.requested",
        "issuance.preflight_failed",
        "issuance.submitted",
        "issuance.resumed",
        "issuance.reconciling",
        "issuance.trustline_confirmed",
        "issuance.confirmed",
      ],
      "ownership.ts": ["ownership.proof_published"],
      "demo.ts": [
        "demo.run_prepared",
        "demo.preflight_completed",
        "demo.fault_armed",
        "demo.fault_consumed",
        "demo.run_completed",
      ],
    } as const;
    for (const [file, eventTypes] of Object.entries(expectedByModule)) {
      const source = await readFile(new URL(`../../convex/${file}`, import.meta.url), "utf8");
      expect(source, `${file} must use recordActivity`).toContain("recordActivity(ctx");
      for (const eventType of eventTypes) {
        expect(source, `${file} must emit ${eventType}`).toContain(`"${eventType}"`);
      }
    }
  });
});
import { readFile } from "node:fs/promises";
