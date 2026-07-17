import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError } from "@/core/lib/api-errors";
import { convexClient, getConvexBoundaryKey } from "@/core/lib/convex-client";
import { correlationId, requireSessionTokenHash } from "@/core/lib/server-session";
import { api } from "@repo/backend/api";

type RouteContext = { params: Promise<{ assetId: string }> };
const requestSchema = z.object({ expectedAssetVersion: z.number().int().positive() }).strict();

export async function POST(request: Request, context: RouteContext) {
  const requestCorrelationId = correlationId();
  try {
    const { assetId } = await context.params;
    const input = requestSchema.parse(await request.json());
    const result = await convexClient.mutation(api.issuances.request, {
      boundaryKey: getConvexBoundaryKey(),
      sessionTokenHash: await requireSessionTokenHash(),
      assetId,
      expectedAssetVersion: input.expectedAssetVersion,
      correlationId: requestCorrelationId,
    });
    return NextResponse.json(result, { status: result.claimed ? 202 : 200 });
  } catch (error) {
    return apiError(error, requestCorrelationId);
  }
}
