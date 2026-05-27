/**
 * TEMPORARY debug endpoint — remove after fixing Bitget.
 * Tests CCXT exchange connectivity from Vercel's runtime.
 */

import { NextRequest, NextResponse } from "next/server";
import ccxt, { type Exchange } from "ccxt";

export async function GET(request: NextRequest) {
  const exchangeId = request.nextUrl.searchParams.get("exchange") ?? "bitget";
  const results: Record<string, unknown> = {
    exchange: exchangeId,
    nodeVersion: process.version,
    platform: process.platform,
    region: process.env.VERCEL_REGION ?? "unknown",
  };

  try {
    // Step 1: Create instance (no credentials — just testing connectivity)
    const t0 = Date.now();
    const ccxtAny = ccxt as unknown as Record<string, new (config: object) => Exchange>;
    const ExchangeClass = ccxtAny[exchangeId];

    if (!ExchangeClass) {
      return NextResponse.json({ error: `Unknown exchange: ${exchangeId}` }, { status: 400 });
    }

    const exchange = new ExchangeClass({
      enableRateLimit: true,
      timeout: 15000,
      options: { defaultType: "spot" },
    });

    results.instanceCreated = true;
    results.ccxtVersion = ccxt.version;

    // Step 2: Load markets (heaviest operation, no auth needed)
    const t1 = Date.now();
    await exchange.loadMarkets();
    const t2 = Date.now();
    results.loadMarketsMs = t2 - t1;
    results.marketCount = Object.keys(exchange.markets).length;

    // Step 3: Try a public endpoint (no auth)
    const t3 = Date.now();
    const ticker = await exchange.fetchTicker("BTC/USDT");
    const t4 = Date.now();
    results.fetchTickerMs = t4 - t3;
    results.btcPrice = ticker.last;
    results.totalMs = t4 - t0;
    results.success = true;
  } catch (err) {
    results.error = err instanceof Error ? err.message : String(err);
    results.errorType = err instanceof Error ? err.constructor.name : "unknown";
    results.success = false;
  }

  return NextResponse.json(results);
}
