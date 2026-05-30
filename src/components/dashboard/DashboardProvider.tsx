"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast, useConfirm } from "@/components/ui";
import { DashboardLoader } from "./DashboardLoader";
import type {
  Connection,
  Wallet,
  PortfolioData,
  McpToken,
  ContextDoc,
  InvestorProfile,
} from "./types";

export interface DashboardMock {
  user: { id: string; email: string };
  connections: Connection[];
  wallets: Wallet[];
  portfolio: PortfolioData | null;
  mcpTokens: McpToken[];
  contextDocs: ContextDoc[];
  investorProfile?: InvestorProfile | null;
}

interface ExchangeInput {
  exchange: string;
  apiKey: string;
  secret: string;
  password?: string;
}

interface WalletInput {
  address: string;
  chain: string;
  label: string;
}

interface DashboardContextValue {
  user: { id: string; email: string } | null;
  connections: Connection[];
  wallets: Wallet[];
  portfolio: PortfolioData | null;
  mcpTokens: McpToken[];
  contextDocs: ContextDoc[];
  investorProfile: InvestorProfile | null;
  syncing: boolean;
  contextSyncing: boolean;
  profileGenerating: boolean;
  lastSyncedAt: Date | null;
  /** Any exchange or wallet connected. */
  hasAnySources: boolean;
  /** At least one exchange (gates MCP + context). */
  hasExchanges: boolean;
  /** Portfolio payload has at least one holding. */
  hasPortfolio: boolean;
  /** At least one non-revoked MCP token. */
  hasActiveToken: boolean;
  sync: () => void;
  generateProfile: () => void;
  connectExchange: (data: ExchangeInput) => Promise<void>;
  disconnectExchange: (id: string) => Promise<void>;
  connectWallet: (data: WalletInput) => Promise<void>;
  disconnectWallet: (id: string) => Promise<void>;
  generateToken: (name: string, permission: string) => Promise<string | null>;
  revokeToken: (id: string) => Promise<void>;
  logout: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return ctx;
}

/** Prefer the latest snapshot timestamp from the payload; fall back to now. */
function deriveLastSynced(portfolio: PortfolioData | null): Date | null {
  if (!portfolio) return null;
  const times = [
    ...portfolio.snapshots.map((s) => s.fetchedAt),
    ...(portfolio.walletSnapshots?.map((w) => w.fetchedAt) ?? []),
  ]
    .map((t) => new Date(t).getTime())
    .filter((n) => Number.isFinite(n));
  return times.length > 0 ? new Date(Math.max(...times)) : new Date();
}

function randomToken(): string {
  const hex = "0123456789abcdef";
  let out = "mcp_";
  for (let i = 0; i < 48; i++) out += hex[Math.floor(Math.random() * 16)];
  return out;
}

