import { withTimeout } from "./timeout";
/**
 * Shared context assembler — the single source of truth for the user's full
 * crypto context, used by BOTH the MCP endpoint (token auth) and the
 * /api/context/full export endpoint (cookie or token auth).
 *
 * All reads use the Supabase service role (no cookie), so callers must
 * authenticate the user themselves before calling these.
 */

import { createServerClient } from "@supabase/ssr";
import { createHash } from "crypto";
import { decrypt } from "@/lib/crypto";
import {
  fetchPortfolio,
  type SupportedExchange,
  type ExchangeCredentials,
  type PortfolioSnapshot,
} from "@/lib/exchange";
import { fetchWalletPortfolioForChain, type WalletSnapshot } from "@/lib/wallet";
import {
  generatePortfolioContext,
  generateFullContext,
  type ContextDocument,
  type SourceStatus,
} from "@/lib/context";
import { rowToInvestorProfile, type InvestorProfileRow } from "@/lib/store";
import { renderProfileMarkdown } from "@/lib/generators/investor-profile";

/** Service-role client (bypasses RLS). Callers must auth the user first. */
export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  );
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Resolve an MCP bearer token → user + permission level (or null if invalid/revoked). */
export async function authenticateMcpToken(
  token: string,
): Promise<{ userId: string; permissionLevel: string } | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("mcp_tokens")
    .select("user_id, permission_level")
    .eq("token_hash", hashToken(token))
    .eq("revoked", false)
    .single();

  if (!data || !["full", "portfolio_only", "anonymized"].includes(data.permission_level)) return null;
  return { userId: data.user_id as string, permissionLevel: data.permission_level as string };
}

/** Per-source budgets: an AI agent is waiting — slow sources must not serialize. */
const EXCHANGE_TIMEOUT_MS = 20_000;
const WALLET_TIMEOUT_MS = 15_000;

/** Minimal shape check before trusting a stored snapshot as a PortfolioSnapshot. */
function isPortfolioSnapshot(value: unknown): value is PortfolioSnapshot {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as PortfolioSnapshot).exchange === "string" &&
    Array.isArray((value as PortfolioSnapshot).holdings)
  );
}

/** Minimal shape check before trusting a stored snapshot as a WalletSnapshot. */
function isWalletSnapshot(value: unknown): value is WalletSnapshot {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as WalletSnapshot).address === "string" &&
    Array.isArray((value as WalletSnapshot).holdings)
  );
}

function shortWalletLabel(chain: string, address: string, brand?: string | null): string {
  const base = `${chain}:${address.slice(0, 6)}...${address.slice(-4)}`;
  // The brand is how the USER refers to this wallet ("my MetaMask") — including
  // it lets the agent connect their words to the right source.
  return brand ? `${base} (${brand})` : base;
}

interface ExchangeFetchOutcome {
  snapshots: PortfolioSnapshot[];
  statuses: SourceStatus[];
}

async function fetchAllPortfolios(userId: string): Promise<ExchangeFetchOutcome> {
  const supabase = createServiceClient();
  // Load connections and their last stored snapshots together; snapshots serve as
  // the fallback when a live exchange fetch fails or exceeds its budget. Staleness
  // stays visible to the agent via the Data Sources block in the markdown.
  const [{ data: connections, error: connectionsError }, { data: storedRows, error: snapshotError }] = await Promise.all([
    supabase.from("connections").select("*").eq("user_id", userId),
    supabase.from("snapshots").select("connection_id, data").eq("user_id", userId),
  ]);
  if (connectionsError || snapshotError) throw new Error("Could not load exchange sources or cache");
  if (!connections || connections.length === 0) return { snapshots: [], statuses: [] };

  const stored = new Map<string, PortfolioSnapshot>();
  for (const row of storedRows ?? []) {
    if (isPortfolioSnapshot(row.data)) stored.set(row.connection_id as string, row.data);
  }

  const results = await Promise.all(
    connections.map((conn) =>
      withTimeout(
        (async () => {
          const credentials: ExchangeCredentials = {
            apiKey: decrypt(conn.encrypted_key),
            secret: decrypt(conn.encrypted_secret),
            password: conn.encrypted_password ? decrypt(conn.encrypted_password) : undefined,
          };
          return fetchPortfolio(conn.exchange as SupportedExchange, credentials);
        })(),
        EXCHANGE_TIMEOUT_MS,
      ).catch((err) => {
        // Never log credentials — exchange name + error type only.
        console.error(
          `[context-assembler] portfolio fetch failed: exchange=${conn.exchange}`,
          err instanceof Error ? err.name : "unknown error",
        );
        return null;
      }),
    ),
  );

  const snapshots: PortfolioSnapshot[] = [];
  const statuses: SourceStatus[] = [];
  for (let i = 0; i < connections.length; i++) {
    const conn = connections[i];
    const live = results[i];
    if (live) {
      snapshots.push(live);
      statuses.push({ label: conn.exchange, kind: "exchange", status: "live", fetchedAt: live.fetchedAt });
      // Await cache persistence before the serverless request can finish.
      if (live.holdings.every(h => h.usdValue !== null)) await supabase
        .from("snapshots")
        .upsert(
          { user_id: userId, connection_id: conn.id, data: live, created_at: new Date().toISOString() },
          { onConflict: "connection_id" },
        )
        .then(({ error }) => {
          if (error) console.error("[context-assembler] snapshot cache write failed:", error.message);
        });
    } else {
      const cached = stored.get(conn.id as string);
      if (cached) {
        snapshots.push(cached);
        statuses.push({ label: conn.exchange, kind: "exchange", status: "cached", fetchedAt: cached.fetchedAt });
      } else {
        statuses.push({ label: conn.exchange, kind: "exchange", status: "unreachable", fetchedAt: null });
      }
    }
  }
  return { snapshots, statuses };
}

