import { v } from "convex/values";

import { mutation, query } from "./_generated/server.js";
import { recordActivity } from "./activityWriter.js";
import { enforceAuth, enforceBoundary } from "./helpers.js";

const CHALLENGE_TTL = 5 * 60 * 1000;
const ONBOARDING_GRANT_TTL = 15 * 60 * 1000;

const boundaryArgs = { boundaryKey: v.string() };

export const createChallenge = mutation({
  args: { ...boundaryArgs, walletAddress: v.string(), challengeXdr: v.string() },
  handler: async (ctx, args) => {
    enforceBoundary(args.boundaryKey);
    const existing = await ctx.db
      .query("challenges")
      .withIndex("by_walletAddress", (q) => q.eq("walletAddress", args.walletAddress))
      .collect();
    for (const challenge of existing) {
      if (!challenge.consumed && challenge.expiresAt > Date.now()) {
        await ctx.db.patch(challenge._id, { consumed: true });
      }
    }
    return await ctx.db.insert("challenges", {
      walletAddress: args.walletAddress,
      challengeXdr: args.challengeXdr,
      expiresAt: Date.now() + CHALLENGE_TTL,
      consumed: false,
    });
  },
});

export const getChallenge = query({
  args: { ...boundaryArgs, walletAddress: v.string() },
  handler: async (ctx, args) => {
    enforceBoundary(args.boundaryKey);
    const challenge = await ctx.db
      .query("challenges")
      .withIndex("by_walletAddress", (q) => q.eq("walletAddress", args.walletAddress))
      .order("desc")
      .first();
    if (!challenge || challenge.consumed || challenge.expiresAt <= Date.now()) return null;
    return challenge;
  },
});

export const completeAuthentication = mutation({
  args: {
    ...boundaryArgs,
    challengeId: v.id("challenges"),
    walletAddress: v.string(),
    sessionTokenHash: v.string(),
    sessionExpiresAt: v.number(),
    onboardingGrantHash: v.string(),
    correlationId: v.string(),
  },
  handler: async (ctx, args) => {
    enforceBoundary(args.boundaryKey);
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge || challenge.walletAddress !== args.walletAddress) {
      throw new Error("AUTH_CHALLENGE_UNAVAILABLE");
    }
    if (challenge.consumed || challenge.expiresAt <= Date.now()) {
      throw new Error("AUTH_CHALLENGE_UNAVAILABLE");
    }
    await ctx.db.patch(challenge._id, { consumed: true });

    const user = await ctx.db
      .query("users")
      .withIndex("by_walletAddress", (q) => q.eq("walletAddress", args.walletAddress))
      .first();
    if (!user) {
      await ctx.db.insert("onboardingGrants", {
        tokenHash: args.onboardingGrantHash,
        walletAddress: args.walletAddress,
        expiresAt: Date.now() + ONBOARDING_GRANT_TTL,
        consumed: false,
      });
      return { status: "onboarding-required" as const };
    }
    if (user.disabledAt) throw new Error("AUTH_USER_DISABLED");
    const organization = await ctx.db.get(user.organizationId);
    if (!organization) throw new Error("AUTH_IDENTITY_INVALID");
    if (organization.disabledAt) throw new Error("AUTH_ORGANIZATION_DISABLED");
    const now = Date.now();
    const sessionId = await ctx.db.insert("sessions", {
      tokenHash: args.sessionTokenHash,
      userId: user._id,
      organizationId: user.organizationId,
      expiresAt: args.sessionExpiresAt,
      createdAt: now,
    });
    await recordActivity(ctx, {
      organizationId: user.organizationId,
      userId: user._id,
      actorKind: "user",
      eventType: "auth.wallet_login",
      subjectId: sessionId,
      outcome: "success",
      correlationId: args.correlationId,
      eventId: args.correlationId,
      metadata: { walletAddress: user.walletAddress },
      timestamp: now,
    });
    return {
      status: "authenticated" as const,
      userId: user._id,
      organizationId: user.organizationId,
      walletAddress: user.walletAddress,
      orgName: organization.name,
    };
  },
});

export const verifySession = query({
  args: { ...boundaryArgs, tokenHash: v.string() },
  handler: async (ctx, args) => {
    enforceBoundary(args.boundaryKey);
    try {
      return await enforceAuth(ctx, args.tokenHash, args.boundaryKey);
    } catch {
      return null;
    }
  },
});

export const revokeSession = mutation({
  args: { ...boundaryArgs, tokenHash: v.string() },
  handler: async (ctx, args) => {
    enforceBoundary(args.boundaryKey);
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", args.tokenHash))
      .first();
    if (!session || session.revokedAt) return false;
    await ctx.db.patch(session._id, { revokedAt: Date.now() });
    return true;
  },
});

export const onboard = mutation({
  args: {
    ...boundaryArgs,
    grantTokenHash: v.string(),
    orgName: v.string(),
    email: v.optional(v.string()),
    sessionTokenHash: v.string(),
    sessionExpiresAt: v.number(),
    correlationId: v.string(),
  },
  handler: async (ctx, args) => {
    enforceBoundary(args.boundaryKey);
    const grant = await ctx.db
      .query("onboardingGrants")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", args.grantTokenHash))
      .first();
    if (!grant || grant.consumed || grant.expiresAt <= Date.now()) {
      throw new Error("ONBOARDING_GRANT_UNAVAILABLE");
    }
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_walletAddress", (q) => q.eq("walletAddress", grant.walletAddress))
      .first();
    if (existingUser) throw new Error("WALLET_ALREADY_ONBOARDED");
    const now = Date.now();
    const orgName = args.orgName.normalize("NFKC").trim().replace(/\s+/g, " ");
    if (orgName.length < 2 || orgName.length > 120) throw new Error("INVALID_ORGANIZATION_NAME");
    await ctx.db.patch(grant._id, { consumed: true });
    const organizationId = await ctx.db.insert("organizations", {
      name: orgName,
      optionalEmail: args.email,
      createdAt: now,
    });
    const userId = await ctx.db.insert("users", {
      walletAddress: grant.walletAddress,
      organizationId,
      email: args.email,
      createdAt: now,
    });
    await ctx.db.insert("sessions", {
      tokenHash: args.sessionTokenHash,
      userId,
      organizationId,
      expiresAt: args.sessionExpiresAt,
      createdAt: now,
    });
    await recordActivity(ctx, {
      organizationId,
      userId,
      actorKind: "user",
      eventType: "auth.wallet_onboarded",
      subjectId: organizationId,
      outcome: "success",
      correlationId: args.correlationId,
      eventId: args.correlationId,
      timestamp: now,
    });
    return { userId, organizationId, walletAddress: grant.walletAddress, orgName };
  },
});
