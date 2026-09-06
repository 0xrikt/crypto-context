"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createNotesEditor } from "@/lib/notes-editor";
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
  notes?: string;
}

interface ExchangeInput {
  exchange: string;
  apiKey: string;
  secret: string;
  password?: string;
}

export interface WalletInput {
  address: string;
  chain: string;
  label: string;
  brand?: string;
}

interface DashboardContextValue {
  user: { id: string; email: string } | null;
  connections: Connection[];
  wallets: Wallet[];
  portfolio: PortfolioData | null;
  mcpTokens: McpToken[];
  contextDocs: ContextDoc[];
  investorProfile: InvestorProfile | null;
  notes: string;
  /** When the notes were last saved — drives the "profile is stale" hint. */
  notesUpdatedAt: string | null;
  notesSaving: boolean;
  notesDirty: boolean;
  notesError: string | null;
  editNotes: (content: string) => void;
  /** False until the user's saved notes have been fetched (prevents editor flash). */
  notesLoaded: boolean;
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
  saveNotes: (content: string) => Promise<void>;
  /** Fetch the full assembled context markdown (for copy-paste / export). */
  getFullContext: () => Promise<string>;
  connectExchange: (data: ExchangeInput) => Promise<void>;
  disconnectExchange: (id: string) => Promise<void>;
  connectWallet: (data: WalletInput) => Promise<void>;
  /** Batch add (brand-first import: one address → several chain rows, one toast). */
  connectWallets: (items: WalletInput[]) => Promise<void>;
  disconnectWallet: (id: string) => Promise<void>;
  /** Remove a whole brand/address group of wallet rows with a single confirm. */
  disconnectWalletGroup: (ids: string[]) => Promise<void>;
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
    ...(portfolio.snapshots ?? []).map((s) => s.fetchedAt),
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

/** Representative full-context markdown for the dev preview (fabricated). */
const MOCK_FULL_CONTEXT = `# Crypto Investor Context
> Generated: 2026-06-12T08:00:00.000Z
> For the AI reading this: every figure below is computed from the user's actual exchange/wallet data — ground your advice in these numbers and never invent ones that aren't here.
> Contents: Investor Notes (the user's own words) → Investor Profile (synthesized) → Portfolio Snapshot → Trading Profile (per exchange) → Fund Flow (per exchange).

# Investor Notes (the user's own strategy, in their words)
Core thesis: ETH is my long-term anchor — I don't sell the base position. BTC is a macro hedge, sized smaller.
Rules: only add to majors on 20%+ drawdowns; keep ≥10% in stables; L2 governance tokens max ~15% combined.
Ideas to try: rotate a slice of the memecoin churn into SOL DeFi; stop day-trading WIF/JUP.

---

# Investor Profile
> A disciplined core-and-satellite crypto investor running an ETH-weighted base with a BTC hedge, then rotating a smaller satellite sleeve into L2 governance tokens.
> *(AI-written from computed facts, generated 2026-06-12)*

**Trading style:** Active but structured — ~12 maker-side trades a week around majors, with open limit orders rather than market chasing.
**Risk posture:** Moderate. Top-3 assets hold ~71% of the book; stablecoin buffer ~12%.

---

# Portfolio Snapshot
> Total value: $96,800 (across 2 exchanges + 3 wallets)

| Asset | Value | % | Location |
|-------|-------|---|----------|
| ETH | $30,008 | 31% | binance + ethereum |
| BTC | $25,168 | 26% | binance + bybit |
| SOL | $13,552 | 14% | bybit |
| USDC | $11,616 | 12% | binance + arbitrum |

## Data Sources

| Source | Type | Status | Data as of |
|--------|------|--------|------------|
| binance | exchange | live | 2026-06-12 08:00 UTC |
| bybit | exchange | live | 2026-06-12 08:00 UTC |
| ethereum:0x71C7...976F | wallet | live | 2026-06-12 08:00 UTC |

---

# Trading Profile — binance
- 247 trades across 18 pairs over 180 days; ~12/week, concentrated around ETH and majors.

# Trading Profile — bybit
> No trading activity found in the last 90 days.

---

# Fund Flow — binance
- Deposits: 14 · Withdrawals: 6
- Most active currency: USDC — 14 in / 6 out, net +18,400 USDC`;

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

