import { GenericMutationCtx, GenericQueryCtx } from "convex/server";

import { DataModel } from "./_generated/dataModel.js";

/**
 * Validates a session token hash and returns the organization context.
 * Throws an error if authorization fails.
 */
export async function enforceAuth(
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
  tokenHash: string,
) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
    .first();

  if (!session) {
    throw new Error("Unauthorized: Invalid session");
  }

  if (session.expiresAt < Date.now()) {
    throw new Error("Unauthorized: Session expired");
  }

  const user = await ctx.db.get(session.userId);
  if (!user) {
    throw new Error("Unauthorized: User not found");
  }

  const organization = await ctx.db.get(session.organizationId);
  if (!organization) {
    throw new Error("Unauthorized: Organization not found");
  }

  return {
    userId: session.userId,
    organizationId: session.organizationId,
    walletAddress: user.walletAddress,
    orgName: organization.name,
  };
}
