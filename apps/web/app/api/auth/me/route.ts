import crypto from "node:crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { convexClient } from "@/core/lib/convex-client";
import { api } from "@repo/backend/api";

const SESSION_COOKIE_NAME = "sora_session";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!cookie || !cookie.value) {
      return NextResponse.json({ authenticated: false });
    }

    const tokenHash = hashToken(cookie.value);
    const session = await convexClient.query(api.auth.verifySession, {
      tokenHash,
    });

    if (!session) {
      const response = NextResponse.json({ authenticated: false });
      response.cookies.set(SESSION_COOKIE_NAME, "", { maxAge: 0, path: "/" });
      return response;
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        userId: session.userId,
        organizationId: session.organizationId,
        walletAddress: session.walletAddress,
        orgName: session.orgName,
      },
    });
  } catch (error) {
    console.error("Auth me endpoint error:", error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
