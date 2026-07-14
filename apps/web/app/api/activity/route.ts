import { NextResponse } from "next/server";

import { apiError } from "@/core/lib/api-errors";
import { convexClient, getConvexBoundaryKey } from "@/core/lib/convex-client";
import { correlationId, requireSessionTokenHash } from "@/core/lib/server-session";
import { api } from "@repo/backend/api";

export async function GET(request: Request) {
  const requestCorrelationId = correlationId();
  try {
    const params = new URL(request.url).searchParams;
    const rawLimit = params.get("limit");
    const limit = rawLimit === null ? 25 : Number(rawLimit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error("INVALID_LIMIT");
    const items = await convexClient.query(api.activity.list, {
      boundaryKey: getConvexBoundaryKey(),
      sessionTokenHash: await requireSessionTokenHash(),
      assetId: params.get("assetId") || undefined,
      limit,
    });
    return NextResponse.json({ items });
  } catch (error) {
    return apiError(error, requestCorrelationId);
  }
}
