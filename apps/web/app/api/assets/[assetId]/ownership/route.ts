import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError, normalizePaginationError } from "@/core/lib/api-errors";
import { convexClient, getConvexBoundaryKey } from "@/core/lib/convex-client";
import { correlationId, requireSessionTokenHash } from "@/core/lib/server-session";
import { api } from "@repo/backend/api";

type RouteContext = { params: Promise<{ assetId: string }> };

const pathSchema = z.object({ assetId: z.uuid() }).strict();
const querySchema = z
  .object({
    cursor: z.string().trim().min(1).max(2_000).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(25),
    q: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^G[A-Z2-7]{0,55}$/)
      .optional(),
  })
  .strict();

function parseQuery(url: string) {
  const params = new URL(url).searchParams;
  for (const key of params.keys()) {
    z.enum(["cursor", "limit", "q"]).parse(key);
    z.array(z.string()).max(1).parse(params.getAll(key));
  }
  return querySchema.parse(Object.fromEntries(params));
}

export async function GET(request: Request, context: RouteContext) {
  const requestCorrelationId = correlationId();
  try {
    const { assetId } = pathSchema.parse(await context.params);
    const { cursor, limit, q } = parseQuery(request.url);
    let result;
    try {
      result = await convexClient.query(api.ownership.get, {
        boundaryKey: getConvexBoundaryKey(),
        sessionTokenHash: await requireSessionTokenHash(),
        assetId,
        cursor,
        limit,
        q,
      });
    } catch (error) {
      throw normalizePaginationError(error, cursor ?? null);
    }
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error, requestCorrelationId);
  }
}
