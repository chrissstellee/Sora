import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError } from "@/core/lib/api-errors";
import { convexClient, getConvexBoundaryKey } from "@/core/lib/convex-client";
import { correlationId, requireSessionTokenHash } from "@/core/lib/server-session";
import { api } from "@repo/backend/api";

type RouteContext = { params: Promise<{ assetId: string }> };

const pathSchema = z.object({ assetId: z.uuid() }).strict();
const requestSchema = z
  .object({
    reason: z.enum(["manual", "visible-stale", "focus-stale"]),
    requestId: z.uuid(),
  })
  .strict();

export async function POST(request: Request, context: RouteContext) {
  const requestCorrelationId = correlationId();
  try {
    const { assetId } = pathSchema.parse(await context.params);
    const input = requestSchema.parse(await request.json());
    const result = await convexClient.mutation(api.ownership.refresh, {
      boundaryKey: getConvexBoundaryKey(),
      sessionTokenHash: await requireSessionTokenHash(),
      assetId,
      ...input,
    });
    return NextResponse.json(result, { status: result.status === "accepted" ? 202 : 200 });
  } catch (error) {
    return apiError(error, requestCorrelationId);
  }
}
