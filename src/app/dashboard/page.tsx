"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  PortfolioSummary,
  AllocationChart,
  HoldingsTable,
  DataSources,
  McpSection,
  ContextInsights,
} from "@/components/dashboard";
import type { PortfolioData, Connection, Wallet, McpToken } from "@/components/dashboard";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [contextSyncing, setContextSyncing] = useState(false);
  const [mcpTokens, setMcpTokens] = useState<McpToken[]>([]);
  const [contextDocs, setContextDocs] = useState<
    Array<{ dimension: string; content: string; metadata: Record<string, unknown>; updatedAt: string }>
  >([]);

  const fetchPortfolio = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/exchange/portfolio");
      if (res.ok) {
        const data = await res.json();
        setPortfolio(data);
      }
    } finally {
      setSyncing(false);
    }
  }, []);

  const fetchContextDocs = useCallback(async () => {
    try {
      const res = await fetch("/api/context");
      if (res.ok) {
        const data = await res.json();
        setContextDocs(data.documents ?? []);
      }
    } catch { /* non-critical */ }
  }, []);

  const syncContext = useCallback(async (connectionId: string) => {
    setContextSyncing(true);
    try {
      const res = await fetch("/api/exchange/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId }),
      });
      if (!res.ok) {
        console.error("[sync] Context sync failed:", res.status);
      } else {
        fetchContextDocs();
      }
    } catch {
      console.error("[sync] Context sync network error");
    } finally {
      setContextSyncing(false);
    }
  }, [fetchContextDocs]);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const {
        data: { user: u },
      } = await supabase.auth.getUser();

      if (!u) {
        router.push("/login");
        return;
      }

      setUser({ id: u.id, email: u.email ?? "" });

      const [{ data: conns }, { data: ws }] = await Promise.all([
        supabase
          .from("connections")
          .select("id, exchange, label, created_at")
          .eq("user_id", u.id),
        supabase
          .from("wallets")
          .select("id, address, chain, label, created_at")
          .eq("user_id", u.id),
      ]);

      setConnections(conns ?? []);
      setWallets(ws ?? []);

      fetch("/api/mcp/tokens")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d && setMcpTokens(d.tokens ?? []))
        .catch(() => {});

      setLoading(false);

      if ((conns && conns.length > 0) || (ws && ws.length > 0)) {
        fetchPortfolio();
        fetchContextDocs();
      }
    }
    init();
  }, [router, fetchPortfolio, fetchContextDocs]);

  const handleSync = useCallback(() => {
    fetchPortfolio();
    for (const conn of connections) {
      syncContext(conn.id);
    }
  }, [connections, fetchPortfolio, syncContext]);

  async function handleConnectExchange(data: {
    exchange: string;
    apiKey: string;
    secret: string;
    password?: string;
  }) {
    const res = await fetch("/api/exchange/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();

    if (!res.ok) throw new Error(result.error ?? "Connection failed");

    const supabase = createClient();
    const { data: conns } = await supabase
      .from("connections")
      .select("id, exchange, label, created_at")
      .eq("user_id", user!.id);
    setConnections(conns ?? []);

    fetchPortfolio();
    if (result.connectionId) syncContext(result.connectionId);
  }

  async function handleDisconnectExchange(connectionId: string) {
    if (!confirm("Disconnect this exchange? This will delete the stored API key.")) return;
    try {
      const res = await fetch("/api/exchange/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId }),
      });
      if (res.ok) {
        const remaining = connections.filter((c) => c.id !== connectionId);
        setConnections(remaining);
        if (remaining.length === 0 && wallets.length === 0) setPortfolio(null);
      }
    } catch { /* non-critical */ }
  }

  async function handleConnectWallet(data: { address: string; chain: string; label: string }) {
    const res = await fetch("/api/wallet/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();

    if (!res.ok) throw new Error(result.error ?? "Failed to add wallet");

    const supabase = createClient();
    const { data: ws } = await supabase
      .from("wallets")
      .select("id, address, chain, label, created_at")
      .eq("user_id", user!.id);
    setWallets(ws ?? []);

    fetchPortfolio();
  }

  async function handleDisconnectWallet(walletId: string) {
    if (!confirm("Remove this wallet?")) return;
    try {
      const res = await fetch("/api/wallet/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletId }),
      });
      if (res.ok) {
        const remaining = wallets.filter((w) => w.id !== walletId);
        setWallets(remaining);
        if (remaining.length === 0 && connections.length === 0) setPortfolio(null);
      }
    } catch { /* non-critical */ }
  }

  async function handleGenerateToken(name: string, permission: string): Promise<string | null> {
    const res = await fetch("/api/mcp/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, permissionLevel: permission }),
    });
    const data = await res.json();
    if (!res.ok) return null;

    const tokensRes = await fetch("/api/mcp/tokens");
    if (tokensRes.ok) {
      const tokensData = await tokensRes.json();
      setMcpTokens(tokensData.tokens ?? []);
    }
    return data.token ?? null;
  }

  async function handleRevokeToken(tokenId: string) {
    try {
      const res = await fetch("/api/mcp/tokens", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tokenId }),
      });
      if (res.ok) {
        setMcpTokens((prev) =>
          prev.map((t) => (t.id === tokenId ? { ...t, revoked: true } : t))
        );
      }
    } catch { /* non-critical */ }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasAnySources = connections.length > 0 || wallets.length > 0;

  return (
    <div className="min-h-screen bg-grid relative">
      {/* Nav */}
      <nav className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur-lg">
        <div className="flex items-center justify-between px-6 py-3.5 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="font-semibold text-sm text-gray-900">CryptoContext</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400 hidden sm:block">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-gray-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Portfolio overview — stat cards, chart, holdings */}
        {portfolio && portfolio.holdings.length > 0 ? (
          <>
            <PortfolioSummary
              portfolio={portfolio}
              syncing={syncing}
              contextSyncing={contextSyncing}
              onSync={handleSync}
            />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <AllocationChart
                  holdings={portfolio.holdings}
                  totalValue={portfolio.totalUsdValue}
                />
              </div>
              <div className="lg:col-span-3">
                <HoldingsTable holdings={portfolio.holdings} />
              </div>
            </div>
          </>
        ) : hasAnySources ? (
          <div className="glass rounded-xl p-8 text-center">
            {syncing ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Loading portfolio...</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500">Portfolio data not yet available.</p>
                <button
                  onClick={handleSync}
                  className="mt-3 px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
                >
                  Sync now
                </button>
              </>
            )}
          </div>
        ) : null}

        {/* Context insights — trading profile + fund flow */}
        {(contextDocs.length > 0 || hasAnySources) && (
          <ContextInsights documents={contextDocs} />
        )}

        {/* Data sources */}
        <DataSources
          connections={connections}
          wallets={wallets}
          onConnectExchange={handleConnectExchange}
          onDisconnectExchange={handleDisconnectExchange}
          onConnectWallet={handleConnectWallet}
          onDisconnectWallet={handleDisconnectWallet}
        />

        {/* MCP tokens */}
        <McpSection
          tokens={mcpTokens}
          hasConnections={hasAnySources}
          onGenerateToken={handleGenerateToken}
          onRevokeToken={handleRevokeToken}
        />
      </main>
    </div>
  );
}
