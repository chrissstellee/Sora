import crypto from "node:crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { convexClient } from "@/core/lib/convex-client";
import { api } from "@repo/backend/api";

const SESSION_COOKIE_NAME = "sora_session";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST() {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (cookie && cookie.value) {
      const tokenHash = hashToken(cookie.value);
      await convexClient.mutation(api.auth.deleteSession, {
        tokenHash,
      });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      maxAge: 0,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during logout" },
      { status: 500 },
    );
  }
}
