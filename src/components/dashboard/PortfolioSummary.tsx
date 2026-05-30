"use client";

import { useEffect, useState } from "react";
import type { PortfolioData } from "./types";
import { Button, Spinner } from "@/components/ui";
import { timeAgo } from "@/lib/timeAgo";
import { cn } from "@/lib/cn";

interface Props {
  portfolio: PortfolioData;
  syncing: boolean;
  contextSyncing: boolean;
  lastSyncedAt: Date | null;
  onSync: () => void;
}

function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

const RefreshIcon = (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
    />
  </svg>
);

export function PortfolioSummary({ portfolio, syncing, contextSyncing, lastSyncedAt, onSync }: Props) {
  // Gate relative time behind mount to avoid SSR/client hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const sourceCount = portfolio.snapshots.length + (portfolio.walletSnapshots?.length ?? 0);

  const syncLabel = syncing ? "Fetching balances…" : contextSyncing ? "Analyzing trades…" : null;
  const subtitle =
    syncLabel ??
    (mounted && lastSyncedAt ? `Last synced ${timeAgo(lastSyncedAt)}` : "Live across your connected sources");

  const secondary = [
    {
      label: "Assets",
      value: String(portfolio.holdings.length),
      detail:
        portfolio.holdings.length > 0
          ? `top ${portfolio.holdings[0].asset} · ${portfolio.holdings[0].allocation}%`
          : "none tracked",
    },
    {
      label: "Exchanges",
      value: String(portfolio.snapshots.length),
      detail: portfolio.snapshots.map((s) => s.exchange).join(", ") || "none",
    },
    {
      label: "Wallets",
      value: String(portfolio.walletSnapshots?.length ?? 0),
      detail: portfolio.walletSnapshots?.map((w) => w.chain).join(", ") || "none",
    },
  ];

  return (
    <section>
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">Portfolio</h2>
          <p
            className={cn(
              "text-xs mt-0.5 flex items-center gap-1.5",
              syncLabel ? "text-emerald-600" : "text-gray-400"
            )}
          >
            {syncLabel && <Spinner size="sm" />}
            {subtitle}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={onSync} loading={syncing} leftIcon={RefreshIcon}>
          {syncing ? "Syncing…" : "Sync"}
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Hero — total value, elevated with gradient + glow + ring */}
        <div className="relative overflow-hidden glass rounded-xl p-4 ring-1 ring-emerald-100">
          <div className="glow -left-12 -top-12" aria-hidden="true" />
          <div className="relative">
            <div className="text-xs text-gray-400 mb-1">Total value</div>
            <div className="text-2xl font-bold tracking-tight text-gradient">
              {formatUsd(portfolio.totalUsdValue)}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              across {sourceCount} source{sourceCount !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* Secondary stats */}
        {secondary.map((s) => (
          <div key={s.label} className="glass glass-hover rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{s.label}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-400 mt-1 truncate capitalize">{s.detail}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