  const [notesUpdatedAt, setNotesUpdatedAt] = useState<string | null>(null);
  const [notesEditor] = useState(() => createNotesEditor(mock?.notes ?? "", async (content) => {
    if (!isMock) {
      const response = await fetch("/api/notes", {method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({content})});
      if (!response.ok) throw new Error("Could not save notes");
    }
    setNotesUpdatedAt(new Date().toISOString());
  }));
  const noteState = useSyncExternalStore(notesEditor.subscribe, notesEditor.getSnapshot, notesEditor.getSnapshot);
  const notes = noteState.content;
  const notesSaving = noteState.saving;
  const notesDirty = noteState.content !== noteState.saved;
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      const state = notesEditor.getSnapshot();
      if (state.content !== state.saved) {event.preventDefault();event.returnValue="";}
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => {window.removeEventListener("beforeunload", beforeUnload);};
  }, [notesEditor]);
  const [notesLoadError, setNotesLoadError] = useState<string | null>(null);
  const [notesLoaded, setNotesLoaded] = useState(isMock);
  const [loading, setLoading] = useState(!isMock);
  const [syncing, setSyncing] = useState(false);
  const contextPending = useRef(0);
  const syncPending = useRef(false);
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
      contextPending.current++;
      setContextSyncing(true);
      try {
        const res = await fetch("/api/exchange/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ connectionId }),
        });
        if (!res.ok) {toast.error("Trade history sync failed. Retry this source.");return false;}
        const data = await res.json();
        const result = data.result;
        await fetchContextDocs();
        if (!result?.tradingProfile?.success || !result?.fundFlow?.success || result.tradingProfile.error || result.fundFlow.error) {
          toast.error("History is incomplete. Review source warnings before relying on the profile.");
          return false;
        }
        return true;
      } catch {
        toast.error("Network error while syncing history. Retry this source.");
        return false;
      } finally {
        contextPending.current--;
        setContextSyncing(contextPending.current > 0);
      }
    },
    [isMock, fetchContextDocs, toast]
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
      if (!(await notesEditor.save())) {toast.error("Save your notes before generating a profile.");return;}
      const p = override ?? portfolio;
      if (p?.incomplete) {
        toast.error("Profile unchanged: some sources or prices are unavailable. Retry sync when data is complete.");
        return;
      }
      if (!p || (p.holdings?.length ?? 0) === 0) {
        toast.toast("Sync your portfolio first — the profile is generated from your holdings.");
        return;
      }

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
          if (data.persisted === false) toast.error("Profile could not be saved; agents still see the previous version. Retry generation.");
        } else {
          toast.error("Couldn't generate your investor profile. Try again in a moment.");
        }
      } catch {
        toast.error("Network error while generating your profile.");
      } finally {
        setProfileGenerating(false);
      }
    },
    [isMock, portfolio, buildProfilePayload, toast, notesEditor]
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
        supabase.from("wallets").select("id, address, chain, label, brand, created_at").eq("user_id", u.id),
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

      // Editing stays disabled until saved notes are known; never overwrite unknown data.
      fetch("/api/notes")
        .then((r) => {if (!r.ok) throw new Error("load failed");return r.json();})
        .then((d) => {
          if (!active) return;
          if (typeof d.notes !== "string") throw new Error("invalid notes");
          notesEditor.load(d.notes);
          if (typeof d.updatedAt === "string") setNotesUpdatedAt(d.updatedAt);
          setNotesLoaded(true);
        })
        .catch(() => {if (active) setNotesLoadError("Could not load saved notes. Reload the page to retry; editing is disabled to protect your existing notes.");});

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
  }, [isMock, router, fetchPortfolio, fetchContextDocs, notesEditor]);

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
    if (syncPending.current) return;
    syncPending.current = true;
    void (async () => {
      try {
        const data = await fetchPortfolio();
        await Promise.all(connections.map((c) => syncContext(c.id)));
        if (data && data.holdings.length > 0) await generateProfile(data);
      } finally {syncPending.current = false;}
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
          setPortfolio(null);
          setInvestorProfile(null);
          setContextDocs([]);
          await Promise.all([fetchPortfolio(), fetchContextDocs()]);
          toast.success("Exchange disconnected");
        } else {
          toast.error("Failed to disconnect. Please try again.");
        }
      } catch {
        toast.error("Network error. Please try again.");
      }
    },
    [isMock, confirm, connections, wallets, toast, fetchPortfolio, fetchContextDocs]
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
            brand: data.brand ?? null,
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
        .select("id, address, chain, label, brand, created_at")
        .eq("user_id", user!.id);
      setWallets(ws ?? []);
      toast.success("Wallet added");

      fetchPortfolio();
    },
    [isMock, user, toast, fetchPortfolio]
  );

  // Batch add: sequential POSTs (gentle on rate limits), one refresh, one toast.
  const connectWallets = useCallback(
    async (items: WalletInput[]) => {
      if (items.length === 0) return;
      if (isMock) {
        setWallets((prev) => [
          ...prev,
          ...items.map((data, i) => ({
            id: `mock-${Date.now()}-${i}`,
            address: data.address,
            chain: data.chain,
            label: data.label,
            brand: data.brand ?? null,
            created_at: new Date().toISOString(),
          })),
        ]);
        toast.success(items.length === 1 ? "Wallet added" : `Wallet added across ${items.length} chains`);
        return;
      }

      const failures: string[] = [];
      for (const item of items) {
        try {
          const res = await fetch("/api/wallet/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
          });
          if (!res.ok) {
            const result = await res.json().catch(() => null);
            // "Already connected" is a no-op for a batch, not a failure worth surfacing.
            if (res.status !== 409) failures.push(`${item.chain}: ${result?.error ?? "failed"}`);
          }
        } catch {
          failures.push(`${item.chain}: network error`);
        }
      }

      const supabase = createClient();
      const { data: ws } = await supabase
        .from("wallets")
        .select("id, address, chain, label, brand, created_at")
        .eq("user_id", user!.id);
      setWallets(ws ?? []);

      if (failures.length === items.length) {
        throw new Error(failures[0] ?? "Failed to add wallet");
      }
      if (failures.length > 0) {
        toast.error(`Added with ${failures.length} failure${failures.length > 1 ? "s" : ""}: ${failures.join("; ")}`);
      } else {
        toast.success(items.length === 1 ? "Wallet added" : `Wallet added across ${items.length} chains`);
      }
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
          setPortfolio(null);
          setInvestorProfile(null);
          await fetchPortfolio();
          toast.success("Wallet removed");
        } else {
          toast.error("Failed to remove wallet. Please try again.");
        }
      } catch {
        toast.error("Network error. Please try again.");
      }
    },
    [isMock, confirm, wallets, connections, toast, fetchPortfolio]
  );

  const disconnectWalletGroup = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      const ok = await confirm({
        title: "Remove this wallet?",
        message:
          ids.length > 1
            ? `This removes the address from all ${ids.length} tracked chains. You can re-add it anytime.`
            : "This wallet will stop contributing to your portfolio context.",
        confirmLabel: "Remove",
        tone: "danger",
      });
      if (!ok) return;

      if (isMock) {
        setWallets((prev) => {
          const remaining = prev.filter((w) => !ids.includes(w.id));
          if (remaining.length === 0 && connections.length === 0) setPortfolio(null);
          return remaining;
        });
        toast.success("Wallet removed");
        return;
      }

      let failed = 0;
      for (const id of ids) {
        try {
          const res = await fetch("/api/wallet/disconnect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ walletId: id }),
          });
          if (!res.ok) failed++;
        } catch {
          failed++;
        }
      }

      const supabase = createClient();
      const { data: ws } = await supabase
        .from("wallets")
        .select("id, address, chain, label, brand, created_at")
        .eq("user_id", user!.id);
      const remaining = ws ?? [];
      setWallets(remaining);
      if (remaining.length === 0 && connections.length === 0) setPortfolio(null);

      setPortfolio(null);
      setInvestorProfile(null);
      await fetchPortfolio();
      if (failed > 0) toast.error(`Couldn't remove ${failed} chain${failed > 1 ? "s" : ""}. Try again.`);
      else toast.success("Wallet removed");
    },
    [isMock, confirm, connections, user, toast, fetchPortfolio]
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
    if (!(await notesEditor.save())) {toast.error("Save your notes before signing out.");return;}
    if (isMock) {
      toast.toast("Demo mode — logout is disabled");
      return;
    }
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }, [isMock, router, toast, notesEditor]);

  const saveNotes = useCallback(async (content: string) => {
    if (content !== notesEditor.getSnapshot().content) notesEditor.edit(content);
    await notesEditor.save();
  }, [notesEditor]);

  const getFullContext = useCallback(async (): Promise<string> => {
    if (isMock) return MOCK_FULL_CONTEXT;
    if (!(await notesEditor.save())) {toast.error("Save your notes before exporting context.");return "";}
    try {
      const res = await fetch("/api/context/full");
      if (res.ok) return await res.text();
      toast.error("Couldn't load your context. Please try again.");
      return "";
    } catch {
      toast.error("Network error while loading your context.");
      return "";
    }
  }, [isMock, toast, notesEditor]);

  const value: DashboardContextValue = {
    user,
    connections,
    wallets,
    portfolio,
    mcpTokens,
    contextDocs,
    investorProfile,
    notes,
    notesUpdatedAt,
    notesSaving,
    notesDirty,
    notesError: notesLoadError ?? noteState.error,
    editNotes: notesEditor.edit,
    notesLoaded,
    syncing,
    contextSyncing,
    profileGenerating,
    lastSyncedAt,
    hasAnySources: connections.length > 0 || wallets.length > 0,
    hasExchanges: connections.length > 0,
    hasPortfolio: !!portfolio && (portfolio.holdings?.length ?? 0) > 0,
    hasActiveToken: mcpTokens.some((t) => !t.revoked),
    sync,
    generateProfile,
    saveNotes,
    getFullContext,
    connectExchange,
    disconnectExchange,
    connectWallet,
    connectWallets,
    disconnectWallet,
    disconnectWalletGroup,
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
