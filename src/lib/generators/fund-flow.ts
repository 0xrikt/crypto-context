import type { TransferRecord } from "../exchange-history";

interface CurrencyFlow {
  currency: string;
  depositCount: number;
  depositVolume: number;
  withdrawalCount: number;
  withdrawalVolume: number;
  netFlow: number;
}

interface FlowAnalysis {
  totalDeposits: number;
  totalWithdrawals: number;
  totalDepositVolume: number;
  totalWithdrawalVolume: number;
  netFlow: number;
  currencyFlows: CurrencyFlow[];
  dateRange: { from: string; to: string } | null;
  avgDepositSize: number;
  fundingPattern: "regular" | "lump_sum" | "mixed" | "inactive";
  lastDepositDate: string | null;
  lastWithdrawalDate: string | null;
  recentTransfers: TransferRecord[];
}

function formatUsd(value: number): string {
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value.toFixed(0)}`;
}

function formatDate(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

function detectFundingPattern(
  deposits: TransferRecord[],
): "regular" | "lump_sum" | "mixed" | "inactive" {
  if (deposits.length === 0) return "inactive";
  if (deposits.length === 1) return "lump_sum";

  const sorted = [...deposits].sort((a, b) => a.timestamp - b.timestamp);
  const intervals = sorted.slice(1).map((d, i) => d.timestamp - sorted[i].timestamp);

  const DAY_MS = 24 * 60 * 60 * 1000;
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length / DAY_MS;

  const amounts = deposits.map((d) => d.amount);
  const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const amountVariance = amounts.reduce((sum, a) => sum + (a - avgAmount) ** 2, 0) / amounts.length;
  const cv = Math.sqrt(amountVariance) / avgAmount;

  if (intervals.length >= 2) {
    const intervalCv = (() => {
      const avgI = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum, i) => sum + (i - avgI) ** 2, 0) / intervals.length;
      return Math.sqrt(variance) / avgI;
    })();

    if (intervalCv < 0.4 && avgInterval < 60) return "regular";
  }

  if (cv > 1.5 || deposits.length <= 2) return "lump_sum";
  return "mixed";
}

function analyze(transfers: TransferRecord[]): FlowAnalysis {
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const deposits = transfers.filter((t) => t.type === "deposit");
  const withdrawals = transfers.filter((t) => t.type === "withdrawal");
  const recentTransfers = transfers.filter((t) => t.timestamp > now - THIRTY_DAYS);

  if (transfers.length === 0) {
    return {
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalDepositVolume: 0,
      totalWithdrawalVolume: 0,
      netFlow: 0,
      currencyFlows: [],
      dateRange: null,
      avgDepositSize: 0,
      fundingPattern: "inactive",
      lastDepositDate: null,
      lastWithdrawalDate: null,
      recentTransfers: [],
    };
  }

  const timestamps = transfers.map((t) => t.timestamp);
  const first = Math.min(...timestamps);
  const last = Math.max(...timestamps);

  const flowMap = new Map<string, CurrencyFlow>();
  let totalDepositVolume = 0;
  let totalWithdrawalVolume = 0;

  for (const t of transfers) {
    const flow = flowMap.get(t.currency) ?? {
      currency: t.currency,
      depositCount: 0,
      depositVolume: 0,
      withdrawalCount: 0,
      withdrawalVolume: 0,
      netFlow: 0,
    };

    if (t.type === "deposit") {
      flow.depositCount++;
      flow.depositVolume += t.amount;
      totalDepositVolume += t.amount;
    } else {
      flow.withdrawalCount++;
      flow.withdrawalVolume += t.amount;
      totalWithdrawalVolume += t.amount;
    }
    flow.netFlow = flow.depositVolume - flow.withdrawalVolume;

    flowMap.set(t.currency, flow);
  }

  const currencyFlows = Array.from(flowMap.values()).sort(
    (a, b) => (b.depositVolume + b.withdrawalVolume) - (a.depositVolume + a.withdrawalVolume),
  );

  const lastDeposit = deposits.length > 0
    ? Math.max(...deposits.map((d) => d.timestamp))
    : null;
  const lastWithdrawal = withdrawals.length > 0
    ? Math.max(...withdrawals.map((w) => w.timestamp))
    : null;

  return {
    totalDeposits: deposits.length,
    totalWithdrawals: withdrawals.length,
    totalDepositVolume,
    totalWithdrawalVolume,
    netFlow: totalDepositVolume - totalWithdrawalVolume,
    currencyFlows,
    dateRange: { from: formatDate(first), to: formatDate(last) },
    avgDepositSize: deposits.length > 0
      ? totalDepositVolume / deposits.length
      : 0,
    fundingPattern: detectFundingPattern(deposits),
    lastDepositDate: lastDeposit ? formatDate(lastDeposit) : null,
    lastWithdrawalDate: lastWithdrawal ? formatDate(lastWithdrawal) : null,
    recentTransfers,
  };
}

export function generateFundFlow(
  transfers: TransferRecord[],
  exchangeName: string,
): { markdown: string; metadata: Record<string, unknown> } {
  const a = analyze(transfers);
  const lines: string[] = [];

  lines.push(`# Fund Flow — ${exchangeName}`);

  if (a.totalDeposits === 0 && a.totalWithdrawals === 0) {
    lines.push("> No deposit or withdrawal activity found in the last 90 days.");
    return {
      markdown: lines.join("\n"),
      metadata: { totalTransfers: 0 },
    };
  }

  const total = a.totalDeposits + a.totalWithdrawals;
  lines.push(`> Based on ${total} transfers (${a.dateRange?.from} to ${a.dateRange?.to})`);
  lines.push("");

  // Overview
  lines.push("## Overview");
  lines.push(`- Deposits: ${a.totalDeposits} (total ${a.totalDepositVolume.toLocaleString("en-US", { maximumFractionDigits: 2 })} across currencies)`);
  lines.push(`- Withdrawals: ${a.totalWithdrawals} (total ${a.totalWithdrawalVolume.toLocaleString("en-US", { maximumFractionDigits: 2 })} across currencies)`);

  const direction = a.netFlow > 0 ? "net inflow" : a.netFlow < 0 ? "net outflow" : "balanced";
  lines.push(`- Direction: ${direction}`);

  if (a.avgDepositSize > 0) {
    lines.push(`- Avg deposit size: ${a.avgDepositSize.toLocaleString("en-US", { maximumFractionDigits: 2 })}`);
  }
  lines.push("");

  // Flow by Currency
  if (a.currencyFlows.length > 0) {
    lines.push("## Flow by Currency");
    lines.push("| Currency | Deposits | Withdrawals | Net |");
    lines.push("|----------|----------|-------------|-----|");
    for (const f of a.currencyFlows) {
      const depStr = f.depositCount > 0
        ? `${f.depositCount}x (${f.depositVolume.toLocaleString("en-US", { maximumFractionDigits: 2 })})`
        : "—";
      const wdStr = f.withdrawalCount > 0
        ? `${f.withdrawalCount}x (${f.withdrawalVolume.toLocaleString("en-US", { maximumFractionDigits: 2 })})`
        : "—";
      const netStr = f.netFlow > 0
        ? `+${f.netFlow.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
        : f.netFlow.toLocaleString("en-US", { maximumFractionDigits: 2 });
      lines.push(`| ${f.currency} | ${depStr} | ${wdStr} | ${netStr} |`);
    }
    lines.push("");
  }

  // Funding Pattern
  lines.push("## Funding Pattern");
  const patternLabels: Record<string, string> = {
    regular: "Regular (recurring deposits at consistent intervals)",
    lump_sum: "Lump sum (infrequent, large deposits)",
    mixed: "Mixed (irregular deposit pattern)",
    inactive: "Inactive (no recent deposits)",
  };
  lines.push(`- Pattern: ${patternLabels[a.fundingPattern]}`);
  if (a.lastDepositDate) lines.push(`- Last deposit: ${a.lastDepositDate}`);
  if (a.lastWithdrawalDate) lines.push(`- Last withdrawal: ${a.lastWithdrawalDate}`);
  lines.push("");

  // Recent Activity
  if (a.recentTransfers.length > 0) {
    lines.push("## Recent Activity (Last 30 Days)");
    const recentDeps = a.recentTransfers.filter((t) => t.type === "deposit");
    const recentWds = a.recentTransfers.filter((t) => t.type === "withdrawal");
    lines.push(`- ${recentDeps.length} deposits, ${recentWds.length} withdrawals`);

    for (const t of a.recentTransfers.slice(-5)) {
      const arrow = t.type === "deposit" ? "IN" : "OUT";
      lines.push(
        `- [${arrow}] ${formatDate(t.timestamp)}: ${t.amount.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${t.currency}`,
      );
    }
    lines.push("");
  }

  return {
    markdown: lines.join("\n"),
    metadata: {
      totalTransfers: total,
      totalDeposits: a.totalDeposits,
      totalWithdrawals: a.totalWithdrawals,
      fundingPattern: a.fundingPattern,
      dateRange: a.dateRange,
    },
  };
}
