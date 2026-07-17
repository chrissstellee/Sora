import { NextResponse } from "next/server";

import { apiError } from "@/core/lib/api-errors";
import { convexClient, getConvexBoundaryKey } from "@/core/lib/convex-client";
import { correlationId, requireSessionTokenHash } from "@/core/lib/server-session";
import { api } from "@repo/backend/api";

type RouteContext = { params: Promise<{ issuanceId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const requestCorrelationId = correlationId();
  try {
    const { issuanceId } = await context.params;
    const issuance = await convexClient.query(api.issuances.get, {
      boundaryKey: getConvexBoundaryKey(),
      sessionTokenHash: await requireSessionTokenHash(),
      issuanceId,
    });
    return NextResponse.json({ issuance });
  } catch (error) {
    return apiError(error, requestCorrelationId);
  }
}
