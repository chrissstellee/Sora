import crypto from "node:crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getServerKeypair, getHomeDomain, getWebAuthDomain } from "@/core/config/server-env";
import { convexClient } from "@/core/lib/convex-client";
import { api } from "@repo/backend/api";
import { verifySEP10Challenge, verifyChallengeMatch } from "@repo/backend/stellar/auth";

const SESSION_COOKIE_NAME = "sora_session";
const SESSION_TTL = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

function generateOpaqueToken(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(32).toString("hex")}`;
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { address, challengeXdr } = body;

    if (!address || !challengeXdr) {
      return NextResponse.json(
        { error: "Missing required verification arguments" },
        { status: 400 },
      );
    }

    const challenge = await convexClient.query(api.auth.getChallenge, {
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

    await convexClient.mutation(api.auth.consumeChallenge, {
      id: challenge._id,
    });

    const serverKeypair = getServerKeypair();
    const homeDomain = getHomeDomain(request);
    const webAuthDomain = getWebAuthDomain(request);

    try {
      verifySEP10Challenge(
        challengeXdr,
        serverKeypair.publicKey(),
        address,
        homeDomain,
        webAuthDomain,
        networkPassphrase,
      );
    } catch (verifError) {
      console.error("SEP-10 challenge verification failed:", verifError);
      return NextResponse.json({ error: "Signature verification failed" }, { status: 401 });
    }

    const user = await convexClient.query(api.auth.getUserByWallet, {
      walletAddress: address,
    });

    if (user) {
      const rawToken = generateOpaqueToken("sora");
      const tokenHash = hashToken(rawToken);
      const expiresAt = Date.now() + SESSION_TTL;

      await convexClient.mutation(api.auth.createSession, {
        tokenHash,
        userId: user._id,
        organizationId: user.organizationId,
        expiresAt,
      });

      await convexClient.mutation(api.auth.logActivity, {
        organizationId: user.organizationId,
        userId: user._id,
        eventType: "wallet_login",
        outcome: "success",
        correlationId: crypto.randomUUID(),
        metadata: JSON.stringify({ walletAddress: address, type: "returning" }),
      });

      const isProduction = process.env.NODE_ENV === "production";
      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_TTL / 1000,
      });

      return NextResponse.json({ status: "authenticated", address });
    } else {
      const rawGrant = generateOpaqueToken("grant");
      const grantHash = hashToken(rawGrant);

      await convexClient.mutation(api.auth.createOnboardingGrant, {
        tokenHash: grantHash,
        walletAddress: address,
      });

      return NextResponse.json({
        status: "onboarding-required",
        grantToken: rawGrant,
        address,
      });
    }
  } catch (error) {
    console.error("Verification endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error during verification" },
      { status: 500 },
    );
  }
}
