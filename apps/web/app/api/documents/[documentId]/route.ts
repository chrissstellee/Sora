import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError } from "@/core/lib/api-errors";
import { convexClient, getConvexBoundaryKey } from "@/core/lib/convex-client";
import { correlationId, requireSessionTokenHash } from "@/core/lib/server-session";
import { api } from "@repo/backend/api";

type RouteContext = { params: Promise<{ documentId: string }> };
const deleteSchema = z.object({
  assetId: z.string().min(1),
  expectedAssetVersion: z.number().int().positive(),
  expectedDocumentVersion: z.number().int().positive(),
  requestId: z.uuid(),
});

export async function GET(_request: Request, context: RouteContext) {
  const requestCorrelationId = correlationId();
  try {
    const { documentId } = await context.params;
    const download = await convexClient.query(api.documents.getDownload, {
      boundaryKey: getConvexBoundaryKey(),
      sessionTokenHash: await requireSessionTokenHash(),
      documentId,
    });
    const upstream = await fetch(download.url, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) throw new Error("DOCUMENT_NOT_FOUND");
    const safeName = download.filename.replace(/["\r\n]/g, "_");
    return new Response(upstream.body, {
      headers: {
        "Content-Type": download.mediaType,
        "Content-Length": String(download.byteSize),
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  } catch (error) {
    return apiError(error, requestCorrelationId);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const requestCorrelationId = correlationId();
  try {
    const { documentId } = await context.params;
    const input = deleteSchema.parse(await request.json());
    const result = await convexClient.mutation(api.documents.remove, {
      boundaryKey: getConvexBoundaryKey(),
      sessionTokenHash: await requireSessionTokenHash(),
      documentId,
      assetId: input.assetId,
      expectedAssetVersion: input.expectedAssetVersion,
      expectedDocumentVersion: input.expectedDocumentVersion,
      correlationId: input.requestId,
    });
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error, requestCorrelationId);
  }
}
