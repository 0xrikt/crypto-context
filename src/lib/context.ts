import type { PortfolioSnapshot } from "./exchange";
import type { WalletSnapshot } from "./wallet";

/**
 * Per-source fetch outcome, rendered into the context so the reading AI knows
 * whether the picture is complete and how fresh each venue's numbers are.
 */
export interface SourceStatus {
  /** e.g. "binance" or "ethereum:0x3641…dcc3" */
  label: string;
  kind: "exchange" | "wallet";
  status: "live" | "cached" | "unreachable";
  /** When this source's data was actually fetched (null when unreachable). */
  fetchedAt: string | null;
}

function formatUsd(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatSyncTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

const STATUS_LABELS: Record<SourceStatus["status"], string> = {
  live: "live",
  cached: "cached snapshot (live fetch failed)",
  unreachable: "unreachable (no cached data)",
};

function renderSourceStatuses(statuses: SourceStatus[]): string[] {
  const lines: string[] = [];
  lines.push("## Data Sources");
  lines.push("");
  lines.push("| Source | Type | Status | Data as of |");
  lines.push("|--------|------|--------|------------|");
  for (const s of statuses) {
    lines.push(
      `| ${s.label} | ${s.kind} | ${STATUS_LABELS[s.status]} | ${formatSyncTime(s.fetchedAt)} |`,
    );
  }
  return lines;
}

export function generatePortfolioContext(
  snapshots: PortfolioSnapshot[],
  walletSnapshots: WalletSnapshot[] = [],
  sourceStatuses: SourceStatus[] = []
): string {
  if (snapshots.length === 0 && walletSnapshots.length === 0) {
    // Connected-but-unreachable is NOT the same as not-connected: the holdings
    // are unknown right now, and the reading AI must not conclude "empty portfolio".
    if (sourceStatuses.length > 0) {
      const lines = [
        "# Portfolio Snapshot",
        `> ⚠ All ${sourceStatuses.length} connected source${sourceStatuses.length > 1 ? "s are" : " is"} currently unreachable and no cached data exists yet.`,
        "> Holdings are UNKNOWN right now — do not treat this portfolio as empty. Suggest the user re-sync in a moment.",
        "",
        ...renderSourceStatuses(sourceStatuses),
      ];
      return lines.join("\n");
    }
    return "# Portfolio\n\nNo exchanges or wallets connected yet.";
  }

  const aggregated = new Map<
    string,
    {
      asset: string;
      total: number;
      usdValue: number;
      unpriced: boolean;
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
        existing.unpriced ||= h.usdValue === null;
        existing.venues.push({ source: snapshot.exchange, amount: h.total });
      } else {
        aggregated.set(h.asset, {
          asset: h.asset,
          total: h.total,
          usdValue: h.usdValue ?? 0,
          unpriced: h.usdValue === null,
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
        existing.unpriced ||= h.usdValue === null;
        existing.venues.push({ source: h.source, amount: h.total });
      } else {
        aggregated.set(h.asset, {
          asset: h.asset,
          total: h.total,
          usdValue: h.usdValue ?? 0,
          unpriced: h.usdValue === null,
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

  if (sorted.some(h => h.unpriced)) {
    lines.push("> ⚠ Valuation incomplete: some assets have no price. Total and percentages cover priced balances only, not the entire portfolio.");
  }
  lines.push("> Coverage: connected exchange balance accounts and supported wallet balances only. EVM token discovery uses a fixed supported-token list; DeFi positions, staking, debt and other account types may be absent.");
  const degraded = sourceStatuses.filter((s) => s.status !== "live");
  if (degraded.length > 0) {
    const cached = degraded.filter((s) => s.status === "cached");
    const missing = degraded.filter((s) => s.status === "unreachable");
    const parts: string[] = [];
    if (cached.length > 0)
      parts.push(`${cached.map((s) => s.label).join(", ")} shown from a cached snapshot`);
    if (missing.length > 0)
      parts.push(`${missing.map((s) => s.label).join(", ")} missing entirely`);
    lines.push(`> ⚠ Incomplete picture: ${parts.join("; ")}. See Data Sources below.`);
  }
  lines.push("");

  lines.push("## Holdings");
  lines.push("");
  lines.push("| Asset | Amount | Value | % of Portfolio | Location |");
  lines.push("|-------|--------|-------|----------------|----------|");

  for (const h of sorted) {
    if (!h.unpriced && h.usdValue < 1) continue;

    const pct =
      grandTotal > 0 ? formatPercent((h.usdValue / grandTotal) * 100) : "—";

    const location = h.venues
      .map(
        (v) =>
          `${v.source} (${v.amount.toLocaleString("en-US", { maximumFractionDigits: 4 })})`
      )
      .join(" + ");

    lines.push(
      `| ${h.asset} | ${h.total.toLocaleString("en-US", { maximumFractionDigits: 6 })} | ${h.unpriced ? "Unknown (price unavailable)" : formatUsd(h.usdValue)} | ${h.unpriced ? "—" : pct} | ${location} |`
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

  if (sourceStatuses.length > 0) {
    lines.push("");
    lines.push(...renderSourceStatuses(sourceStatuses));
  }

  return lines.join("\n");
}

export interface ContextDocument {
  dimension: string;
  content: string;
  updated_at: string;
}

export interface FullContextMeta {
  /** When the investor profile was generated (used to flag staleness vs notes). */
  profileGeneratedAt?: string | null;
  /** When the user last edited their strategy notes. */
  notesUpdatedAt?: string | null;
}

export function generateFullContext(
  portfolioMd: string,
  contextDocs: ContextDocument[],
  investorProfileMd?: string,
  notesMd?: string,
  meta: FullContextMeta = {},
): string {
  const sections: string[] = [];
  const hasNotes = !!(notesMd && notesMd.trim());
  const hasProfile = !!(investorProfileMd && investorProfileMd.trim());

  const tradingProfiles = contextDocs.filter((d) => d.dimension === "trading_profile");
  const fundFlows = contextDocs.filter((d) => d.dimension === "fund_flow");

  // Header: what this document is and how the reading agent should treat it.
  const contents: string[] = [];
  if (hasNotes) contents.push("Investor Notes (the user's own words)");
  if (hasProfile) contents.push("Investor Profile (synthesized)");
  contents.push("Portfolio Snapshot");
  if (tradingProfiles.length > 0) contents.push("Trading Profile (per exchange)");
  if (fundFlows.length > 0) contents.push("Fund Flow (per exchange)");

  sections.push("# Crypto Investor Context");
  sections.push(`> Generated: ${new Date().toISOString()}`);
  sections.push(
    "> For the AI reading this: every figure below is computed from the user's actual exchange/wallet data — ground your advice in these numbers and never invent ones that aren't here. Check the Data Sources table for per-venue freshness before treating the picture as complete.",
  );
  sections.push(`> Contents: ${contents.join(" → ")}.`);
  sections.push("");

  // Investor notes LEAD the context — the user's OWN words (thesis, rules, ideas to
  // try). This is their explicit intent, so an agent should read it first, before the
  // AI synthesis, and it must never be buried. Only included when the user has written it.
  if (hasNotes) {
    sections.push("# Investor Notes (the user's own strategy, in their words)");
    sections.push("");
    sections.push(notesMd!.trim());
    sections.push("");
    sections.push("---");
    sections.push("");
  }

  // Investor profile — the holistic AI synthesis of who this investor is.
  // Falls back gracefully when not yet generated.
  if (hasProfile) {
    sections.push(investorProfileMd!.trim());
    sections.push("\n> This profile reflects data at its generation time. Holdings and source coverage may have changed; current portfolio evidence takes precedence over older profile claims.");

    // A profile generated before the user's latest notes can contradict them
    // (e.g. notes rewritten in another language, or a thesis change). Tell the
    // agent which one wins instead of letting it reconcile silently.
    if (
      hasNotes &&
      meta.profileGeneratedAt &&
      meta.notesUpdatedAt &&
      new Date(meta.notesUpdatedAt).getTime() > new Date(meta.profileGeneratedAt).getTime()
    ) {
      const notesDate = meta.notesUpdatedAt.slice(0, 10);
      const profileDate = meta.profileGeneratedAt.slice(0, 10);
      // Same-day edits make a date comparison read as a contradiction — drop it.
      const dates = notesDate !== profileDate ? ` (notes ${notesDate} vs profile ${profileDate})` : "";
      sections.push("");
      sections.push(
        `> ⚠ The Investor Notes above were updated after this profile was generated${dates}. Where they disagree, the user's notes are authoritative.`,
      );
    }
    sections.push("");
    sections.push("---");
    sections.push("");
  }

  // Portfolio (always included, real-time)
  sections.push(portfolioMd);

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
