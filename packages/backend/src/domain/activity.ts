import { z } from "zod";

export const ACTIVITY_EVENT_TYPES = [
  "auth.wallet_login",
  "auth.wallet_onboarded",
  "asset.created",
  "asset.updated",
  "asset.token_proposal_updated",
  "asset.review_submitted",
  "asset.review_returned",
  "asset.review_approved",
  "asset.archived",
  "document.uploaded",
  "document.replaced",
  "document.deleted",
  "issuance.requested",
  "issuance.preflight_failed",
  "issuance.submitted",
  "issuance.resumed",
  "issuance.reconciling",
  "issuance.trustline_confirmed",
  "issuance.confirmed",
  "issuance.failed",
  "ownership.proof_published",
  "demo.run_prepared",
  "demo.preflight_completed",
  "demo.fault_armed",
  "demo.fault_consumed",
  "demo.run_completed",
] as const;

export type ActivityEventType = (typeof ACTIVITY_EVENT_TYPES)[number];
export type ActivityActorKind = "user" | "system";

interface ActivityDefinition {
  actor: ActivityActorKind | "either";
  subject:
    | "session"
    | "organization"
    | "asset"
    | "document"
    | "issuance"
    | "ownership"
    | "demo-run";
  allowedMetadata: readonly string[];
}

const proofMetadata = [
  "network",
  "transactionHash",
  "ledger",
  "account",
  "assetCode",
  "issuerAccount",
];

export const ACTIVITY_REGISTRY = {
  "auth.wallet_login": { actor: "user", subject: "session", allowedMetadata: ["walletAddress"] },
  "auth.wallet_onboarded": { actor: "user", subject: "organization", allowedMetadata: [] },
  "asset.created": { actor: "user", subject: "asset", allowedMetadata: ["lifecycle"] },
  "asset.updated": {
    actor: "user",
    subject: "asset",
    allowedMetadata: ["changedFields", "lifecycle"],
  },
  "asset.token_proposal_updated": {
    actor: "user",
    subject: "asset",
    allowedMetadata: ["assetCode", "network"],
  },
  "asset.review_submitted": { actor: "user", subject: "asset", allowedMetadata: ["manifestId"] },
  "asset.review_returned": {
    actor: "user",
    subject: "asset",
    allowedMetadata: ["manifestId", "reason"],
  },
  "asset.review_approved": {
    actor: "user",
    subject: "asset",
    allowedMetadata: ["manifestId", "lifecycle"],
  },
  "asset.archived": { actor: "user", subject: "asset", allowedMetadata: ["lifecycle"] },
  "document.uploaded": {
    actor: "user",
    subject: "document",
    allowedMetadata: ["mediaType", "byteSize"],
  },
  "document.replaced": {
    actor: "user",
    subject: "document",
    allowedMetadata: ["mediaType", "byteSize"],
  },
  "document.deleted": { actor: "user", subject: "document", allowedMetadata: [] },
  "issuance.requested": {
    actor: "user",
    subject: "issuance",
    allowedMetadata: ["network", "assetCode"],
  },
  "issuance.preflight_failed": {
    actor: "system",
    subject: "issuance",
    allowedMetadata: ["safeErrorCode"],
  },
  "issuance.submitted": { actor: "system", subject: "issuance", allowedMetadata: proofMetadata },
  "issuance.resumed": { actor: "user", subject: "issuance", allowedMetadata: ["safeState"] },
  "issuance.reconciling": {
    actor: "system",
    subject: "issuance",
    allowedMetadata: ["safeState", "transactionHash"],
  },
  "issuance.trustline_confirmed": {
    actor: "system",
    subject: "issuance",
    allowedMetadata: proofMetadata,
  },
  "issuance.confirmed": {
    actor: "system",
    subject: "issuance",
    allowedMetadata: [...proofMetadata, "amount"],
  },
  "issuance.failed": {
    actor: "system",
    subject: "issuance",
    allowedMetadata: ["safeErrorCode", "safeState"],
  },
  "ownership.proof_published": {
    actor: "system",
    subject: "ownership",
    allowedMetadata: [
      "snapshotId",
      "contentHash",
      "holderCount",
      "observedSupply",
      "confirmedSupply",
      ...proofMetadata,
    ],
  },
  "demo.run_prepared": {
    actor: "system",
    subject: "demo-run",
    allowedMetadata: ["assetCode", "environment", "browserTarget"],
  },
  "demo.preflight_completed": {
    actor: "system",
    subject: "demo-run",
    allowedMetadata: ["status", "checkCount"],
  },
  "demo.fault_armed": { actor: "user", subject: "demo-run", allowedMetadata: ["faultPoint"] },
  "demo.fault_consumed": {
    actor: "system",
    subject: "demo-run",
    allowedMetadata: ["faultPoint"],
  },
  "demo.run_completed": {
    actor: "system",
    subject: "demo-run",
    allowedMetadata: ["status", "durationMs", "recoveryScenario"],
  },
} as const satisfies Record<ActivityEventType, ActivityDefinition>;

