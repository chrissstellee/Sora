import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError } from "@/core/lib/api-errors";
import { convexClient, getConvexBoundaryKey } from "@/core/lib/convex-client";
import { correlationId, requireSessionTokenHash } from "@/core/lib/server-session";
import { api } from "@repo/backend/api";

type RouteContext = { params: Promise<{ assetId: string }> };
const requestSchema = z.object({
  intentId: z.string().min(1),
  storageId: z.string().min(1),
  filename: z.string().min(1).max(255),
});

export async function POST(request: Request, context: RouteContext) {
  const requestCorrelationId = correlationId();
  try {
    const { assetId } = await context.params;
    const input = requestSchema.parse(await request.json());
    const result = await convexClient.action(api.documentActions.finalize, {
      boundaryKey: getConvexBoundaryKey(),
      sessionTokenHash: await requireSessionTokenHash(),
      intentId: input.intentId,
      storageId: input.storageId as never,
      filename: input.filename,
      correlationId: requestCorrelationId,
    });
    if (result.document.assetId !== assetId) throw new Error("DOCUMENT_NOT_FOUND");
    return NextResponse.json(result, { status: result.replayed ? 200 : 201 });
  } catch (error) {
    return apiError(error, requestCorrelationId);
  }
}
