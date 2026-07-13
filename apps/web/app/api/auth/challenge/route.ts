import { NextResponse } from "next/server";

import { getServerKeypair, getHomeDomain, getWebAuthDomain } from "@/core/config/server-env";
import { convexClient } from "@/core/lib/convex-client";
import { api } from "@repo/backend/api";
import { generateSEP10Challenge } from "@repo/backend/stellar/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ error: "Missing wallet address" }, { status: 400 });
    }

    if (!/^G[A-D2-7][A-Z2-7]{54}$/.test(address)) {
      return NextResponse.json({ error: "Malformed address" }, { status: 400 });
    }

    const serverKeypair = getServerKeypair();
    const homeDomain = getHomeDomain(request);
    const webAuthDomain = getWebAuthDomain(request);
    const networkPassphrase =
      process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015";

    const challengeXdr = generateSEP10Challenge(
      serverKeypair.secret(),
      address,
      homeDomain,
      webAuthDomain,
      networkPassphrase,
    );

    await convexClient.mutation(api.auth.createChallenge, {
      walletAddress: address,
      challengeXdr,
    });

    return NextResponse.json({ challenge: challengeXdr });
  } catch (error) {
    console.error("Challenge generation error:", error);
    return NextResponse.json(
      { error: "Internal server error during challenge generation" },
      { status: 500 },
    );
  }
}
