import crypto from "node:crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getServerKeypair, getHomeDomain, getWebAuthDomain } from "@/core/config/server-env";
import { convexClient, getConvexBoundaryKey } from "@/core/lib/convex-client";
import {
  generateOpaqueToken,
  hashToken,
  ONBOARDING_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
} from "@/core/lib/server-session";
import { api } from "@repo/backend/api";
import { verifySEP10Challenge, verifyChallengeMatch } from "@repo/backend/stellar/auth";

const ONBOARDING_TTL_SECONDS = 15 * 60;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { address, challengeXdr } = body;
    if (typeof address !== "string" || typeof challengeXdr !== "string") {
      return NextResponse.json(
        { error: "Missing required verification arguments" },
        { status: 400 },
      );
    }
    const boundaryKey = getConvexBoundaryKey();
    const challenge = await convexClient.query(api.auth.getChallenge, {
      boundaryKey,
      walletAddress: address,
    });
    const networkPassphrase =
      process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015";
    if (
      !challenge ||
      !verifyChallengeMatch(challengeXdr, challenge.challengeXdr, networkPassphrase)
    ) {
      return NextResponse.json(
        { error: "Challenge not found, expired, or mismatching" },
        { status: 400 },
      );
    }
    try {
      verifySEP10Challenge(
        challengeXdr,
        getServerKeypair().publicKey(),
        address,
        getHomeDomain(request),
        getWebAuthDomain(request),
        networkPassphrase,
      );
    } catch {
      return NextResponse.json({ error: "Signature verification failed" }, { status: 401 });
    }
    const rawSessionToken = generateOpaqueToken("sora");
    const rawGrant = generateOpaqueToken("grant");
    const result = await convexClient.mutation(api.auth.completeAuthentication, {
      boundaryKey,
      challengeId: challenge._id,
      walletAddress: address,
      sessionTokenHash: hashToken(rawSessionToken),
      sessionExpiresAt: Date.now() + SESSION_TTL_MS,
      onboardingGrantHash: hashToken(rawGrant),
      correlationId: crypto.randomUUID(),
    });
    const cookieStore = await cookies();
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    };
    if (result.status === "authenticated") {
      cookieStore.set(SESSION_COOKIE_NAME, rawSessionToken, {
        ...cookieOptions,
        maxAge: SESSION_TTL_MS / 1000,
      });
      return NextResponse.json({ status: "authenticated", address });
    }
    cookieStore.set(ONBOARDING_COOKIE_NAME, rawGrant, {
      ...cookieOptions,
      maxAge: ONBOARDING_TTL_SECONDS,
    });
    return NextResponse.json({ status: "onboarding-required", address });
  } catch (error) {
    console.error("Verification endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error during verification" },
      { status: 500 },
    );
  }
}
