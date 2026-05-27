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

    const t1 = Date.now();
    await exchange.loadMarkets();
    const t2 = Date.now();
    results.loadMarketsMs = t2 - t1;
    results.marketCount = Object.keys(exchange.markets).length;

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

export async function POST(request: NextRequest) {
  // Test verifyReadOnly flow with credentials
  const body = await request.json();
  const { exchange: exchangeId, apiKey, secret, password } = body as {
    exchange: string;
    apiKey: string;
    secret: string;
    password?: string;
  };

  const results: Record<string, unknown> = {
    exchange: exchangeId,
    region: process.env.VERCEL_REGION ?? "unknown",
    steps: [] as string[],
  };
  const steps = results.steps as string[];

  try {
    const ccxtAny = ccxt as unknown as Record<string, new (config: object) => Exchange>;
    const ExchangeClass = ccxtAny[exchangeId];
    if (!ExchangeClass) {
      return NextResponse.json({ error: `Unknown exchange: ${exchangeId}` }, { status: 400 });
    }

    steps.push("creating instance");
    const t0 = Date.now();
    const exchange = new ExchangeClass({
      apiKey,
      secret,
      password,
      enableRateLimit: true,
      timeout: 15000,
      options: { defaultType: "spot" },
    });
    steps.push(`instance created in ${Date.now() - t0}ms`);

    steps.push("calling fetchBalance");
    const t1 = Date.now();
    const balances = await exchange.fetchBalance();
    const t2 = Date.now();
    steps.push(`fetchBalance completed in ${t2 - t1}ms`);

    // Count non-zero balances
    const nonZero = Object.entries(balances.total).filter(
      ([, v]) => (v as number) > 0
    );
    results.nonZeroAssets = nonZero.length;
    results.assetNames = nonZero.map(([k]) => k);
    results.totalMs = t2 - t0;
    results.success = true;
  } catch (err) {
    results.error = err instanceof Error ? err.message : String(err);
    results.errorType = err instanceof Error ? err.constructor.name : "unknown";
    results.success = false;
    steps.push(`FAILED: ${err instanceof Error ? err.constructor.name : "unknown"}`);
  }

  return NextResponse.json(results);
}
