import { withTimeout } from "@/lib/timeout";
/**
 * POST /api/wallet/scan — probe one EVM address across all supported EVM
 * chains and report where it actually holds value.
 *
 * Powers the brand-first wallet import: the user pastes their MetaMask (etc.)
 * address once, we pre-check the chains that matter, and they confirm in one
 * click instead of adding 7 chains by hand. Read-only, nothing is saved here.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SUPPORTED_CHAINS, isValidEvmAddress, type SupportedChain } from "@/lib/chains";
import { fetchWalletPortfolioForChain } from "@/lib/wallet";
import { checkRateLimit, RATE_LIMITS, getClientIp } from "@/lib/security";

export const maxDuration = 30;

/** Per-chain probe budget — one slow RPC must not stall the whole scan. */
const PROBE_TIMEOUT_MS = 8_000;

interface ChainScanResult {
  chain: SupportedChain;
  ok: boolean;
  totalUsdValue: number;
  holdingsCount: number;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const rateLimit = checkRateLimit(
    ip,
    "wallet/scan",
    RATE_LIMITS.portfolioFetch.maxRequests,
    RATE_LIMITS.portfolioFetch.windowMs
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Invalid request body");
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const address = typeof body.address === "string" ? body.address.trim() : "";
  if (!isValidEvmAddress(address)) {
    return NextResponse.json(
      { error: "Invalid EVM address (0x…)" },
      { status: 400 }
    );
  }

  const results: ChainScanResult[] = await Promise.all(
    SUPPORTED_CHAINS.map(async (chain) => {
      try {
        const snapshot = await withTimeout(
          fetchWalletPortfolioForChain(address, chain),
          PROBE_TIMEOUT_MS
        );
        if (!snapshot) return { chain, ok: false, totalUsdValue: 0, holdingsCount: 0 };
        return {
          chain,
          ok: true,
          totalUsdValue: Math.round(snapshot.totalUsdValue * 100) / 100,
          holdingsCount: snapshot.holdings.length,
        };
      } catch {
        return { chain, ok: false, totalUsdValue: 0, holdingsCount: 0 };
      }
    })
  );

  return NextResponse.json({ chains: results });
}
