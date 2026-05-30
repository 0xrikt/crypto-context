/**
 * GET /api/exchange/portfolio
 * Fetch fresh portfolio for the authenticated user.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getConnections, getConnectionCredentials, saveSnapshot, getWallets } from "@/lib/store";
import { fetchPortfolio, type PortfolioSnapshot } from "@/lib/exchange";
import { fetchWalletPortfolioForChain, type WalletSnapshot } from "@/lib/wallet";
import { generatePortfolioContext } from "@/lib/context";
import {
  checkRateLimit,
  RATE_LIMITS,
  getClientIp,
  sanitizeExchangeError,
} from "@/lib/security";

/** Portfolio fetch can be slow for users with many assets across exchanges */
export const maxDuration = 60;

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

  const [connections, wallets] = await Promise.all([
    getConnections(user.id),
    getWallets(user.id),
  ]);

  if (connections.length === 0 && wallets.length === 0) {
    return NextResponse.json({
      snapshots: [],
      walletSnapshots: [],
      context: "# Portfolio\n\nNo exchanges or wallets connected yet.",
      totalUsdValue: 0,
    });
  }

  const errors: { source: string; error: string }[] = [];

  // Helper: race a promise against a timeout (returns null on timeout)
  function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T | null> {
    return Promise.race([
      promise,
      new Promise<null>((resolve) =>
        setTimeout(() => {
          console.error(`[portfolio] Timeout after ${ms}ms: ${label}`);
          errors.push({ source: label, error: `Timed out after ${ms / 1000}s` });
          resolve(null);
        }, ms)
      ),
    ]);
  }

  // Fetch ALL exchange + wallet portfolios in parallel with individual timeouts
  const exchangePromises = connections.map((conn) =>
    withTimeout(
      (async () => {
        const creds = await getConnectionCredentials(conn.id, user.id);
        if (!creds) return null;
        const snapshot = await fetchPortfolio(creds.exchange, creds.credentials);
        await saveSnapshot(user.id, conn.id, snapshot);
        return snapshot;
      })(),
      20_000,
      conn.exchange
    ).catch((err) => {
      const rawMessage = err instanceof Error ? err.message : String(err);
      console.error(`[portfolio] Failed to fetch ${conn.exchange}: ${rawMessage}`);
      errors.push({
        source: conn.exchange,
        error: sanitizeExchangeError(rawMessage, conn.exchange),
      });
      return null;
    })
  );

  const walletPromises = wallets.map((w) =>
    withTimeout(
      fetchWalletPortfolioForChain(w.address, w.chain),
      15_000,
      `${w.chain}:${w.address.slice(0, 10)}`
    ).catch((err) => {
      console.error(
        `[portfolio] Wallet fetch failed: chain=${w.chain}`,
        err instanceof Error ? err.message : "unknown"
      );
      errors.push({
        source: `${w.chain}:${w.address.slice(0, 10)}...`,
        error: "Failed to fetch wallet balances",
      });
      return null;
    })
  );

  const results = await Promise.all([...exchangePromises, ...walletPromises]);

  const snapshots = results
    .slice(0, connections.length)
    .filter((s): s is PortfolioSnapshot => s !== null && "exchange" in s);
  const walletSnapshots = results
    .slice(connections.length)
    .filter((s): s is WalletSnapshot => s !== null && "address" in s);

  const context = generatePortfolioContext(snapshots, walletSnapshots);
  const totalUsdValue =
    snapshots.reduce((sum, s) => sum + s.totalUsdValue, 0) +
    walletSnapshots.reduce((sum, s) => sum + s.totalUsdValue, 0);

  const aggregated = new Map<string, { asset: string; amount: number; usdValue: number; sources: string[] }>();

  for (const s of snapshots) {
    for (const h of s.holdings) {
      const existing = aggregated.get(h.asset);
      if (existing) {
        aggregated.set(h.asset, {
          ...existing,
          amount: existing.amount + h.total,
          usdValue: existing.usdValue + (h.usdValue ?? 0),
          sources: existing.sources.includes(s.exchange)
            ? existing.sources
            : [...existing.sources, s.exchange],
        });
      } else {
        aggregated.set(h.asset, { asset: h.asset, amount: h.total, usdValue: h.usdValue ?? 0, sources: [s.exchange] });
      }
    }
  }

  for (const ws of walletSnapshots) {
    for (const h of ws.holdings) {
      const source = h.source;
      const existing = aggregated.get(h.asset);
      if (existing) {
        aggregated.set(h.asset, {
          ...existing,
          amount: existing.amount + h.total,
          usdValue: existing.usdValue + (h.usdValue ?? 0),
          sources: existing.sources.includes(source)
            ? existing.sources
            : [...existing.sources, source],
        });
      } else {
        aggregated.set(h.asset, { asset: h.asset, amount: h.total, usdValue: h.usdValue ?? 0, sources: [source] });
      }
    }
  }

  const holdings = Array.from(aggregated.values())
    .filter((h) => h.usdValue >= 1)
    .sort((a, b) => b.usdValue - a.usdValue)
    .map((h) => ({
      ...h,
      allocation: totalUsdValue > 0 ? Number(((h.usdValue / totalUsdValue) * 100).toFixed(1)) : 0,
    }));

  return NextResponse.json({
    snapshots: snapshots.map((s) => ({
      exchange: s.exchange,
      totalUsdValue: s.totalUsdValue,
      holdingsCount: s.holdings.length,
      fetchedAt: s.fetchedAt,
    })),
    walletSnapshots: walletSnapshots.map((s) => ({
      address: s.address,
      chain: s.chain,
      totalUsdValue: s.totalUsdValue,
      holdingsCount: s.holdings.length,
      fetchedAt: s.fetchedAt,
    })),
    holdings,
    context,
    totalUsdValue,
    errors: errors.length > 0 ? errors : undefined,
  });
}
