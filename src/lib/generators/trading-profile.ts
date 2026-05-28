import type { TradeRecord, OrderRecord } from "../exchange-history";

interface PairStats {
  symbol: string;
  tradeCount: number;
  buyCount: number;
  sellCount: number;
  totalVolume: number;
  buyVolume: number;
  sellVolume: number;
}

interface TradingAnalysis {
  tradeCount: number;
  dateRange: { from: string; to: string } | null;
  tradesPerWeek: number;
  uniquePairs: number;
  pairStats: PairStats[];
  buyCount: number;
  sellCount: number;
  buyVolume: number;
  sellVolume: number;
  avgTradeSize: number;
  medianTradeSize: number;
  maxTradeSize: number;
  limitOrderRatio: number;
  totalFees: number;
  recentTrades: TradeRecord[];
  openOrders: OrderRecord[];
  dcaAssets: string[];
}

function formatUsd(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value.toFixed(0)}`;
}

function formatDate(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function detectDCA(trades: TradeRecord[]): string[] {
  const buysBySymbol = new Map<string, number[]>();
  for (const t of trades) {
    if (t.side !== "buy") continue;
    const existing = buysBySymbol.get(t.symbol) ?? [];
    existing.push(t.timestamp);
    buysBySymbol.set(t.symbol, existing);
  }

  const dcaAssets: string[] = [];
  const DAY_MS = 24 * 60 * 60 * 1000;

  for (const [symbol, timestamps] of buysBySymbol) {
    if (timestamps.length < 4) continue;
    const sorted = [...timestamps].sort((a, b) => a - b);
    const intervals = sorted.slice(1).map((t, i) => (t - sorted[i]) / DAY_MS);
    const med = median(intervals);

    const regularPeriods = [7, 14, 30];
    for (const period of regularPeriods) {
      if (Math.abs(med - period) / period < 0.25) {
        dcaAssets.push(symbol.split("/")[0]);
        break;
      }
    }
  }

  return dcaAssets;
}

function analyze(
  trades: TradeRecord[],
  closedOrders: OrderRecord[],
  openOrders: OrderRecord[],
): TradingAnalysis {
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const recentTrades = trades.filter((t) => t.timestamp > now - SEVEN_DAYS);

  if (trades.length === 0) {
    return {
      tradeCount: 0,
      dateRange: null,
      tradesPerWeek: 0,
      uniquePairs: 0,
      pairStats: [],
      buyCount: 0,
      sellCount: 0,
      buyVolume: 0,
      sellVolume: 0,
      avgTradeSize: 0,
      medianTradeSize: 0,
      maxTradeSize: 0,
      limitOrderRatio: 0,
      totalFees: 0,
      recentTrades,
      openOrders,
      dcaAssets: [],
    };
  }

  const first = trades[0].timestamp;
  const last = trades[trades.length - 1].timestamp;
  const spanWeeks = Math.max((last - first) / (7 * 24 * 60 * 60 * 1000), 1);

  const pairMap = new Map<string, PairStats>();
  let buyCount = 0;
  let sellCount = 0;
  let buyVolume = 0;
  let sellVolume = 0;
  let totalFees = 0;
  const tradeSizes: number[] = [];

  for (const t of trades) {
    const stats = pairMap.get(t.symbol) ?? {
      symbol: t.symbol,
      tradeCount: 0,
      buyCount: 0,
      sellCount: 0,
      totalVolume: 0,
      buyVolume: 0,
      sellVolume: 0,
    };

    stats.tradeCount++;
    stats.totalVolume += t.cost;
    tradeSizes.push(t.cost);
    totalFees += t.fee;

    if (t.side === "buy") {
      buyCount++;
      buyVolume += t.cost;
      stats.buyCount++;
      stats.buyVolume += t.cost;
    } else {
      sellCount++;
      sellVolume += t.cost;
      stats.sellCount++;
      stats.sellVolume += t.cost;
    }

    pairMap.set(t.symbol, stats);
  }

  const pairStats = Array.from(pairMap.values()).sort(
    (a, b) => b.totalVolume - a.totalVolume,
  );

  const limitOrders = closedOrders.filter((o) => o.type === "limit").length;
  const limitOrderRatio =
    closedOrders.length > 0 ? limitOrders / closedOrders.length : 0;

  return {
    tradeCount: trades.length,
    dateRange: { from: formatDate(first), to: formatDate(last) },
    tradesPerWeek: trades.length / spanWeeks,
    uniquePairs: pairStats.length,
    pairStats,
    buyCount,
    sellCount,
    buyVolume,
    sellVolume,
    avgTradeSize: tradeSizes.length > 0 ? tradeSizes.reduce((a, b) => a + b, 0) / tradeSizes.length : 0,
    medianTradeSize: median(tradeSizes),
    maxTradeSize: Math.max(...tradeSizes, 0),
    limitOrderRatio,
    totalFees,
    recentTrades,
    openOrders,
    dcaAssets: detectDCA(trades),
  };
}

export function generateTradingProfile(
  trades: TradeRecord[],
  closedOrders: OrderRecord[],
  openOrders: OrderRecord[],
  exchangeName: string,
): { markdown: string; metadata: Record<string, unknown> } {
  const a = analyze(trades, closedOrders, openOrders);
  const lines: string[] = [];

  lines.push(`# Trading Profile — ${exchangeName}`);

  if (a.tradeCount === 0 && a.openOrders.length === 0) {
    lines.push("> No trading activity found in the last 90 days.");
    lines.push("");
    lines.push("This account appears to be used primarily for holding, not active trading.");
    return {
      markdown: lines.join("\n"),
      metadata: { tradeCount: 0, hasOpenOrders: false },
    };
  }

  if (a.tradeCount > 0 && a.dateRange) {
    lines.push(`> Based on ${a.tradeCount} trades (${a.dateRange.from} to ${a.dateRange.to})`);
    lines.push("");

    // Activity Summary
    lines.push("## Activity Summary");
    lines.push(`- Trades per week: ${a.tradesPerWeek.toFixed(1)}`);
    lines.push(`- Unique pairs traded: ${a.uniquePairs}`);
    lines.push(`- Total volume: ${formatUsd(a.buyVolume + a.sellVolume)}`);
    lines.push(`- Total fees paid: ${formatUsd(a.totalFees)}`);
    lines.push("");

    // Top Traded Pairs
    if (a.pairStats.length > 0) {
      lines.push("## Top Traded Pairs");
      lines.push("| Pair | Trades | Volume | Buy/Sell |");
      lines.push("|------|--------|--------|----------|");
      for (const p of a.pairStats.slice(0, 10)) {
        const buySell = `${p.buyCount}/${p.sellCount}`;
        lines.push(
          `| ${p.symbol} | ${p.tradeCount} | ${formatUsd(p.totalVolume)} | ${buySell} |`,
        );
      }
      lines.push("");
    }

    // Trading Patterns
    lines.push("## Trading Patterns");
    const netBias = a.buyVolume > a.sellVolume * 1.2
      ? "net accumulator"
      : a.sellVolume > a.buyVolume * 1.2
        ? "net distributor"
        : "balanced";
    lines.push(`- Buy/Sell ratio: ${a.buyCount}/${a.sellCount} (${netBias})`);
    lines.push(`- Buy volume: ${formatUsd(a.buyVolume)} | Sell volume: ${formatUsd(a.sellVolume)}`);
    lines.push(`- Avg trade size: ${formatUsd(a.avgTradeSize)}`);
    lines.push(`- Median trade size: ${formatUsd(a.medianTradeSize)}`);
    lines.push(`- Max trade size: ${formatUsd(a.maxTradeSize)}`);
    if (a.limitOrderRatio > 0) {
      lines.push(`- Limit order usage: ${(a.limitOrderRatio * 100).toFixed(0)}%`);
    }
    if (a.dcaAssets.length > 0) {
      lines.push(`- DCA detected: ${a.dcaAssets.join(", ")} (regular recurring buys)`);
    }
    lines.push("");

    // Recent Activity
    if (a.recentTrades.length > 0) {
      lines.push("## Recent Activity (Last 7 Days)");
      lines.push(`- ${a.recentTrades.length} trades executed`);
      const recentBuys = a.recentTrades.filter((t) => t.side === "buy");
      const recentSells = a.recentTrades.filter((t) => t.side === "sell");
      if (recentBuys.length > 0) {
        const assets = [...new Set(recentBuys.map((t) => t.symbol.split("/")[0]))];
        lines.push(`- Bought: ${assets.join(", ")}`);
      }
      if (recentSells.length > 0) {
        const assets = [...new Set(recentSells.map((t) => t.symbol.split("/")[0]))];
        lines.push(`- Sold: ${assets.join(", ")}`);
      }
      lines.push("");
    }
  }

  // Open Orders
  if (a.openOrders.length > 0) {
    lines.push("## Open Orders");
    lines.push("| Pair | Side | Type | Price | Amount |");
    lines.push("|------|------|------|-------|--------|");
    for (const o of a.openOrders) {
      lines.push(
        `| ${o.symbol} | ${o.side} | ${o.type} | $${o.price.toFixed(2)} | ${o.amount} |`,
      );
    }
    lines.push("");
  }

  return {
    markdown: lines.join("\n"),
    metadata: {
      tradeCount: a.tradeCount,
      dateRange: a.dateRange,
      uniquePairs: a.uniquePairs,
      tradesPerWeek: Math.round(a.tradesPerWeek * 10) / 10,
      hasOpenOrders: a.openOrders.length > 0,
    },
  };
}
