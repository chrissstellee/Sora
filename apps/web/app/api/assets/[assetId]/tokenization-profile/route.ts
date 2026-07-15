import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError } from "@/core/lib/api-errors";
import { convexClient, getConvexBoundaryKey } from "@/core/lib/convex-client";
import { correlationId, requireSessionTokenHash } from "@/core/lib/server-session";
import { api } from "@repo/backend/api";
import { tokenizationProfileInputSchema } from "@repo/backend/domain/tokenization";

type RouteContext = { params: Promise<{ assetId: string }> };
const requestSchema = tokenizationProfileInputSchema.extend({
  expectedAssetVersion: z.number().int().positive(),
  expectedProfileVersion: z.number().int().positive().optional(),
});

export async function PATCH(request: Request, context: RouteContext) {
  const requestCorrelationId = correlationId();
  try {
    const { assetId } = await context.params;
    const { expectedAssetVersion, expectedProfileVersion, ...profile } = requestSchema.parse(
      await request.json(),
    );
    const result = await convexClient.mutation(api.tokenization.updateProfile, {
      boundaryKey: getConvexBoundaryKey(),
      sessionTokenHash: await requireSessionTokenHash(),
      assetId,
      expectedAssetVersion,
      expectedProfileVersion,
      correlationId: requestCorrelationId,
      profile,
    });
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error, requestCorrelationId);
  }
}
