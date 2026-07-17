import { NextResponse } from "next/server";

import { apiError } from "@/core/lib/api-errors";
import { convexClient, getConvexBoundaryKey } from "@/core/lib/convex-client";
import { correlationId, requireSessionTokenHash } from "@/core/lib/server-session";
import { api } from "@repo/backend/api";

export async function GET() {
  const requestCorrelationId = correlationId();
  try {
    const result = await convexClient.query(api.assets.workspaceSummary, {
      boundaryKey: getConvexBoundaryKey(),
      sessionTokenHash: await requireSessionTokenHash(),
    });
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error, requestCorrelationId);
  }
}
