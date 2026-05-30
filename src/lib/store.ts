/**
 * Data access layer. Uses Supabase for auth/DB, encrypts API keys locally.
 */

import { createClient } from "./supabase/server";
import { encrypt, decrypt } from "./crypto";
import type { SupportedExchange, ExchangeCredentials } from "./exchange";
import { normalizeWalletAddress, type WalletChain } from "./chains";
import type { InvestorProfileData } from "./generators/investor-profile";

// ---------- Types ----------

export interface StoredConnection {
  id: string;
  user_id: string;
  exchange: SupportedExchange;
  label: string;
  encrypted_key: string;
  encrypted_secret: string;
  encrypted_password: string | null;
  created_at: string;
}

export interface StoredSnapshot {
  id: string;
  user_id: string;
  connection_id: string;
  data: object;
  created_at: string;
}

export interface McpToken {
  id: string;
  user_id: string;
  token_hash: string;
  name: string;
  permission_level: "full" | "portfolio_only" | "anonymized";
  revoked: boolean;
  created_at: string;
}

export interface StoredWallet {
  id: string;
  user_id: string;
  address: string;
  chain: WalletChain;
  label: string;
  created_at: string;
}

// ---------- Wallets ----------

export async function saveWallet(
  userId: string,
  address: string,
  chain: WalletChain,
  label: string
): Promise<string> {
  const supabase = await createClient();

  // EVM addresses are lowercased for dedup; Solana base58 is case-sensitive.
  const { data, error } = await supabase
    .from("wallets")
    .insert({ user_id: userId, address: normalizeWalletAddress(chain, address), chain, label })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to save wallet: ${error.message}`);
  return data.id;
}

export async function getWallets(userId: string): Promise<StoredWallet[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to get wallets: ${error.message}`);
  return data ?? [];
}

export async function deleteWallet(
  walletId: string,
  userId: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("wallets")
    .delete()
    .eq("id", walletId)
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to delete wallet: ${error.message}`);
}

// ---------- Connections ----------

export async function saveConnection(
  userId: string,
  exchange: SupportedExchange,
  credentials: ExchangeCredentials,
  label: string
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("connections")
    .insert({
      user_id: userId,
      exchange,
      label,
      encrypted_key: encrypt(credentials.apiKey),
      encrypted_secret: encrypt(credentials.secret),
      encrypted_password: credentials.password
        ? encrypt(credentials.password)
        : null,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to save connection: ${error.message}`);
  return data.id;
}

export async function getConnections(
  userId: string
): Promise<StoredConnection[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("connections")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to get connections: ${error.message}`);
  return data ?? [];
}

export async function getConnectionCredentials(
  connectionId: string,
  userId: string
): Promise<{ exchange: SupportedExchange; credentials: ExchangeCredentials } | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("connections")
    .select("*")
    .eq("id", connectionId)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;

  return {
    exchange: data.exchange as SupportedExchange,
    credentials: {
      apiKey: decrypt(data.encrypted_key),
      secret: decrypt(data.encrypted_secret),
      password: data.encrypted_password
        ? decrypt(data.encrypted_password)
        : undefined,
    },
  };
}

export async function deleteConnection(
  connectionId: string,
  userId: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("connections")
    .delete()
    .eq("id", connectionId)
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to delete connection: ${error.message}`);
}

// ---------- Snapshots ----------

export async function saveSnapshot(
  userId: string,
  connectionId: string,
  data: object
): Promise<void> {
  const supabase = await createClient();

  // Upsert: one snapshot per connection (latest wins)
  const { error } = await supabase.from("snapshots").upsert(
    {
      user_id: userId,
      connection_id: connectionId,
      data,
      created_at: new Date().toISOString(),
    },
    { onConflict: "connection_id" }
  );

  if (error) throw new Error(`Failed to save snapshot: ${error.message}`);
}

export async function getSnapshots(userId: string): Promise<StoredSnapshot[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("snapshots")
    .select("*")
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to get snapshots: ${error.message}`);
  return data ?? [];
}

// ---------- MCP Tokens ----------

export async function saveMcpToken(
  userId: string,
  tokenHash: string,
  name: string,
  permissionLevel: McpToken["permission_level"]
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("mcp_tokens")
    .insert({
      user_id: userId,
      token_hash: tokenHash,
      name,
      permission_level: permissionLevel,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to save MCP token: ${error.message}`);
  return data.id;
}

export async function findMcpToken(
  tokenHash: string
): Promise<McpToken | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("mcp_tokens")
    .select("*")
    .eq("token_hash", tokenHash)
    .eq("revoked", false)
    .single();

  if (error || !data) return null;
  return data as McpToken;
}

// ---------- Context Documents ----------

export interface StoredContextDocument {
  id: string;
  user_id: string;
  connection_id: string;
  dimension: string;
  content: string;
  metadata: Record<string, unknown>;
  updated_at: string;
}

export async function upsertContextDocument(
  userId: string,
  connectionId: string,
  dimension: string,
  content: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("context_documents").upsert(
    {
      user_id: userId,
      connection_id: connectionId,
      dimension,
      content,
      metadata,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "connection_id,dimension" },
  );

  if (error) throw new Error(`Failed to upsert context document: ${error.message}`);
}

export async function getContextDocuments(
  userId: string,
  dimension?: string,
): Promise<StoredContextDocument[]> {
  const supabase = await createClient();

  let query = supabase
    .from("context_documents")
    .select("*")
    .eq("user_id", userId);

  if (dimension) {
    query = query.eq("dimension", dimension);
  }

  const { data, error } = await query.order("updated_at", { ascending: false });

  if (error) throw new Error(`Failed to get context documents: ${error.message}`);
  return data ?? [];
}

// ---------- Investor Profile (holistic, one row per user) ----------

/** Raw DB row shape for the `investor_profiles` table. */
export interface InvestorProfileRow {
  user_id: string;
  summary: string;
  trading_style: string;
  risk_profile: string;
  preferences: string[];
  behaviors: string[];
  agent_guidance: string[];
  source: string;
  generated_at: string;
  updated_at: string;
}

function asStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

/** Map a DB row to the app-facing profile shape. Exported for the MCP service path. */
export function rowToInvestorProfile(row: InvestorProfileRow): InvestorProfileData {
  return {
    summary: row.summary,
    tradingStyle: row.trading_style,
    riskProfile: row.risk_profile,
    preferences: asStrings(row.preferences),
    behaviors: asStrings(row.behaviors),
    agentGuidance: asStrings(row.agent_guidance),
    generatedAt: row.generated_at,
    source: row.source === "llm" ? "llm" : "deterministic",
  };
}

export async function upsertInvestorProfile(
  userId: string,
  profile: InvestorProfileData,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("investor_profiles").upsert(
    {
      user_id: userId,
      summary: profile.summary,
      trading_style: profile.tradingStyle,
      risk_profile: profile.riskProfile,
      preferences: profile.preferences,
      behaviors: profile.behaviors,
      agent_guidance: profile.agentGuidance,
      source: profile.source,
      generated_at: profile.generatedAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) throw new Error(`Failed to upsert investor profile: ${error.message}`);
}

/**
 * Read the cached profile. Returns null when absent OR when the table hasn't been
 * provisioned yet (pre-migration) — callers treat "no profile" as a soft state.
 */
export async function getInvestorProfile(
  userId: string,
): Promise<InvestorProfileData | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("investor_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[store] getInvestorProfile failed (table missing?):", error.message);
    return null;
  }
  return data ? rowToInvestorProfile(data as InvestorProfileRow) : null;
}
