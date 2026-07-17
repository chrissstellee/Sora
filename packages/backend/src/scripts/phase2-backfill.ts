import { ConvexHttpClient } from "convex/browser";

import { api } from "../../convex/_generated/api.js";

const convexUrl = process.env.CONVEX_URL;
const boundaryKey = process.env.CONVEX_SERVER_BOUNDARY_KEY;

if (!convexUrl || !boundaryKey) {
  throw new Error("CONVEX_URL and CONVEX_SERVER_BOUNDARY_KEY are required");
}

const client = new ConvexHttpClient(convexUrl);
let cursor: string | null = null;
let processed = 0;

for (;;) {
  const result: { continueCursor: string; isDone: boolean; processed: number } =
    await client.mutation(api.assets.backfillLifecycleCounts, {
      boundaryKey,
      paginationOpts: { cursor, numItems: 50 },
    });
  processed += result.processed;
  if (result.isDone) break;
  cursor = result.continueCursor;
}

console.log(`Lifecycle aggregate backfill complete (${processed} assets processed).`);
