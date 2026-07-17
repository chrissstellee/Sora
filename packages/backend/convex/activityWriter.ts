import { canonicalizeActivityInput } from "../src/domain/activity.js";

import type { ActivityActorKind, ActivityEventType } from "../src/domain/activity.js";
import type { DataModel, Id } from "./_generated/dataModel.js";
import type { GenericMutationCtx } from "convex/server";

export interface ActivityWriteInput {
  organizationId: Id<"organizations">;
  userId?: Id<"users">;
  actorKind: ActivityActorKind;
  eventType: ActivityEventType;
  subjectId: string;
  outcome: "success" | "failure" | "pending";
  correlationId: string;
  assetId?: string;
  eventId?: string;
  runId?: string;
  metadata?: Record<string, unknown>;
  proof?: { type: string; id: string };
  timestamp?: number;
}

export async function recordActivity(
  ctx: GenericMutationCtx<DataModel>,
  input: ActivityWriteInput,
) {
  const activeRun = input.runId
    ? undefined
    : await activeRunForOrganization(ctx, input.organizationId);
  const canonical = canonicalizeActivityInput({
    eventType: input.eventType,
    actorKind: input.actorKind,
    subjectId: input.subjectId,
    outcome: input.outcome,
    correlationId: input.correlationId,
    runId: input.runId ?? activeRun?.runId,
    metadata: input.metadata,
  });
  return await ctx.db.insert("activityEvents", {
    organizationId: input.organizationId,
    userId: input.userId,
    assetId: input.assetId,
    eventId:
      input.eventId ?? `${canonical.eventType}:${canonical.subjectId}:${canonical.correlationId}`,
    timestamp: input.timestamp ?? Date.now(),
    proofType: input.proof?.type,
    proofId: input.proof?.id,
    ...canonical,
  });
}

async function activeRunForOrganization(
  ctx: GenericMutationCtx<DataModel>,
  organizationId: Id<"organizations">,
) {
  const active = await ctx.db
    .query("demoRuns")
    .withIndex("by_organizationId_status", (q) =>
      q.eq("organizationId", organizationId).eq("status", "Active"),
    )
    .unique();
  if (active) return active;
  return await ctx.db
    .query("demoRuns")
    .withIndex("by_organizationId_status", (q) =>
      q.eq("organizationId", organizationId).eq("status", "Prepared"),
    )
    .unique();
}
