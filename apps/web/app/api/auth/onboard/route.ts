import crypto from "node:crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { convexClient, getConvexBoundaryKey } from "@/core/lib/convex-client";
import { api } from "@repo/backend/api";

const SESSION_COOKIE_NAME = "sora_session";
const ONBOARDING_COOKIE_NAME = "sora_onboarding";
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
    const { orgName, email } = body;
    const cookieStore = await cookies();
    const grantToken = cookieStore.get(ONBOARDING_COOKIE_NAME)?.value;

    if (!grantToken || !orgName) {
      return NextResponse.json(
        { error: "Onboarding session expired. Please connect your wallet again." },
        { status: 400 },
      );
    }

    const grantTokenHash = hashToken(grantToken);
    const rawSessionToken = generateOpaqueToken("sora");
    const sessionTokenHash = hashToken(rawSessionToken);
    const sessionExpiresAt = Date.now() + SESSION_TTL;

    let onboardResult;
    try {
      onboardResult = await convexClient.mutation(api.auth.onboard, {
        boundaryKey: getConvexBoundaryKey(),
        grantTokenHash,
        orgName,
        email: email || undefined,
        sessionTokenHash,
        sessionExpiresAt,
        correlationId: crypto.randomUUID(),
      });
    } catch (convexError) {
      console.error("Convex onboarding failed:", convexError);
      return NextResponse.json(
        { error: convexError instanceof Error ? convexError.message : "Onboarding failed" },
        { status: 400 },
      );
    }

    const isProduction = process.env.NODE_ENV === "production";
    cookieStore.set(SESSION_COOKIE_NAME, rawSessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL / 1000,
    });
    cookieStore.delete(ONBOARDING_COOKIE_NAME);

    return NextResponse.json({
      status: "authenticated",
      user: {
        walletAddress: onboardResult.walletAddress,
        orgName: onboardResult.orgName,
      },
    });
  } catch (error) {
    console.error("Onboard route error:", error);
    return NextResponse.json({ error: "Internal server error during onboarding" }, { status: 500 });
  }
}
