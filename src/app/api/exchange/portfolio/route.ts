/**
 * GET /api/exchange/portfolio
 * Fetch fresh portfolio for the authenticated user.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getConnections, getConnectionCredentials, saveSnapshot } from "@/lib/store";
import { fetchPortfolio, type PortfolioSnapshot } from "@/lib/exchange";
import { generatePortfolioContext } from "@/lib/context";
import {
  checkRateLimit,
  RATE_LIMITS,
  getClientIp,
  sanitizeExchangeError,
} from "@/lib/security";

export async function GET(request: NextRequest) {
  // Rate limiting
  const ip = getClientIp(request.headers);
  const rateLimit = checkRateLimit(
    ip,
    "exchange/portfolio",
    RATE_LIMITS.portfolioFetch.maxRequests,
    RATE_LIMITS.portfolioFetch.windowMs
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connections = await getConnections(user.id);

  if (connections.length === 0) {
    return NextResponse.json({
      snapshots: [],
      context: "# Portfolio\n\nNo exchanges connected yet.",
      totalUsdValue: 0,
    });
  }

  const snapshots: PortfolioSnapshot[] = [];
  const errors: { exchange: string; error: string }[] = [];

  for (const conn of connections) {
    const creds = await getConnectionCredentials(conn.id, user.id);
    if (!creds) continue;

    try {
      const snapshot = await fetchPortfolio(
        creds.exchange,
        creds.credentials
      );
      snapshots.push(snapshot);
      await saveSnapshot(user.id, conn.id, snapshot);
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : String(err);
      // Log raw error server-side, return sanitized to client
      console.error(`[portfolio] Failed to fetch ${conn.exchange}: ${rawMessage}`);
      errors.push({
        exchange: conn.exchange,
        error: sanitizeExchangeError(rawMessage, conn.exchange),
      });
    }
  }

  const context = generatePortfolioContext(snapshots);
  const totalUsdValue = snapshots.reduce(
    (sum, s) => sum + s.totalUsdValue,
    0
  );

  return NextResponse.json({
    snapshots: snapshots.map((s) => ({
      exchange: s.exchange,
      totalUsdValue: s.totalUsdValue,
      holdingsCount: s.holdings.length,
      fetchedAt: s.fetchedAt,
    })),
    context,
    totalUsdValue,
    errors: errors.length > 0 ? errors : undefined,
  });
}
