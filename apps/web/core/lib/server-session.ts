import "server-only";
import crypto from "node:crypto";

import { cookies } from "next/headers";

import { convexClient, getConvexBoundaryKey } from "@/core/lib/convex-client";
import { api } from "@repo/backend/api";

export const SESSION_COOKIE_NAME = "sora_session";
export const ONBOARDING_COOKIE_NAME = "sora_onboarding";
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export function generateOpaqueToken(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(32).toString("hex")}`;
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function getServerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const sessionTokenHash = hashToken(token);
  const session = await convexClient.query(api.auth.verifySession, {
    boundaryKey: getConvexBoundaryKey(),
    tokenHash: sessionTokenHash,
  });
  return session ? { ...session, sessionTokenHash } : null;
}

export async function requireSessionTokenHash(): Promise<string> {
  const session = await getServerSession();
  if (!session) throw new Error("AUTH_REQUIRED");
  return session.sessionTokenHash;
}

export function correlationId(): string {
  return crypto.randomUUID();
}
