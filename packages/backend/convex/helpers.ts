import { GenericMutationCtx, GenericQueryCtx } from "convex/server";

import { DataModel } from "./_generated/dataModel.js";

/**
 * Validates a session token hash and returns the organization context.
 * Throws an error if authorization fails.
 */
export async function enforceAuth(
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
  tokenHash: string,
  boundaryKey: string,
) {
  enforceBoundary(boundaryKey);
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
    .first();

  if (!session) {
    throw new Error("Unauthorized: Invalid session");
  }

  if (session.revokedAt || session.expiresAt <= Date.now()) {
    throw new Error("Unauthorized: Session expired");
  }

  const [user, organization] = await Promise.all([
    ctx.db.get(session.userId),
    ctx.db.get(session.organizationId),
  ]);
  if (!user) {
    throw new Error("Unauthorized: User not found");
  }

  if (user.disabledAt) {
    throw new Error("Unauthorized: User disabled");
  }

  if (user.organizationId !== session.organizationId) {
    throw new Error("Unauthorized: Session identity mismatch");
  }

  if (!organization) {
    throw new Error("Unauthorized: Organization not found");
  }

  if (organization.disabledAt) {
    throw new Error("Unauthorized: Organization disabled");
  }

  return {
    userId: session.userId,
    organizationId: session.organizationId,
    walletAddress: user.walletAddress,
    orgName: organization.name,
  };
}

export function enforceBoundary(boundaryKey: string): void {
  const expected = (
    globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }
  ).process?.env?.CONVEX_SERVER_BOUNDARY_KEY;
  if (!expected || boundaryKey !== expected) {
    throw new Error("Unauthorized: Invalid server boundary");
  }
}