const safeScalar = z.union([z.string().max(500), z.number().finite(), z.boolean(), z.null()]);
const safeValue = z.union([safeScalar, z.array(safeScalar).max(50)]);
const forbiddenKey =
  /(?:secret|seed|private|session|cookie|boundary|credential|password|token|xdr|envelope|raw|exception|stack)/i;

export interface CanonicalActivityInput {
  eventType: ActivityEventType;
  actorKind: ActivityActorKind;
  subjectId: string;
  outcome: "success" | "failure" | "pending";
  correlationId: string;
  runId?: string;
  metadata?: Record<string, unknown>;
}

export function canonicalizeActivityInput(input: CanonicalActivityInput) {
  const definition: ActivityDefinition = ACTIVITY_REGISTRY[input.eventType];
  if (definition.actor !== "either" && definition.actor !== input.actorKind) {
    throw new Error("ACTIVITY_ACTOR_INVALID");
  }
  if (!input.subjectId.trim() || input.subjectId.length > 200) {
    throw new Error("ACTIVITY_SUBJECT_INVALID");
  }
  if (!input.correlationId.trim() || input.correlationId.length > 200) {
    throw new Error("ACTIVITY_CORRELATION_INVALID");
  }
  if (input.runId !== undefined && (!input.runId.trim() || input.runId.length > 100)) {
    throw new Error("ACTIVITY_RUN_INVALID");
  }

  const metadata: Record<
    string,
    string | number | boolean | null | Array<string | number | boolean | null>
  > = {};
  for (const [key, rawValue] of Object.entries(input.metadata ?? {})) {
    if (forbiddenKey.test(key) || !definition.allowedMetadata.includes(key)) {
      throw new Error("ACTIVITY_METADATA_NOT_ALLOWED");
    }
    metadata[key] = safeValue.parse(rawValue);
  }
  const metadataJson = JSON.stringify(metadata);
  if (metadataJson.length > 4_000) throw new Error("ACTIVITY_METADATA_TOO_LARGE");

  return {
    eventType: input.eventType,
    actorKind: input.actorKind,
    subjectType: definition.subject,
    subjectId: input.subjectId.trim(),
    outcome: input.outcome,
    correlationId: input.correlationId.trim(),
    runId: input.runId?.trim(),
    metadata: metadataJson,
  };
}

export const LEGACY_ACTIVITY_TYPE_MAP: Readonly<Record<string, ActivityEventType>> = {
  wallet_login: "auth.wallet_login",
  wallet_onboard: "auth.wallet_onboarded",
  "asset.created": "asset.created",
  "asset.updated": "asset.updated",
  "asset.token_proposal_updated": "asset.token_proposal_updated",
  "asset.review_submitted": "asset.review_submitted",
  "asset.review_returned": "asset.review_returned",
  "asset.approved": "asset.review_approved",
  "asset.archived": "asset.archived",
  "document.uploaded": "document.uploaded",
  "document.replaced": "document.replaced",
  "document.deleted": "document.deleted",
  "issuance.requested": "issuance.requested",
  "issuance.resumed": "issuance.resumed",
  "issuance.trustline_confirmed": "issuance.trustline_confirmed",
  "issuance.confirmed": "issuance.confirmed",
};

export function canonicalActivityType(value: string): ActivityEventType | undefined {
  return (
    LEGACY_ACTIVITY_TYPE_MAP[value] ??
    (ACTIVITY_EVENT_TYPES.includes(value as ActivityEventType)
      ? (value as ActivityEventType)
      : undefined)
  );
}
