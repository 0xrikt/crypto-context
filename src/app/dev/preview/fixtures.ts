/**
 * Fabricated dashboard fixtures for the dev-only preview harness.
 *
 * IMPORTANT: every value here is INVENTED for visual QA. It must never contain
 * a real user's holdings, addresses, or API data. The preview route 404s in
 * production; these fixtures exist solely to iterate on UI locally.
 */
import type { DashboardMock } from "@/components/dashboard/DashboardProvider";

const now = Date.now();
const minutesAgo = (m: number) => new Date(now - m * 60_000).toISOString();
const daysAgo = (d: number) => new Date(now - d * 86_400_000).toISOString();

/** A populated, diversified portfolio — an active multi-venue trader. */
export const populatedMock: DashboardMock = {
  user: { id: "preview-user", email: "preview@cryptocontext.dev" },
  connections: [
    { id: "c1", exchange: "binance", label: "API key", created_at: daysAgo(86) },
    { id: "c2", exchange: "bybit", label: "API key", created_at: daysAgo(41) },
  ],
  wallets: [
    {
      id: "w1",
      address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      chain: "ethereum",
      label: "Main",
      created_at: daysAgo(63),
    },
    {
      id: "w2",
      address: "0x9aF3b1C2D4e5F60718293A4b5C6d7E8f90123456",
      chain: "arbitrum",
      label: "DeFi",
      created_at: daysAgo(22),
    },
  ],
  portfolio: {
    context:
      "Active multi-venue trader. ETH-weighted core with a BTC hedge, rotating into L2 governance tokens. Regular weekly deposits suggest a DCA discipline alongside discretionary swing trades.",
    totalUsdValue: 96_800,
    holdings: [
      { asset: "ETH", amount: 8.6, usdValue: 30_008, allocation: 31, sources: ["binance", "ethereum"] },
      { asset: "BTC", amount: 0.37, usdValue: 25_168, allocation: 26, sources: ["binance", "bybit"] },
      { asset: "SOL", amount: 71.2, usdValue: 13_552, allocation: 14, sources: ["bybit"] },
      { asset: "USDC", amount: 11_616, usdValue: 11_616, allocation: 12, sources: ["binance", "arbitrum"] },
      { asset: "ARB", amount: 9_200, usdValue: 8_712, allocation: 9, sources: ["arbitrum"] },
      { asset: "LINK", amount: 412, usdValue: 7_744, allocation: 8, sources: ["ethereum"] },
    ],
    snapshots: [
      { exchange: "binance", totalUsdValue: 54_300, holdingsCount: 5, fetchedAt: minutesAgo(7) },
      { exchange: "bybit", totalUsdValue: 21_400, holdingsCount: 3, fetchedAt: minutesAgo(7) },
    ],
    walletSnapshots: [
      { address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", chain: "ethereum", totalUsdValue: 14_300, holdingsCount: 3, fetchedAt: minutesAgo(9) },
      { address: "0x9aF3b1C2D4e5F60718293A4b5C6d7E8f90123456", chain: "arbitrum", totalUsdValue: 6_800, holdingsCount: 2, fetchedAt: minutesAgo(9) },
    ],
    errors: [{ source: "okx", error: "Invalid API credentials" }],
  },
  mcpTokens: [
    { id: "t1", name: "Claude Code", permission_level: "full", revoked: false, created_at: daysAgo(30) },
    { id: "t2", name: "Cursor", permission_level: "portfolio_only", revoked: false, created_at: daysAgo(12) },
    { id: "t3", name: "Old Agent", permission_level: "full", revoked: true, created_at: daysAgo(75) },
  ],
  contextDocs: [
    {
      dimension: "trading_profile",
      updatedAt: minutesAgo(9),
      metadata: {
        tradeCount: 247,
        tradesPerWeek: 12.3,
        uniquePairs: 18,
        hasOpenOrders: true,
        dateRange: { from: daysAgo(180).slice(0, 10), to: daysAgo(0).slice(0, 10) },
      },
      content:
        "Trading Profile\n- 247 trades across 18 pairs over the last 180 days\n- ~12 trades/week, concentrated around ETH and majors\n- Holds open limit orders; comfortable with maker-side execution\n- Behaviour: swing trades layered on a long-term core",
    },
    {
      dimension: "fund_flow",
      updatedAt: minutesAgo(9),
      metadata: {
        totalDeposits: 14,
        totalWithdrawals: 6,
        totalTransfers: 20,
        fundingPattern: "regular",
        dateRange: { from: daysAgo(180).slice(0, 10), to: daysAgo(0).slice(0, 10) },
      },
      content:
        "Fund Flow\n- 14 deposits, 6 withdrawals over 180 days\n- Regular cadence consistent with weekly DCA\n- Net inflow; withdrawals align with periodic profit-taking",
    },
  ],
};

/** A brand-new account — drives the first-run onboarding + empty states. */
export const emptyMock: DashboardMock = {
  user: { id: "preview-user", email: "preview@cryptocontext.dev" },
  connections: [],
  wallets: [],
  portfolio: null,
  mcpTokens: [],
  contextDocs: [],
};
