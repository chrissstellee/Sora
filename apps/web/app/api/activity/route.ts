import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError, normalizePaginationError } from "@/core/lib/api-errors";
import { convexClient, getConvexBoundaryKey } from "@/core/lib/convex-client";
import { correlationId, requireSessionTokenHash } from "@/core/lib/server-session";
import { api } from "@repo/backend/api";

const querySchema = z
  .object({
    cursor: z.string().trim().min(1).max(2_000).optional(),
    runId: z.string().trim().min(1).max(100).optional(),
    assetId: z.uuid().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(25),
  })
  .strict();

function parseQuery(url: string) {
  const params = new URL(url).searchParams;
  for (const key of params.keys()) {
    z.enum(["cursor", "runId", "assetId", "limit"]).parse(key);
    z.array(z.string()).max(1).parse(params.getAll(key));
  }
  return querySchema.parse(Object.fromEntries(params));
}

export async function GET(request: Request) {
  const requestCorrelationId = correlationId();
  try {
    const { cursor, runId, assetId, limit } = parseQuery(request.url);
    let result;
    try {
      result = await convexClient.query(api.activity.list, {
        boundaryKey: getConvexBoundaryKey(),
        sessionTokenHash: await requireSessionTokenHash(),
        cursor,
        runId,
        assetId,
        limit,
      });
    } catch (error) {
      throw normalizePaginationError(error, cursor ?? null);
    }
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error, requestCorrelationId);
  }
}
