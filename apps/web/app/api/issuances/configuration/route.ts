import { NextResponse } from "next/server";

import { apiError } from "@/core/lib/api-errors";
import { convexClient, getConvexBoundaryKey } from "@/core/lib/convex-client";
import { correlationId, requireSessionTokenHash } from "@/core/lib/server-session";
import { api } from "@repo/backend/api";
export async function GET() {
  const id = correlationId();
  try {
    const configuration = await convexClient.query(api.issuances.configuration, {
      boundaryKey: getConvexBoundaryKey(),
      sessionTokenHash: await requireSessionTokenHash(),
    });
    return NextResponse.json({ configuration });
  } catch (error) {
    return apiError(error, id);
  }
}