export function DashboardProvider({
  children,
  mock,
}: {
  children: ReactNode;
  mock?: DashboardMock;
}) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const isMock = !!mock;

  const [user, setUser] = useState(mock?.user ?? null);
  const [connections, setConnections] = useState<Connection[]>(mock?.connections ?? []);
  const [wallets, setWallets] = useState<Wallet[]>(mock?.wallets ?? []);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(mock?.portfolio ?? null);
  const [mcpTokens, setMcpTokens] = useState<McpToken[]>(mock?.mcpTokens ?? []);
  const [contextDocs, setContextDocs] = useState<ContextDoc[]>(mock?.contextDocs ?? []);
  const [investorProfile, setInvestorProfile] = useState<InvestorProfile | null>(
    mock?.investorProfile ?? null
  );
  const [loading, setLoading] = useState(!isMock);
  const [syncing, setSyncing] = useState(false);
  const [contextSyncing, setContextSyncing] = useState(false);
  const [profileGenerating, setProfileGenerating] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(
    deriveLastSynced(mock?.portfolio ?? null)
  );

  // --- Data fetching (real mode only) ---
  const fetchPortfolio = useCallback(async (): Promise<PortfolioData | null> => {
    if (isMock) return null;
    setSyncing(true);
    try {
      const res = await fetch("/api/exchange/portfolio");
      if (res.ok) {
        const data: PortfolioData = await res.json();
        setPortfolio(data);
        setLastSyncedAt(deriveLastSynced(data));
        if (data.errors && data.errors.length > 0) {
          const names = data.errors.map((e) => e.source).join(", ");
          toast.error(
            `Couldn't reach ${data.errors.length} source${data.errors.length > 1 ? "s" : ""}: ${names}`
          );
        }
        return data;
      } else {
        toast.error("Failed to load portfolio. Please try again.");
      }
    } catch {
      toast.error("Network error while loading portfolio.");
    } finally {
      setSyncing(false);
    }
    return null;
  }, [isMock, toast]);

  const fetchContextDocs = useCallback(async () => {
    if (isMock) return;
    try {
      const res = await fetch("/api/context");
      if (res.ok) {
        const data = await res.json();
        setContextDocs(data.documents ?? []);
      }
    } catch {
      /* non-critical */
    }
  }, [isMock]);

  const syncContext = useCallback(
    async (connectionId: string) => {
      if (isMock) return;
      setContextSyncing(true);
      try {
        const res = await fetch("/api/exchange/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ connectionId }),
        });
        if (res.ok) fetchContextDocs();
      } catch {
        /* non-critical */
      } finally {
        setContextSyncing(false);
      }
    },
    [isMock, fetchContextDocs]
  );

  // Build the sanitized aggregate payload the profile endpoint expects.
  // Venue labels are name/chain only — never addresses.
  const buildProfilePayload = useCallback((p: PortfolioData) => {
    return {
      totalUsdValue: p.totalUsdValue,
      exchangeCount: p.snapshots.length,
      walletCount: p.walletSnapshots?.length ?? 0,
      holdings: p.holdings.map((h) => ({
        asset: h.asset,
        usdValue: h.usdValue,
        allocation: h.allocation,
        sources: h.sources,
      })),
      venues: [
        ...p.snapshots.map((s) => ({ label: s.exchange, usdValue: s.totalUsdValue })),
        ...(p.walletSnapshots ?? []).map((w) => ({
          label: `${w.chain} wallet`,
          usdValue: w.totalUsdValue,
        })),
      ],
    };
  }, []);

  const generateProfile = useCallback(
    async (override?: PortfolioData) => {
      if (isMock) {
        setProfileGenerating(true);
        setTimeout(() => {
          setProfileGenerating(false);
          toast.success("Investor profile updated");
        }, 1200);
        return;
      }
      const p = override ?? portfolio;
      if (!p || p.holdings.length === 0) return;

      setProfileGenerating(true);
      try {
        const res = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildProfilePayload(p)),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.profile) setInvestorProfile(data.profile);
        } else {
          toast.error("Couldn't generate your investor profile. Try again in a moment.");
        }
      } catch {
        toast.error("Network error while generating your profile.");
      } finally {
        setProfileGenerating(false);
      }
    },
    [isMock, portfolio, buildProfilePayload, toast]
  );

  // --- Initial load (real mode only) ---
  useEffect(() => {
    if (isMock) return;
    let active = true;

    async function init() {
      const supabase = createClient();
      const {
        data: { user: u },
      } = await supabase.auth.getUser();

      if (!u) {
        router.push("/login");
        return;
      }
      if (!active) return;

      setUser({ id: u.id, email: u.email ?? "" });

      const [{ data: conns }, { data: ws }] = await Promise.all([
        supabase.from("connections").select("id, exchange, label, created_at").eq("user_id", u.id),
        supabase.from("wallets").select("id, address, chain, label, created_at").eq("user_id", u.id),
      ]);
      if (!active) return;

      setConnections(conns ?? []);
      setWallets(ws ?? []);

      fetch("/api/mcp/tokens")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d && active && setMcpTokens(d.tokens ?? []))
        .catch(() => {});

      // Cached investor profile (non-blocking; absent until first generated).
      fetch("/api/profile")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d && active && d.profile && setInvestorProfile(d.profile))
        .catch(() => {});

      setLoading(false);

      if ((conns && conns.length > 0) || (ws && ws.length > 0)) {
        fetchPortfolio();
        fetchContextDocs();
      }
    }

    init();
    return () => {
      active = false;
    };
  }, [isMock, router, fetchPortfolio, fetchContextDocs]);

  // --- Handlers ---
  const sync = useCallback(() => {
    if (isMock) {
      setSyncing(true);
      setContextSyncing(true);
      setProfileGenerating(true);
      setTimeout(() => {
        setSyncing(false);
        setContextSyncing(false);
        setProfileGenerating(false);
        setLastSyncedAt(new Date());
        toast.success("Portfolio synced");
      }, 900);
      return;
    }
    // Fetch balances, refresh per-venue context docs, then (re)build the holistic
    // profile from the fresh aggregates + freshly-written docs. Sequenced so GLM
    // sees current data; profile generation never blocks the portfolio render.
    void (async () => {
      const data = await fetchPortfolio();
      await Promise.all(connections.map((c) => syncContext(c.id)));
      if (data && data.holdings.length > 0) await generateProfile(data);
    })();
  }, [isMock, connections, fetchPortfolio, syncContext, generateProfile, toast]);

  const connectExchange = useCallback(
    async (data: ExchangeInput) => {
      if (isMock) {
        setConnections((prev) => [
          ...prev,
          {
            id: `mock-${Date.now()}`,
            exchange: data.exchange,
            label: "API key",
            created_at: new Date().toISOString(),
          },
        ]);
        toast.success(`Connected ${data.exchange}`);
        return;
      }
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
      toast.success(`Connected ${data.exchange}`);

      fetchPortfolio();
      if (result.connectionId) syncContext(result.connectionId);
    },
    [isMock, user, toast, fetchPortfolio, syncContext]
  );

  const disconnectExchange = useCallback(
    async (id: string) => {
      const ok = await confirm({
        title: "Disconnect exchange?",
        message: "This permanently deletes the stored API key. You can reconnect anytime.",
        confirmLabel: "Disconnect",
        tone: "danger",
      });
      if (!ok) return;

      if (isMock) {
        setConnections((prev) => {
          const remaining = prev.filter((c) => c.id !== id);
          if (remaining.length === 0 && wallets.length === 0) setPortfolio(null);
          return remaining;
        });
        toast.success("Exchange disconnected");
        return;
      }

      try {
        const res = await fetch("/api/exchange/disconnect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ connectionId: id }),
        });
        if (res.ok) {
          const remaining = connections.filter((c) => c.id !== id);
          setConnections(remaining);
          if (remaining.length === 0 && wallets.length === 0) setPortfolio(null);
          toast.success("Exchange disconnected");
        } else {
          toast.error("Failed to disconnect. Please try again.");
        }
      } catch {
        toast.error("Network error. Please try again.");
      }
    },
    [isMock, confirm, connections, wallets, toast]
  );

  const connectWallet = useCallback(
    async (data: WalletInput) => {
      if (isMock) {
        setWallets((prev) => [
          ...prev,
          {
            id: `mock-${Date.now()}`,
            address: data.address,
            chain: data.chain,
            label: data.label,
            created_at: new Date().toISOString(),
          },
        ]);
        toast.success("Wallet added");
        return;
      }
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
      toast.success("Wallet added");

      fetchPortfolio();
    },
    [isMock, user, toast, fetchPortfolio]
  );

  const disconnectWallet = useCallback(
    async (id: string) => {
      const ok = await confirm({
        title: "Remove wallet?",
        message: "This wallet will stop contributing to your portfolio context.",
        confirmLabel: "Remove",
        tone: "danger",
      });
      if (!ok) return;

      if (isMock) {
        setWallets((prev) => {
          const remaining = prev.filter((w) => w.id !== id);
          if (remaining.length === 0 && connections.length === 0) setPortfolio(null);
          return remaining;
        });
        toast.success("Wallet removed");
        return;
      }

      try {
        const res = await fetch("/api/wallet/disconnect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletId: id }),
        });
        if (res.ok) {
          const remaining = wallets.filter((w) => w.id !== id);
          setWallets(remaining);
          if (remaining.length === 0 && connections.length === 0) setPortfolio(null);
          toast.success("Wallet removed");
        } else {
          toast.error("Failed to remove wallet. Please try again.");
        }
      } catch {
        toast.error("Network error. Please try again.");
      }
    },
    [isMock, confirm, wallets, connections, toast]
  );

  const generateToken = useCallback(
    async (name: string, permission: string): Promise<string | null> => {
      if (isMock) {
        const token = randomToken();
        setMcpTokens((prev) => [
          {
            id: `mock-${Date.now()}`,
            name,
            permission_level: permission,
            revoked: false,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        toast.success("MCP token created");
        return token;
      }
      const res = await fetch("/api/mcp/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, permissionLevel: permission }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to create token.");
        return null;
      }

      const tokensRes = await fetch("/api/mcp/tokens");
      if (tokensRes.ok) {
        const tokensData = await tokensRes.json();
        setMcpTokens(tokensData.tokens ?? []);
      }
      toast.success("MCP token created");
      return data.token ?? null;
    },
    [isMock, toast]
  );

  const revokeToken = useCallback(
    async (id: string) => {
      const ok = await confirm({
        title: "Revoke this token?",
        message: "Agents using it will immediately lose access. This cannot be undone.",
        confirmLabel: "Revoke",
        tone: "danger",
      });
      if (!ok) return;

      if (isMock) {
        setMcpTokens((prev) => prev.map((t) => (t.id === id ? { ...t, revoked: true } : t)));
        toast.success("Token revoked");
        return;
      }

      try {
        const res = await fetch("/api/mcp/tokens", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (res.ok) {
          setMcpTokens((prev) => prev.map((t) => (t.id === id ? { ...t, revoked: true } : t)));
          toast.success("Token revoked");
        } else {
          toast.error("Failed to revoke token. Please try again.");
        }
      } catch {
        toast.error("Network error. Please try again.");
      }
    },
    [isMock, confirm, toast]
  );

  const logout = useCallback(async () => {
    if (isMock) {
      toast.toast("Demo mode — logout is disabled");
      return;
    }
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }, [isMock, router, toast]);

  const value: DashboardContextValue = {
    user,
    connections,
    wallets,
    portfolio,
    mcpTokens,
    contextDocs,
    investorProfile,
    syncing,
    contextSyncing,
    profileGenerating,
    lastSyncedAt,
    hasAnySources: connections.length > 0 || wallets.length > 0,
    hasExchanges: connections.length > 0,
    hasPortfolio: !!portfolio && portfolio.holdings.length > 0,
    hasActiveToken: mcpTokens.some((t) => !t.revoked),
    sync,
    generateProfile,
    connectExchange,
    disconnectExchange,
    connectWallet,
    disconnectWallet,
    generateToken,
    revokeToken,
    logout,
  };

  return (
    <DashboardContext.Provider value={value}>
      {loading ? <DashboardLoader /> : children}
    </DashboardContext.Provider>
  );
}
