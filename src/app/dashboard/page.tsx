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

interface Wallet {
  id: string;
  address: string;
  chain: string;
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
  walletSnapshots?: Array<{
    address: string;
    chain: string;
    totalUsdValue: number;
    holdingsCount: number;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
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

  // Connect wallet form
  const [showWalletConnect, setShowWalletConnect] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletChain, setWalletChain] = useState("ethereum");
  const [walletLabel, setWalletLabel] = useState("");
  const [walletError, setWalletError] = useState("");
  const [connectingWallet, setConnectingWallet] = useState(false);

  // MCP token
  const [mcpToken, setMcpToken] = useState("");
  const [generatingToken, setGeneratingToken] = useState(false);
  const [tokenName, setTokenName] = useState("Claude Code");
  const [tokenPermission, setTokenPermission] = useState("full");
  const [showTokenForm, setShowTokenForm] = useState(false);
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

      // Fetch wallets
      const { data: ws } = await supabase
        .from("wallets")
        .select("id, address, chain, label, created_at")
        .eq("user_id", u.id);

      setWallets(ws ?? []);

      if ((conns && conns.length > 0) || (ws && ws.length > 0)) {
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
          password: passphraseExchanges.includes(exchange) ? passphrase : undefined,
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

      // Refresh connections list
      const supabase = createClient();
      const { data: conns } = await supabase
        .from("connections")
        .select("id, exchange, label, created_at")
        .eq("user_id", user!.id);
      setConnections(conns ?? []);

      // Auto-fetch portfolio (deferred from connect to avoid timeout)
      fetchPortfolio();
    } catch {
      setConnectError("Something went wrong");
    } finally {
      setConnecting(false);
    }
  }

  async function handleWalletConnect(e: React.FormEvent) {
    e.preventDefault();
    setWalletError("");
    setConnectingWallet(true);

    try {
      const res = await fetch("/api/wallet/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: walletAddress,
          chain: walletChain,
          label: walletLabel,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setWalletError(data.error ?? "Failed to add wallet");
        return;
      }

      setWalletAddress("");
      setWalletLabel("");
      setShowWalletConnect(false);

      const supabase = createClient();
      const { data: ws } = await supabase
        .from("wallets")
        .select("id, address, chain, label, created_at")
        .eq("user_id", user!.id);
      setWallets(ws ?? []);

      fetchPortfolio();
    } catch {
      setWalletError("Something went wrong");
    } finally {
      setConnectingWallet(false);
    }
  }

  async function handleWalletDisconnect(walletId: string) {
    if (!confirm("Remove this wallet?")) return;
    try {
      const res = await fetch("/api/wallet/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletId }),
      });
      if (res.ok) {
        setWallets((prev) => prev.filter((w) => w.id !== walletId));
        if (wallets.length <= 1 && connections.length === 0) {
          setPortfolio(null);
        }
      }
    } catch {
      // silently fail
    }
  }

  async function handleGenerateToken() {
    setGeneratingToken(true);
    try {
      const res = await fetch("/api/mcp/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tokenName, permissionLevel: tokenPermission }),
      });
      const data = await res.json();
      if (res.ok) {
        setMcpToken(data.token);
        setShowTokenForm(false);
        const tokensRes = await fetch("/api/mcp/tokens");
        if (tokensRes.ok) {
          const tokensData = await tokensRes.json();
          setExistingTokens(tokensData.tokens ?? []);
        }
      }
    } finally {
      setGeneratingToken(false);
    }
  }

  async function handleRevokeToken(tokenId: string) {
    try {
      const res = await fetch("/api/mcp/tokens", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tokenId }),
      });
      if (res.ok) {
        setExistingTokens((prev) =>
          prev.map((t) => (t.id === tokenId ? { ...t, revoked: true } : t))
        );
      }
    } catch {
      // non-critical
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
    binance: "BN",
    okx: "OK",
    bybit: "BY",
    coinbase: "CB",
    kraken: "KR",
    bitget: "BG",
    kucoin: "KC",
    gateio: "GT",
    htx: "HT",
    mexc: "MX",
  };

  const passphraseExchanges = ["okx", "bitget", "kucoin"];

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
        {/* Connected Exchanges */}
        <section>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Connected Exchanges</h2>
              <p className="text-xs text-gray-400 mt-0.5">Manage your exchange API connections</p>
            </div>
            <button
              onClick={() => setShowConnect(!showConnect)}
              className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition shadow-lg shadow-emerald-200/50 flex items-center gap-2"
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
                <label className="block text-sm text-gray-500 mb-1.5">Exchange</label>
                <select
                  value={exchange}
                  onChange={(e) => setExchange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition appearance-none"
                >
                  <option value="binance">Binance</option>
                  <option value="okx">OKX</option>
                  <option value="bybit">Bybit</option>
                  <option value="coinbase">Coinbase</option>
                  <option value="kraken">Kraken</option>
                  <option value="bitget">Bitget</option>
                  <option value="kucoin">KuCoin</option>
                  <option value="gateio">Gate.io</option>
                  <option value="htx">HTX</option>
                  <option value="mexc">MEXC</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">
                  API Key <span className="text-gray-300">(read-only)</span>
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                  autoComplete="off"
                  placeholder="Your read-only API key"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">API Secret</label>
                <input
                  type="password"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Your API secret"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition"
                />
              </div>
              {passphraseExchanges.includes(exchange) && (
                <div>
                  <label className="block text-sm text-gray-500 mb-1.5">Passphrase</label>
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    required
                    placeholder={`${exchange.toUpperCase()} API passphrase`}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition"
                  />
                </div>
              )}

              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                <svg className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                <p className="text-xs text-gray-500 leading-relaxed">
                  <span className="text-gray-700 font-medium">Security:</span>{" "}
                  Only provide a read-only API key. We verify permissions before accepting. We cannot trade or withdraw your funds.
                </p>
              </div>

              {connectError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <p className="text-sm text-red-600">{connectError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={connecting}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-emerald-200/50"
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
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.06a4.5 4.5 0 00-6.364-6.364L4.5 8.25a4.5 4.5 0 006.364 6.364l2.382-2.382" />
                </svg>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                No exchanges connected yet.
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Click &quot;Connect exchange&quot; to get started.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {connections.map((c) => (
                <div
                  key={c.id}
                  className="glass rounded-xl p-4 flex items-center justify-between group hover:border-gray-300 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-sm">
                      {exchangeIcons[c.exchange] ?? c.exchange[0].toUpperCase()}
                    </div>
                    <div>
                      <span className="font-medium capitalize text-sm text-gray-900">{c.exchange}</span>
                      <span className="ml-2 text-xs text-gray-400">{c.label}</span>
                      <div className="text-xs text-gray-300 mt-0.5">
                        Connected {new Date(c.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-xs text-emerald-600">Active</span>
                    </div>
                    <button
                      onClick={() => handleDisconnect(c.id)}
                      className="text-xs text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Wallets */}
        <section>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Wallets</h2>
              <p className="text-xs text-gray-400 mt-0.5">Track on-chain wallet balances (EVM)</p>
            </div>
            <button
              onClick={() => setShowWalletConnect(!showWalletConnect)}
              className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition shadow-lg shadow-emerald-200/50 flex items-center gap-2"
            >
              {showWalletConnect ? (
                "Cancel"
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add wallet
                </>
              )}
            </button>
          </div>

          {showWalletConnect && (
            <form
              onSubmit={handleWalletConnect}
              className="mt-4 glass rounded-xl p-5 space-y-4"
            >
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">Wallet address</label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  required
                  placeholder="0x..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition font-mono"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">Chain</label>
                <select
                  value={walletChain}
                  onChange={(e) => setWalletChain(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition appearance-none"
                >
                  <option value="ethereum">Ethereum</option>
                  <option value="bsc">BSC (BNB Chain)</option>
                  <option value="polygon">Polygon</option>
                  <option value="arbitrum">Arbitrum</option>
                  <option value="base">Base</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">
                  Label <span className="text-gray-300">(optional)</span>
                </label>
                <input
                  type="text"
                  value={walletLabel}
                  onChange={(e) => setWalletLabel(e.target.value)}
                  placeholder="e.g. Main wallet, DeFi wallet"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition"
                />
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                <svg className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-xs text-gray-500 leading-relaxed">
                  <span className="text-gray-700 font-medium">Read-only:</span>{" "}
                  We only read public on-chain balances. No private keys or signing required.
                </p>
              </div>

              {walletError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <p className="text-sm text-red-600">{walletError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={connectingWallet}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-emerald-200/50"
              >
                {connectingWallet ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Adding...
                  </span>
                ) : (
                  "Add wallet"
                )}
              </button>
            </form>
          )}

          {wallets.length === 0 && !showWalletConnect ? (
            <div className="mt-4 glass rounded-xl p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                </svg>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                No wallets tracked yet.
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Click &quot;Add wallet&quot; to track on-chain balances.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {wallets.map((w) => (
                <div
                  key={w.id}
                  className="glass rounded-xl p-4 flex items-center justify-between group hover:border-gray-300 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs">
                      {w.chain.slice(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-medium text-sm text-gray-900 font-mono">
                        {w.address.slice(0, 6)}...{w.address.slice(-4)}
                      </span>
                      <span className="ml-2 text-xs text-gray-400 capitalize">{w.chain}</span>
                      {w.label && <span className="ml-2 text-xs text-gray-400">{w.label}</span>}
                      <div className="text-xs text-gray-300 mt-0.5">
                        Added {new Date(w.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-xs text-emerald-600">Active</span>
                    </div>
                    <button
                      onClick={() => handleWalletDisconnect(w.id)}
                      className="text-xs text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                    >
                      Remove
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
                <h2 className="text-lg font-bold text-gray-900">Portfolio Context</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Total:{" "}
                  <span className="text-gray-600">
                    ${portfolio.totalUsdValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </span>
                  {" across "}
                  {portfolio.snapshots.length > 0 && (
                    <>{portfolio.snapshots.length} exchange{portfolio.snapshots.length !== 1 ? "s" : ""}</>
                  )}
                  {portfolio.snapshots.length > 0 && (portfolio.walletSnapshots?.length ?? 0) > 0 && " + "}
                  {(portfolio.walletSnapshots?.length ?? 0) > 0 && (
                    <>{portfolio.walletSnapshots!.length} wallet{portfolio.walletSnapshots!.length !== 1 ? "s" : ""}</>
                  )}
                </p>
              </div>
              <button
                onClick={fetchPortfolio}
                disabled={syncing}
                className="px-3 py-1.5 text-xs border border-gray-200 hover:border-gray-400 rounded-lg text-gray-400 hover:text-gray-700 disabled:opacity-50 transition flex items-center gap-2"
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
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                <span className="ml-2 text-xs text-gray-400 font-mono">portfolio-context.md</span>
              </div>
              <pre className="p-4 text-sm text-gray-700 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                {portfolio.context}
              </pre>
            </div>
          </section>
        )}

        {/* MCP Connection */}
        <section>
          <div>
            <h2 className="text-lg font-bold text-gray-900">MCP Connection</h2>
            <p className="text-xs text-gray-400 mt-0.5">Generate a token to connect your AI tools</p>
          </div>

          {mcpToken ? (
            <div className="mt-4 space-y-3">
              <div className="glass rounded-xl p-4 border-emerald-300">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                  </svg>
                  <span className="text-xs text-emerald-700 font-medium">Copy this token now — it won&apos;t be shown again</span>
                </div>
                <code className="block text-sm text-gray-700 bg-gray-50 p-3 rounded-lg break-all font-mono">
                  {mcpToken}
                </code>
              </div>

              <div className="code-block rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                  <span className="ml-2 text-xs text-gray-400 font-mono">terminal</span>
                </div>
                <div className="p-4 font-mono text-sm text-gray-500 leading-relaxed">
                  <span className="text-emerald-600">$</span>{" "}
                  <span className="text-gray-700">claude mcp add --transport http crypto-ctx</span>
                  {typeof window !== "undefined"
                    ? ` ${window.location.origin}/api/mcp`
                    : " https://your-app.vercel.app/api/mcp"}{" "}
                  <span className="text-gray-400">--header</span>{" "}
                  <span className="text-gray-700">&quot;Authorization: Bearer</span>{" "}
                  <span className="text-emerald-600">{mcpToken}</span>
                  <span className="text-gray-700">&quot;</span>
                </div>
              </div>

              <button
                onClick={() => setMcpToken("")}
                className="text-xs text-gray-400 hover:text-gray-700 transition"
              >
                Done
              </button>
            </div>
          ) : showTokenForm ? (
            <div className="mt-4 glass rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">Token name</label>
                <input
                  type="text"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder="e.g. Claude Code, Cursor, My Agent"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">Permission level</label>
                <select
                  value={tokenPermission}
                  onChange={(e) => setTokenPermission(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition appearance-none"
                >
                  <option value="full">Full — all portfolio data with USD values</option>
                  <option value="portfolio_only">Portfolio only — holdings without context</option>
                  <option value="anonymized">Anonymized — hide USD values</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleGenerateToken}
                  disabled={generatingToken || !tokenName.trim()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-emerald-200/50 flex items-center gap-2"
                >
                  {generatingToken ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    "Generate"
                  )}
                </button>
                <button
                  onClick={() => setShowTokenForm(false)}
                  className="text-xs text-gray-400 hover:text-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => (connections.length > 0 || wallets.length > 0) && setShowTokenForm(true)}
              disabled={connections.length === 0 && wallets.length === 0}
              className="mt-4 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-emerald-200/50 flex items-center gap-2"
            >
              {connections.length === 0 && wallets.length === 0 ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  Connect an exchange or wallet first
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  New MCP token
                </>
              )}
            </button>
          )}

          {/* Existing tokens list */}
          {existingTokens.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500">Tokens</h3>
              <div className="mt-2 space-y-2">
                {existingTokens.map((token) => (
                  <div
                    key={token.id}
                    className={`glass rounded-xl p-3.5 flex items-center justify-between group ${token.revoked ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                        </svg>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-900">{token.name}</span>
                        <span className="ml-2 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {token.permission_level}
                        </span>
                        {token.revoked && (
                          <span className="ml-2 text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                            revoked
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        {new Date(token.created_at).toLocaleDateString()}
                      </span>
                      {!token.revoked && (
                        <button
                          onClick={() => handleRevokeToken(token.id)}
                          className="text-xs text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
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
