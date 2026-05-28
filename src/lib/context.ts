import type { PortfolioSnapshot, PortfolioHolding } from "./exchange";
import type { WalletSnapshot } from "./wallet";

export interface UserContext {
  portfolio: string;
  updatedAt: string;
}

function formatUsd(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function generatePortfolioContext(
  snapshots: PortfolioSnapshot[],
  walletSnapshots: WalletSnapshot[] = []
): string {
  if (snapshots.length === 0 && walletSnapshots.length === 0) {
    return "# Portfolio\n\nNo exchanges or wallets connected yet.";
  }

  const aggregated = new Map<
    string,
    {
      asset: string;
      total: number;
      usdValue: number;
      venues: { source: string; amount: number }[];
    }
  >();

  let grandTotal = 0;

  // Aggregate CEX holdings
  for (const snapshot of snapshots) {
    for (const h of snapshot.holdings) {
      const existing = aggregated.get(h.asset);
      if (existing) {
        existing.total += h.total;
        existing.usdValue += h.usdValue ?? 0;
        existing.venues.push({ source: snapshot.exchange, amount: h.total });
      } else {
        aggregated.set(h.asset, {
          asset: h.asset,
          total: h.total,
          usdValue: h.usdValue ?? 0,
          venues: [{ source: snapshot.exchange, amount: h.total }],
        });
      }
    }
    grandTotal += snapshot.totalUsdValue;
  }

  // Aggregate wallet holdings
  for (const ws of walletSnapshots) {
    for (const h of ws.holdings) {
      const existing = aggregated.get(h.asset);
      if (existing) {
        existing.total += h.total;
        existing.usdValue += h.usdValue ?? 0;
        existing.venues.push({ source: h.source, amount: h.total });
      } else {
        aggregated.set(h.asset, {
          asset: h.asset,
          total: h.total,
          usdValue: h.usdValue ?? 0,
          venues: [{ source: h.source, amount: h.total }],
        });
      }
    }
    grandTotal += ws.totalUsdValue;
  }

  const sorted = Array.from(aggregated.values()).sort(
    (a, b) => b.usdValue - a.usdValue
  );

  const lines: string[] = [];

  const cexSyncs = snapshots.map((s) => s.fetchedAt);
  const walletSyncs = walletSnapshots.map((s) => s.fetchedAt);
  const lastSync = [...cexSyncs, ...walletSyncs].sort().pop();

  const sourceCount = snapshots.length + walletSnapshots.length;
  const sourceParts: string[] = [];
  if (snapshots.length > 0)
    sourceParts.push(`${snapshots.length} exchange${snapshots.length > 1 ? "s" : ""}`);
  if (walletSnapshots.length > 0)
    sourceParts.push(`${walletSnapshots.length} wallet${walletSnapshots.length > 1 ? "s" : ""}`);

  lines.push("# Portfolio Snapshot");
  lines.push(`> Last synced: ${lastSync}`);
  lines.push(
    `> Total value: ${formatUsd(grandTotal)} (across ${sourceParts.join(" + ")})`
  );
  lines.push("");

  lines.push("## Holdings");
  lines.push("");
  lines.push("| Asset | Amount | Value | % of Portfolio | Location |");
  lines.push("|-------|--------|-------|----------------|----------|");

  for (const h of sorted) {
    if (h.usdValue < 1) continue;

    const pct =
      grandTotal > 0 ? formatPercent((h.usdValue / grandTotal) * 100) : "—";

    const location = h.venues
      .map(
        (v) =>
          `${v.source} (${v.amount.toLocaleString("en-US", { maximumFractionDigits: 4 })})`
      )
      .join(" + ");

    lines.push(
      `| ${h.asset} | ${h.total.toLocaleString("en-US", { maximumFractionDigits: 6 })} | ${formatUsd(h.usdValue)} | ${pct} | ${location} |`
    );
  }

  lines.push("");

  if (sorted.length > 0 && grandTotal > 0) {
    lines.push("## Concentration");

    const top1 = sorted[0];
    const top1pct = (top1.usdValue / grandTotal) * 100;
    lines.push(
      `- Top 1 asset: ${top1.asset} ${formatPercent(top1pct)}${top1pct > 50 ? " (HIGH concentration)" : ""}`
    );

    const top3value = sorted
      .slice(0, 3)
      .reduce((sum, h) => sum + h.usdValue, 0);
    lines.push(
      `- Top 3 assets: ${formatPercent((top3value / grandTotal) * 100)}`
    );

    const stablecoins = ["USDT", "USDC", "USD", "BUSD", "DAI", "TUSD"];
    const stableValue = sorted
      .filter((h) => stablecoins.includes(h.asset))
      .reduce((sum, h) => sum + h.usdValue, 0);
    const stablePct = (stableValue / grandTotal) * 100;
    lines.push(
      `- Stablecoin ratio: ${formatPercent(stablePct)}${stablePct < 5 ? " (LOW cash reserve)" : stablePct > 50 ? " (HIGH cash position)" : ""}`
    );

    lines.push("");

    // Source distribution
    lines.push("## Distribution");
    for (const snapshot of snapshots) {
      const pct = (snapshot.totalUsdValue / grandTotal) * 100;
      lines.push(
        `- ${snapshot.exchange}: ${formatPercent(pct)} (${formatUsd(snapshot.totalUsdValue)})`
      );
    }
    for (const ws of walletSnapshots) {
      const pct = (ws.totalUsdValue / grandTotal) * 100;
      const shortAddr = `${ws.address.slice(0, 6)}...${ws.address.slice(-4)}`;
      lines.push(
        `- ${ws.chain}:${shortAddr}: ${formatPercent(pct)} (${formatUsd(ws.totalUsdValue)})`
      );
    }
  }

  return lines.join("\n");
}

export function buildUserContext(
  snapshots: PortfolioSnapshot[],
  walletSnapshots: WalletSnapshot[] = []
): UserContext {
  return {
    portfolio: generatePortfolioContext(snapshots, walletSnapshots),
    updatedAt: new Date().toISOString(),
  };
}

export interface ContextDocument {
  dimension: string;
  content: string;
  updated_at: string;
}

export function generateFullContext(
  portfolioMd: string,
  contextDocs: ContextDocument[],
): string {
  const sections: string[] = [];

  sections.push("# Crypto Investor Context");
  sections.push(`> Generated: ${new Date().toISOString()}`);
  sections.push("");

  // Portfolio (always included, real-time)
  sections.push(portfolioMd);

  // Group by dimension, append each
  const tradingProfiles = contextDocs.filter((d) => d.dimension === "trading_profile");
  const fundFlows = contextDocs.filter((d) => d.dimension === "fund_flow");

  if (tradingProfiles.length > 0) {
    sections.push("");
    sections.push("---");
    sections.push("");
    for (const doc of tradingProfiles) {
      sections.push(doc.content);
    }
  }

  if (fundFlows.length > 0) {
    sections.push("");
    sections.push("---");
    sections.push("");
    for (const doc of fundFlows) {
      sections.push(doc.content);
    }
  }

  if (tradingProfiles.length === 0 && fundFlows.length === 0) {
    sections.push("");
    sections.push("---");
    sections.push("");
    sections.push("*Trading profile and fund flow analysis not yet available. Sync your exchange to generate.*");
  }

  return sections.join("\n");
}
