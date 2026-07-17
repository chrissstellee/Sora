import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError } from "@/core/lib/api-errors";
import { convexClient, getConvexBoundaryKey } from "@/core/lib/convex-client";
import { correlationId, requireSessionTokenHash } from "@/core/lib/server-session";
import { api } from "@repo/backend/api";

type RouteContext = { params: Promise<{ assetId: string }> };
const intentSchema = z.object({
  expectedAssetVersion: z.number().int().positive(),
  replacesDocumentId: z.string().min(1).optional(),
  expectedDocumentVersion: z.number().int().positive().optional(),
});

export async function GET(_request: Request, context: RouteContext) {
  const requestCorrelationId = correlationId();
  try {
    const { assetId } = await context.params;
    const documents = await convexClient.query(api.documents.list, {
      boundaryKey: getConvexBoundaryKey(),
      sessionTokenHash: await requireSessionTokenHash(),
      assetId,
    });
    return NextResponse.json({ documents });
  } catch (error) {
    return apiError(error, requestCorrelationId);
  }
}

export async function POST(request: Request, context: RouteContext) {
  const requestCorrelationId = correlationId();
  try {
    const { assetId } = await context.params;
    const input = intentSchema.parse(await request.json());
    const result = await convexClient.mutation(api.documents.createUploadIntent, {
      boundaryKey: getConvexBoundaryKey(),
      sessionTokenHash: await requireSessionTokenHash(),
      assetId,
      ...input,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiError(error, requestCorrelationId);
  }
}
