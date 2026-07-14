import crypto from "node:crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { convexClient, getConvexBoundaryKey } from "@/core/lib/convex-client";
import { api } from "@repo/backend/api";

const SESSION_COOKIE_NAME = "sora_session";
const ONBOARDING_COOKIE_NAME = "sora_onboarding";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);
  let sessionRevoked = true;

  try {
    if (cookie && cookie.value) {
      const tokenHash = hashToken(cookie.value);
      await convexClient.mutation(api.auth.revokeSession, {
        boundaryKey: getConvexBoundaryKey(),
        tokenHash,
      });
    }
  } catch (error) {
    sessionRevoked = false;
    console.error("Logout error:", error);
  }

  const response = NextResponse.json(
    { success: sessionRevoked },
    { status: sessionRevoked ? 200 : 503 },
  );
  const expiredCookie = {
    maxAge: 0,
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
  };
  response.cookies.set(SESSION_COOKIE_NAME, "", expiredCookie);
  response.cookies.set(ONBOARDING_COOKIE_NAME, "", expiredCookie);

  return response;
}
