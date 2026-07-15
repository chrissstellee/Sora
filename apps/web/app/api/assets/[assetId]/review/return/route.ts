import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError } from "@/core/lib/api-errors";
import { convexClient, getConvexBoundaryKey } from "@/core/lib/convex-client";
import { correlationId, requireSessionTokenHash } from "@/core/lib/server-session";
import { api } from "@repo/backend/api";
type RouteContext = { params: Promise<{ assetId: string }> };
const schema = z.object({
  expectedAssetVersion: z.number().int().positive(),
  reason: z.string().min(10).max(500),
});
export async function POST(request: Request, context: RouteContext) {
  const id = correlationId();
  try {
    const { assetId } = await context.params;
    const input = schema.parse(await request.json());
    const result = await convexClient.mutation(api.tokenization.returnReview, {
      boundaryKey: getConvexBoundaryKey(),
      sessionTokenHash: await requireSessionTokenHash(),
      assetId,
      ...input,
      correlationId: id,
    });
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error, id);
  }
}
