import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError, normalizePaginationError } from "@/core/lib/api-errors";
import { convexClient, getConvexBoundaryKey } from "@/core/lib/convex-client";
import { correlationId, requireSessionTokenHash } from "@/core/lib/server-session";
import { api } from "@repo/backend/api";
import { assetRecordSchema } from "@repo/backend/domain/asset-record";

const createAssetRequestSchema = assetRecordSchema.extend({ requestId: z.uuid() });

export async function POST(request: Request) {
  const requestCorrelationId = correlationId();
  try {
    const { requestId, ...input } = createAssetRequestSchema.parse(await request.json());
    const result = await convexClient.mutation(api.assets.create, {
      boundaryKey: getConvexBoundaryKey(),
      sessionTokenHash: await requireSessionTokenHash(),
      createRequestId: requestId,
      correlationId: requestCorrelationId,
      input,
    });
    return NextResponse.json(result, { status: result.replayed ? 200 : 201 });
  } catch (error) {
    return apiError(error, requestCorrelationId);
  }
}

export async function GET(request: Request) {
  const requestCorrelationId = correlationId();
  try {
    const params = new URL(request.url).searchParams;
    const rawLimit = params.get("limit");
    const limit = rawLimit === null ? 25 : Number(rawLimit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error("INVALID_LIMIT");
    const cursor = params.get("cursor");
    let result;
    try {
      result = await convexClient.query(api.assets.list, {
        boundaryKey: getConvexBoundaryKey(),
        sessionTokenHash: await requireSessionTokenHash(),
        paginationOpts: { cursor, numItems: limit },
        search: params.get("q") || undefined,
      });
    } catch (error) {
      throw normalizePaginationError(error, cursor);
    }
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error, requestCorrelationId);
  }
}
