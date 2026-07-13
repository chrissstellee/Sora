import { v } from "convex/values";

import { mutation, query } from "./_generated/server.js";

// Challenge TTL is 5 minutes
const CHALLENGE_TTL = 5 * 60 * 1000;
// Onboarding Grant TTL is 15 minutes
const ONBOARDING_GRANT_TTL = 15 * 60 * 1000;

export const createChallenge = mutation({
  args: { walletAddress: v.string(), challengeXdr: v.string() },
  handler: async (ctx, args) => {
    // Expire any existing unconsumed challenges for this wallet
    const existing = await ctx.db
      .query("challenges")
      .withIndex("by_walletAddress", (q) => q.eq("walletAddress", args.walletAddress))
      .collect();

    for (const challenge of existing) {
      if (!challenge.consumed && challenge.expiresAt > Date.now()) {
        await ctx.db.patch(challenge._id, { consumed: true });
      }
    }

    const expiresAt = Date.now() + CHALLENGE_TTL;
    return await ctx.db.insert("challenges", {
      walletAddress: args.walletAddress,
      challengeXdr: args.challengeXdr,
      expiresAt,
      consumed: false,
    });
  },
});

export const getChallenge = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const challenge = await ctx.db
      .query("challenges")
      .withIndex("by_walletAddress", (q) => q.eq("walletAddress", args.walletAddress))
      .order("desc")
      .first();

    if (!challenge) return null;
    if (challenge.consumed || challenge.expiresAt < Date.now()) return null;

    return challenge;
  },
});

export const consumeChallenge = mutation({
  args: { id: v.id("challenges") },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.id);
    if (!challenge) throw new Error("Challenge not found");
    if (challenge.consumed) throw new Error("Challenge already consumed");
    if (challenge.expiresAt < Date.now()) throw new Error("Challenge expired");

    await ctx.db.patch(args.id, { consumed: true });
  },
});

export const createOnboardingGrant = mutation({
  args: { tokenHash: v.string(), walletAddress: v.string() },
  handler: async (ctx, args) => {
    const expiresAt = Date.now() + ONBOARDING_GRANT_TTL;
    return await ctx.db.insert("onboardingGrants", {
      tokenHash: args.tokenHash,
      walletAddress: args.walletAddress,
      expiresAt,
      consumed: false,
    });
  },
});

export const verifySession = query({
  args: { tokenHash: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", args.tokenHash))
      .first();

    if (!session) return null;
    if (session.expiresAt < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user) return null;

    const organization = await ctx.db.get(session.organizationId);
    if (!organization) return null;

    return {
      userId: session.userId,
      organizationId: session.organizationId,
      walletAddress: user.walletAddress,
      orgName: organization.name,
    };
  },
});

export const createSession = mutation({
  args: {
    tokenHash: v.string(),
    userId: v.id("users"),
    organizationId: v.id("organizations"),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sessions", {
      tokenHash: args.tokenHash,
      userId: args.userId,
      organizationId: args.organizationId,
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
    });
  },
});

export const deleteSession = mutation({
  args: { tokenHash: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", args.tokenHash))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
      return true;
    }
    return false;
  },
});

export const getUserByWallet = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_walletAddress", (q) => q.eq("walletAddress", args.walletAddress))
      .first();
  },
});

export const onboard = mutation({
  args: {
    grantTokenHash: v.string(),
    orgName: v.string(),
    email: v.optional(v.string()),
    sessionTokenHash: v.string(),
    sessionExpiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    // 1. Verify and consume the onboarding grant
    const grant = await ctx.db
      .query("onboardingGrants")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", args.grantTokenHash))
      .first();

    if (!grant) throw new Error("Onboarding grant not found");
    if (grant.consumed) throw new Error("Onboarding grant already consumed");
    if (grant.expiresAt < Date.now()) throw new Error("Onboarding grant expired");

    // Consume the grant immediately
    await ctx.db.patch(grant._id, { consumed: true });

    // 2. Check if a user with this wallet already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_walletAddress", (q) => q.eq("walletAddress", grant.walletAddress))
      .first();

    if (existingUser) {
      throw new Error("A user with this wallet address is already onboarded");
    }

    // 3. Create the organization
    const orgId = await ctx.db.insert("organizations", {
      name: args.orgName,
      optionalEmail: args.email,
      createdAt: Date.now(),
    });

    // 4. Create the user bound to the organization
    const userId = await ctx.db.insert("users", {
      walletAddress: grant.walletAddress,
      organizationId: orgId,
      email: args.email,
      createdAt: Date.now(),
    });

    // 5. Create the initial session
    await ctx.db.insert("sessions", {
      tokenHash: args.sessionTokenHash,
      userId,
      organizationId: orgId,
      expiresAt: args.sessionExpiresAt,
      createdAt: Date.now(),
    });

    return {
      userId,
      organizationId: orgId,
      walletAddress: grant.walletAddress,
      orgName: args.orgName,
    };
  },
});

export const logActivity = mutation({
  args: {
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    eventType: v.string(),
    outcome: v.string(),
    correlationId: v.string(),
    metadata: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activityEvents", {
      organizationId: args.organizationId,
      userId: args.userId,
      eventType: args.eventType,
      timestamp: Date.now(),
      outcome: args.outcome,
      correlationId: args.correlationId,
      metadata: args.metadata,
    });
  },
});
