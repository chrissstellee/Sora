import "server-only";
import { ConvexHttpClient } from "convex/browser";

export const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function getConvexBoundaryKey(): string {
  const key = process.env.CONVEX_SERVER_BOUNDARY_KEY;
  if (!key) throw new Error("CONVEX_SERVER_BOUNDARY_KEY is not configured");
  return key;
}
