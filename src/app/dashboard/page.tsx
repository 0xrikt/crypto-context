"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Connection {
  id: string;
  exchange: string;
  label: string;
  created_at: string;
}

interface PortfolioData {
  context: string;
  totalUsdValue: number;
  snapshots: Array<{
    exchange: string;
    totalUsdValue: number;
    holdingsCount: number;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Connect exchange form
  const [showConnect, setShowConnect] = useState(false);
  const [exchange, setExchange] = useState("binance");
  const [apiKey, setApiKey] = useState("");
  const [secret, setSecret] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [connectError, setConnectError] = useState("");
  const [connecting, setConnecting] = useState(false);

  // MCP token
  const [mcpToken, setMcpToken] = useState("");
  const [generatingToken, setGeneratingToken] = useState(false);
  const [existingTokens, setExistingTokens] = useState<
    Array<{
      id: string;
      name: string;
      permission_level: string;
      revoked: boolean;
      created_at: string;
    }>
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

      // Fetch connections
      const { data: conns } = await supabase
        .from("connections")
        .select("id, exchange, label, created_at")
        .eq("user_id", u.id);

      setConnections(conns ?? []);

      if (conns && conns.length > 0) {
        await fetchPortfolio();
      }

      // Fetch existing MCP tokens
      try {
        const tokensRes = await fetch("/api/mcp/tokens");
        if (tokensRes.ok) {
          const tokensData = await tokensRes.json();
          setExistingTokens(tokensData.tokens ?? []);
        }
      } catch {
        // non-critical
      }

      setLoading(false);
    }
    init();
  }, [router, fetchPortfolio]);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setConnectError("");
    setConnecting(true);

    try {
      const res = await fetch("/api/exchange/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exchange,
          apiKey,
          secret,
          password: exchange === "okx" ? passphrase : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setConnectError(data.error ?? "Connection failed");
        return;
      }

      // Reset form
      setApiKey("");
      setSecret("");
      setPassphrase("");
      setShowConnect(false);

      // Refresh
      const supabase = createClient();
      const { data: conns } = await supabase
        .from("connections")
        .select("id, exchange, label, created_at")
        .eq("user_id", user!.id);
      setConnections(conns ?? []);

      await fetchPortfolio();
    } catch {
      setConnectError("Something went wrong");
    } finally {
      setConnecting(false);
    }
  }

  async function handleGenerateToken() {
    setGeneratingToken(true);
    try {
      const res = await fetch("/api/mcp/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Claude Code", permissionLevel: "full" }),
      });
      const data = await res.json();
      if (res.ok) {
        setMcpToken(data.token);
      }
    } finally {
      setGeneratingToken(false);
    }
  }

  async function handleDisconnect(connectionId: string) {
    if (!confirm("Disconnect this exchange? This will delete the stored API key.")) {
      return;
    }
    try {
      const res = await fetch("/api/exchange/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId }),
      });
      if (res.ok) {
        setConnections((prev) => prev.filter((c) => c.id !== connectionId));
        if (connections.length <= 1) {
          setPortfolio(null);
        }
      }
    } catch {
      // silently fail
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto border-b border-zinc-800">
        <span className="text-lg font-semibold">CryptoContext</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-500">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-zinc-400 hover:text-zinc-200"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Connections */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Connected Exchanges</h2>
            <button
              onClick={() => setShowConnect(!showConnect)}
              className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 rounded-lg transition"
            >
              {showConnect ? "Cancel" : "+ Connect exchange"}
            </button>
          </div>

          {showConnect && (
            <form
              onSubmit={handleConnect}
              className="mt-4 p-4 bg-zinc-900 border border-zinc-800 rounded-lg space-y-3"
            >
              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  Exchange
                </label>
                <select
                  value={exchange}
                  onChange={(e) => setExchange(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
                >
                  <option value="binance">Binance</option>
                  <option value="okx">OKX</option>
                  <option value="bybit">Bybit</option>
                  <option value="coinbase">Coinbase</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  API Key (read-only)
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                  placeholder="Your read-only API key"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  API Secret
                </label>
                <input
                  type="password"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  required
                  placeholder="Your API secret"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>
              {exchange === "okx" && (
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">
                    Passphrase
                  </label>
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    required
                    placeholder="OKX API passphrase"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-emerald-600"
                  />
                </div>
              )}

              <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded text-xs text-zinc-400">
                <strong className="text-zinc-300">Security note:</strong> Only
                provide a read-only API key. We verify permissions before
                accepting. We cannot trade or withdraw your funds.
              </div>

              {connectError && (
                <p className="text-sm text-red-400">{connectError}</p>
              )}

              <button
                type="submit"
                disabled={connecting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg text-sm transition"
              >
                {connecting ? "Verifying & connecting..." : "Connect"}
              </button>
            </form>
          )}

          {connections.length === 0 && !showConnect ? (
            <p className="mt-4 text-sm text-zinc-500">
              No exchanges connected. Click &quot;+ Connect exchange&quot; to get
              started.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {connections.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg"
                >
                  <div>
                    <span className="font-medium capitalize">{c.exchange}</span>
                    <span className="ml-2 text-sm text-zinc-500">
                      {c.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-600">
                      Connected{" "}
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleDisconnect(c.id)}
                      className="text-xs text-zinc-600 hover:text-red-400 transition"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Portfolio */}
        {portfolio && (
          <section className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Portfolio Context</h2>
              <button
                onClick={fetchPortfolio}
                disabled={syncing}
                className="px-3 py-1 text-sm border border-zinc-700 hover:border-zinc-500 rounded-lg text-zinc-400 hover:text-zinc-200 disabled:opacity-50 transition"
              >
                {syncing ? "Syncing..." : "Sync now"}
              </button>
            </div>

            <div className="mt-2 text-sm text-zinc-500">
              Total: ${portfolio.totalUsdValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              {" across "}
              {portfolio.snapshots.length} exchange
              {portfolio.snapshots.length !== 1 ? "s" : ""}
            </div>

            <pre className="mt-4 p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 overflow-x-auto whitespace-pre-wrap font-mono">
              {portfolio.context}
            </pre>
          </section>
        )}

        {/* MCP Token */}
        <section className="mt-10">
          <h2 className="text-xl font-bold">MCP Connection</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Generate a token to connect your AI tools.
          </p>

          {mcpToken ? (
            <div className="mt-4 space-y-3">
              <div className="p-3 bg-zinc-900 border border-emerald-800 rounded-lg">
                <p className="text-xs text-emerald-400 mb-2">
                  Copy this token now — it won&apos;t be shown again.
                </p>
                <code className="text-sm text-zinc-300 break-all">
                  {mcpToken}
                </code>
              </div>
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg font-mono text-sm text-zinc-400">
                <p className="text-xs text-zinc-500 mb-2">
                  Run this in your terminal:
                </p>
                claude mcp add --transport http crypto-ctx
                {typeof window !== "undefined"
                  ? ` ${window.location.origin}/api/mcp`
                  : " https://your-app.vercel.app/api/mcp"}{" "}
                --header &quot;Authorization: Bearer {mcpToken}&quot;
              </div>
            </div>
          ) : (
            <button
              onClick={handleGenerateToken}
              disabled={generatingToken || connections.length === 0}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg text-sm transition"
            >
              {generatingToken
                ? "Generating..."
                : connections.length === 0
                  ? "Connect an exchange first"
                  : "Generate MCP token"}
            </button>
          )}

          {/* Existing tokens list */}
          {existingTokens.filter((t) => !t.revoked).length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-zinc-400">
                Active tokens
              </h3>
              <div className="mt-2 space-y-2">
                {existingTokens
                  .filter((t) => !t.revoked)
                  .map((token) => (
                    <div
                      key={token.id}
                      className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg"
                    >
                      <div>
                        <span className="text-sm font-medium">
                          {token.name}
                        </span>
                        <span className="ml-2 text-xs text-zinc-600">
                          {token.permission_level}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-600">
                        Created{" "}
                        {new Date(token.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
