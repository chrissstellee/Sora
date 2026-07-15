import { NextResponse } from "next/server";

import { apiError, normalizePaginationError } from "@/core/lib/api-errors";
import { convexClient, getConvexBoundaryKey } from "@/core/lib/convex-client";
import { correlationId, requireSessionTokenHash } from "@/core/lib/server-session";
import { api } from "@repo/backend/api";
export async function GET(request: Request) {
  const id = correlationId();
  try {
    const params = new URL(request.url).searchParams;
    const cursor = params.get("cursor");
    const limit = Number(params.get("limit") ?? 25);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error("INVALID_LIMIT");
    try {
      const result = await convexClient.query(api.tokenization.readyQueue, {
        boundaryKey: getConvexBoundaryKey(),
        sessionTokenHash: await requireSessionTokenHash(),
        paginationOpts: { cursor, numItems: limit },
      });
      return NextResponse.json(result);
    } catch (error) {
      throw normalizePaginationError(error, cursor);
    }
  } catch (error) {
    return apiError(error, id);
  }
}
