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
        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const exchangeIcons: Record<string, string> = {
    binance: "B",
    okx: "O",
    bybit: "BY",
    coinbase: "CB",
  };

  return (
    <div className="min-h-screen bg-grid relative">
      {/* Nav */}
      <nav className="sticky top-0 z-20 border-b border-zinc-800/50 bg-[#09090b]/80 backdrop-blur-lg">
        <div className="flex items-center justify-between px-6 py-3.5 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="font-semibold text-sm">CryptoContext</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-600 hidden sm:block">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Connected Exchanges */}
        <section>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Connected Exchanges</h2>
              <p className="text-xs text-zinc-600 mt-0.5">Manage your exchange API connections</p>
            </div>
            <button
              onClick={() => setShowConnect(!showConnect)}
              className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 rounded-lg transition shadow-lg shadow-emerald-900/20 flex items-center gap-2"
            >
              {showConnect ? (
                "Cancel"
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Connect exchange
                </>
              )}
            </button>
          </div>

          {showConnect && (
            <form
              onSubmit={handleConnect}
              className="mt-4 glass rounded-xl p-5 space-y-4"
            >
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Exchange</label>
                <select
                  value={exchange}
                  onChange={(e) => setExchange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900/80 border border-zinc-700/50 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition appearance-none"
                >
                  <option value="binance">Binance</option>
                  <option value="okx">OKX</option>
                  <option value="bybit">Bybit</option>
                  <option value="coinbase">Coinbase</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">
                  API Key <span className="text-zinc-600">(read-only)</span>
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                  placeholder="Your read-only API key"
                  className="w-full px-3.5 py-2.5 bg-zinc-900/80 border border-zinc-700/50 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">API Secret</label>
                <input
                  type="password"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  required
                  placeholder="Your API secret"
                  className="w-full px-3.5 py-2.5 bg-zinc-900/80 border border-zinc-700/50 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition"
                />
              </div>
              {exchange === "okx" && (
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Passphrase</label>
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    required
                    placeholder="OKX API passphrase"
                    className="w-full px-3.5 py-2.5 bg-zinc-900/80 border border-zinc-700/50 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition"
                  />
                </div>
              )}

              <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                <svg className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  <span className="text-zinc-300 font-medium">Security:</span>{" "}
                  Only provide a read-only API key. We verify permissions before accepting. We cannot trade or withdraw your funds.
                </p>
              </div>

              {connectError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <p className="text-sm text-red-400">{connectError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={connecting}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg text-sm font-medium transition shadow-lg shadow-emerald-900/20"
              >
                {connecting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verifying &amp; connecting...
                  </span>
                ) : (
                  "Connect"
                )}
              </button>
            </form>
          )}

          {connections.length === 0 && !showConnect ? (
            <div className="mt-4 glass rounded-xl p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.06a4.5 4.5 0 00-6.364-6.364L4.5 8.25a4.5 4.5 0 006.364 6.364l2.382-2.382" />
                </svg>
              </div>
              <p className="mt-4 text-sm text-zinc-500">
                No exchanges connected yet.
              </p>
              <p className="mt-1 text-xs text-zinc-600">
                Click &quot;Connect exchange&quot; to get started.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {connections.map((c) => (
                <div
                  key={c.id}
                  className="glass rounded-xl p-4 flex items-center justify-between group hover:border-zinc-600 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-sm">
                      {exchangeIcons[c.exchange] ?? c.exchange[0].toUpperCase()}
                    </div>
                    <div>
                      <span className="font-medium capitalize text-sm">{c.exchange}</span>
                      <span className="ml-2 text-xs text-zinc-600">{c.label}</span>
                      <div className="text-xs text-zinc-700 mt-0.5">
                        Connected {new Date(c.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-xs text-emerald-400">Active</span>
                    </div>
                    <button
                      onClick={() => handleDisconnect(c.id)}
                      className="text-xs text-zinc-700 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Portfolio Context */}
        {portfolio && (
          <section>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Portfolio Context</h2>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Total:{" "}
                  <span className="text-zinc-400">
                    ${portfolio.totalUsdValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </span>
                  {" across "}
                  {portfolio.snapshots.length} exchange
                  {portfolio.snapshots.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={fetchPortfolio}
                disabled={syncing}
                className="px-3 py-1.5 text-xs border border-zinc-700/50 hover:border-zinc-500 rounded-lg text-zinc-500 hover:text-zinc-300 disabled:opacity-50 transition flex items-center gap-2"
              >
                {syncing ? (
                  <>
                    <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Syncing...
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                    </svg>
                    Sync now
                  </>
                )}
              </button>
            </div>

            <div className="mt-4 code-block rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800/50">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <span className="ml-2 text-xs text-zinc-600 font-mono">portfolio-context.md</span>
              </div>
              <pre className="p-4 text-sm text-zinc-300 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                {portfolio.context}
              </pre>
            </div>
          </section>
        )}

        {/* MCP Connection */}
        <section>
          <div>
            <h2 className="text-lg font-bold">MCP Connection</h2>
            <p className="text-xs text-zinc-600 mt-0.5">Generate a token to connect your AI tools</p>
          </div>

          {mcpToken ? (
            <div className="mt-4 space-y-3">
              <div className="glass rounded-xl p-4 border-emerald-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                  </svg>
                  <span className="text-xs text-emerald-400 font-medium">Copy this token now — it won&apos;t be shown again</span>
                </div>
                <code className="block text-sm text-zinc-300 bg-zinc-900/50 p-3 rounded-lg break-all font-mono">
                  {mcpToken}
                </code>
              </div>

              <div className="code-block rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800/50">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                  <span className="ml-2 text-xs text-zinc-600 font-mono">terminal</span>
                </div>
                <div className="p-4 font-mono text-sm text-zinc-400 leading-relaxed">
                  <span className="text-emerald-400">$</span>{" "}
                  <span className="text-zinc-300">claude mcp add --transport http crypto-ctx</span>
                  {typeof window !== "undefined"
                    ? ` ${window.location.origin}/api/mcp`
                    : " https://your-app.vercel.app/api/mcp"}{" "}
                  <span className="text-zinc-500">--header</span>{" "}
                  <span className="text-zinc-300">&quot;Authorization: Bearer</span>{" "}
                  <span className="text-emerald-300/80">{mcpToken}</span>
                  <span className="text-zinc-300">&quot;</span>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={handleGenerateToken}
              disabled={generatingToken || connections.length === 0}
              className="mt-4 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg text-sm font-medium transition shadow-lg shadow-emerald-900/20 flex items-center gap-2"
            >
              {generatingToken ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating...
                </>
              ) : connections.length === 0 ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  Connect an exchange first
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                  </svg>
                  Generate MCP token
                </>
              )}
            </button>
          )}

          {/* Existing tokens list */}
          {existingTokens.filter((t) => !t.revoked).length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-zinc-400">Active tokens</h3>
              <div className="mt-2 space-y-2">
                {existingTokens
                  .filter((t) => !t.revoked)
                  .map((token) => (
                    <div
                      key={token.id}
                      className="glass rounded-xl p-3.5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                          <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                          </svg>
                        </div>
                        <div>
                          <span className="text-sm font-medium">{token.name}</span>
                          <span className="ml-2 text-xs text-zinc-600 bg-zinc-800/50 px-2 py-0.5 rounded-full">
                            {token.permission_level}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-zinc-600">
                        Created {new Date(token.created_at).toLocaleDateString()}
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
