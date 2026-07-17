import { NextResponse } from "next/server";

import { apiError } from "@/core/lib/api-errors";
import { convexClient, getConvexBoundaryKey } from "@/core/lib/convex-client";
import { correlationId, requireSessionTokenHash } from "@/core/lib/server-session";
import { api } from "@repo/backend/api";
export async function GET() {
  const id = correlationId();
  try {
    const issuances = await convexClient.query(api.issuances.list, {
      boundaryKey: getConvexBoundaryKey(),
      sessionTokenHash: await requireSessionTokenHash(),
    });
    return NextResponse.json({ issuances });
  } catch (error) {
    return apiError(error, id);
  }
}
