import { NextResponse } from "next/server";

import { apiError } from "@/core/lib/api-errors";
import { convexClient, getConvexBoundaryKey } from "@/core/lib/convex-client";
import { correlationId, requireSessionTokenHash } from "@/core/lib/server-session";
import { api } from "@repo/backend/api";

type RouteContext = { params: Promise<{ assetId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const requestCorrelationId = correlationId();
  try {
    const { assetId } = await context.params;
    const snapshot = await convexClient.query(api.tokenization.getReviewSnapshot, {
      boundaryKey: getConvexBoundaryKey(),
      sessionTokenHash: await requireSessionTokenHash(),
      assetId,
    });
    return NextResponse.json(snapshot);
  } catch (error) {
    return apiError(error, requestCorrelationId);
  }
}