interface WalletFetchOutcome {
  snapshots: WalletSnapshot[];
  statuses: SourceStatus[];
}

export async function collectWalletPortfolio(userId: string): Promise<WalletFetchOutcome> {
  const supabase = createServiceClient();
  // Same fallback contract as exchanges: wallet_snapshots holds the last good
  // fetch per wallet, so a flaky RPC degrades to "cached" instead of silently
  // dropping the venue from the picture.
  const [{ data: wallets, error: walletsError }, { data: storedRows, error: snapshotError }] = await Promise.all([
    supabase.from("wallets").select("*").eq("user_id", userId),
    supabase.from("wallet_snapshots").select("wallet_id, data").eq("user_id", userId),
  ]);
  if (walletsError || snapshotError) throw new Error("Could not load wallet sources or cache");
  if (!wallets || wallets.length === 0) return { snapshots: [], statuses: [] };

  const stored = new Map<string, WalletSnapshot>();
  for (const row of storedRows ?? []) {
    if (isWalletSnapshot(row.data)) stored.set(row.wallet_id as string, row.data);
  }

  const results = await Promise.all(
    wallets.map((w) =>
      withTimeout(fetchWalletPortfolioForChain(w.address, w.chain), WALLET_TIMEOUT_MS).catch(
        (err) => {
          console.error(
            `[context-assembler] wallet fetch failed: chain=${w.chain}`,
            err instanceof Error ? err.name : "unknown",
          );
          return null;
        },
      ),
    ),
  );

  const snapshots: WalletSnapshot[] = [];
  const statuses: SourceStatus[] = [];
  for (let i = 0; i < wallets.length; i++) {
    const w = wallets[i];
    const label = shortWalletLabel(w.chain as string, w.address as string, w.brand as string | null);
    const live = results[i];
    if (live) {
      snapshots.push(live);
      statuses.push({ label, kind: "wallet", status: "live", fetchedAt: live.fetchedAt });
      if (live.holdings.every(h => h.usdValue !== null)) await supabase
        .from("wallet_snapshots")
        .upsert(
          { user_id: userId, wallet_id: w.id, data: live, created_at: new Date().toISOString() },
          { onConflict: "wallet_id" },
        )
        .then(({ error }) => {
          if (error) console.error("[context-assembler] wallet snapshot cache write failed:", error.message);
        });
    } else {
      const cached = stored.get(w.id as string);
      if (cached) {
        snapshots.push(cached);
        statuses.push({ label, kind: "wallet", status: "cached", fetchedAt: cached.fetchedAt });
      } else {
        statuses.push({ label, kind: "wallet", status: "unreachable", fetchedAt: null });
      }
    }
  }
  return { snapshots, statuses };
}

/** The portfolio snapshot markdown (also the input to the full context). */
export async function collectPortfolio(userId: string) {
  const [exchanges, wallets] = await Promise.all([fetchAllPortfolios(userId), collectWalletPortfolio(userId)]);
  return { snapshots: exchanges.snapshots, walletSnapshots: wallets.snapshots, statuses: [...exchanges.statuses, ...wallets.statuses] };
}

export async function assemblePortfolioMd(userId: string): Promise<string> {
  const result = await collectPortfolio(userId);
  return generatePortfolioContext(result.snapshots, result.walletSnapshots, result.statuses);
}

/**
 * The full context: investor profile → notes → portfolio → trading/fund-flow.
 * Pass `portfolioMd` to avoid re-fetching when the caller already has it.
 */
export async function assembleFullContext(userId: string, portfolioMd?: string): Promise<string> {
  const md = portfolioMd ?? (await assemblePortfolioMd(userId));
  const supabase = createServiceClient();

  const [{ data: contextDocs, error: docsError }, { data: profileRow, error: profileError }, { data: notesRow, error: notesError }] = await Promise.all([
    supabase.from("context_documents").select("dimension, content, updated_at").eq("user_id", userId),
    supabase.from("investor_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("strategy_notes").select("content, updated_at").eq("user_id", userId).maybeSingle(),
  ]);

  if (docsError || profileError || notesError) throw new Error("Could not load context documents");

  const docs: ContextDocument[] = (contextDocs ?? []).map((d) => ({
    dimension: d.dimension as string,
    content: d.content as string,
    updated_at: d.updated_at as string,
  }));

  const investorProfileMd = profileRow
    ? renderProfileMarkdown(rowToInvestorProfile(profileRow as InvestorProfileRow))
    : undefined;
  const notesMd = (notesRow?.content as string | undefined) || undefined;

  return generateFullContext(md, docs, investorProfileMd, notesMd, {
    profileGeneratedAt: (profileRow?.generated_at as string | undefined) ?? null,
    notesUpdatedAt: (notesRow?.updated_at as string | undefined) ?? null,
  });
}

/** Mask dollar amounts for tokens scoped to "anonymized" permission. */
export function applyPermission(text: string, permissionLevel: string): string {
  return permissionLevel === "anonymized" ? text.replace(/\$\s*[+−-]?(?:\d[\d,]*(?:\.\d+)?|\.\d+)(?:[kKmMbB])?/g, "$***") : text;
}
