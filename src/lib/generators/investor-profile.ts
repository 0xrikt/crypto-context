/**
 * Holistic investor-profile generator.
 *
 * This is the product's core value: a rich, accurate narrative of WHO the user is
 * as an investor — trading style, risk posture, preferences, behaviors, and concrete
 * guidance an AI agent can act on. It is grounded on deterministic, pre-computed facts
 * (portfolio shape + the per-venue trading/fund-flow analyses) and interpreted by GLM.
 *
 * PRIVACY: only aggregated, derived facts are sent to the LLM — never API keys, never
 * wallet addresses. Venues are referenced by name/chain only.
 *
 * RESILIENCE: GLM (free tier) is slow and occasionally throttled. On any failure we
 * fall back to a deterministic profile so the product always has something useful.
 */

import { glmChat, isGlmConfigured, type GlmMessage } from "../ai/glm";

const STABLECOINS = new Set(["USDT", "USDC", "USD", "BUSD", "DAI", "TUSD", "USDE", "FDUSD", "PYUSD"]);

export interface ProfileHolding {
  asset: string;
  usdValue: number;
  allocation: number; // percent of portfolio
  sources: string[];
}

export interface ProfileVenue {
  label: string; // exchange name or "<chain> wallet" — never an address
  usdValue: number;
}

export interface ProfileInput {
  totalUsdValue: number;
  exchangeCount: number;
  walletCount: number;
  holdings: ProfileHolding[];
  venues: ProfileVenue[];
  /** Pre-computed, sanitized per-venue trading analyses (markdown). */
  tradingDocs: string[];
  /** Pre-computed, sanitized per-venue fund-flow analyses (markdown). */
  fundFlowDocs: string[];
}

export interface InvestorProfileData {
  summary: string;
  tradingStyle: string;
  riskProfile: string;
  preferences: string[];
  behaviors: string[];
  agentGuidance: string[];
  generatedAt: string;
  source: "llm" | "deterministic";
}

const SYSTEM_PROMPT = `You are a senior crypto portfolio analyst. You receive a precomputed, factual summary of ONE user's crypto holdings and trading behavior. Write a sharp, specific INVESTOR PROFILE that an AI agent will load as context to advise this user.

Rules:
- Ground every claim in the provided facts. Never invent assets, numbers, or trades.
- If a section has no supporting data, say so briefly rather than guessing.
- Be concrete and concise. No generic filler, no hype.
- Do NOT give financial advice or price predictions.

Respond with ONLY a JSON object of this exact shape:
{
  "summary": string,        // 2-3 sentences capturing who this investor is
  "tradingStyle": string,   // 1-2 sentences on how they trade
  "riskProfile": string,    // 1-2 sentences on risk posture (concentration, cash buffer)
  "preferences": string[],  // 3-5 concrete bullets: favored assets / sectors / chains
  "behaviors": string[],    // 3-5 concrete observed patterns
  "agentGuidance": string[] // 3-5 bullets: how an AI agent should tailor help to THIS user
}`;

function formatUsd(value: number): string {
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value.toFixed(0)}`;
}

interface Concentration {
  top1: ProfileHolding | null;
  top3Pct: number;
  stablePct: number;
}

function concentration(holdings: ProfileHolding[]): Concentration {
  const sorted = [...holdings].sort((a, b) => b.usdValue - a.usdValue);
  const top3Pct = sorted.slice(0, 3).reduce((s, h) => s + h.allocation, 0);
  const stablePct = sorted
    .filter((h) => STABLECOINS.has(h.asset.toUpperCase()))
    .reduce((s, h) => s + h.allocation, 0);
  return { top1: sorted[0] ?? null, top3Pct, stablePct };
}

/** Build the sanitized facts markdown that is sent to the LLM. */
export function buildFactsMarkdown(input: ProfileInput): string {
  const { totalUsdValue, holdings, venues, exchangeCount, walletCount } = input;
  const c = concentration(holdings);
  const lines: string[] = [];

  const sourceParts: string[] = [];
  if (exchangeCount > 0) sourceParts.push(`${exchangeCount} exchange${exchangeCount > 1 ? "s" : ""}`);
  if (walletCount > 0) sourceParts.push(`${walletCount} wallet${walletCount > 1 ? "s" : ""}`);

  lines.push("# Portfolio");
  lines.push(`Total: ${formatUsd(totalUsdValue)}${sourceParts.length ? ` across ${sourceParts.join(" + ")}` : ""}`);

  const holdingStrs = [...holdings]
    .sort((a, b) => b.usdValue - a.usdValue)
    .slice(0, 15)
    .map((h) => `${h.asset} ${h.allocation.toFixed(1)}% (${formatUsd(h.usdValue)})`);
  if (holdingStrs.length) lines.push(`Holdings: ${holdingStrs.join(", ")}`);

  if (c.top1 && totalUsdValue > 0) {
    lines.push(
      `Concentration: top-1 ${c.top1.allocation.toFixed(1)}% (${c.top1.asset}), top-3 ${c.top3Pct.toFixed(1)}%, stablecoin ${c.stablePct.toFixed(1)}%`,
    );
  }

  if (venues.length && totalUsdValue > 0) {
    const venueStrs = [...venues]
      .sort((a, b) => b.usdValue - a.usdValue)
      .map((v) => `${v.label} ${((v.usdValue / totalUsdValue) * 100).toFixed(0)}%`);
    lines.push(`Venue split: ${venueStrs.join(", ")}`);
  }

  const trading = input.tradingDocs.filter((d) => d.trim());
  if (trading.length) {
    lines.push("");
    lines.push("# Trading");
    lines.push(trading.join("\n\n"));
  }

  const flows = input.fundFlowDocs.filter((d) => d.trim());
  if (flows.length) {
    lines.push("");
    lines.push("# Fund flow");
    lines.push(flows.join("\n\n"));
  }

  return lines.join("\n");
}

function asStringArray(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim())
    .slice(0, max);
}

function coerceProfile(raw: unknown, source: InvestorProfileData["source"]): InvestorProfileData {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const summary = typeof obj.summary === "string" ? obj.summary.trim() : "";
  const tradingStyle = typeof obj.tradingStyle === "string" ? obj.tradingStyle.trim() : "";
  const riskProfile = typeof obj.riskProfile === "string" ? obj.riskProfile.trim() : "";
  const preferences = asStringArray(obj.preferences, 6);
  const behaviors = asStringArray(obj.behaviors, 6);
  const agentGuidance = asStringArray(obj.agentGuidance, 6);

  if (!summary || preferences.length === 0 || agentGuidance.length === 0) {
    throw new Error("Incomplete profile");
  }

  return {
    summary,
    tradingStyle,
    riskProfile,
    preferences,
    behaviors,
    agentGuidance,
    generatedAt: new Date().toISOString(),
    source,
  };
}

/** Rule-based profile used when GLM is unavailable. Portfolio-shape oriented. */
export function deterministicProfile(input: ProfileInput): InvestorProfileData {
  const { holdings, totalUsdValue } = input;
  const c = concentration(holdings);
  const top = c.top1;

  const diversification =
    holdings.length <= 3 ? "highly concentrated" : holdings.length <= 8 ? "moderately diversified" : "broadly diversified";
  const cashPosture =
    c.stablePct < 5 ? "almost fully invested with a thin cash buffer" : c.stablePct > 40 ? "holding a large cash position" : "keeping a moderate cash buffer";

  const summary = top
    ? `A ${diversification} crypto investor anchored by ${top.asset} (${top.allocation.toFixed(0)}% of a ${formatUsd(totalUsdValue)} portfolio), ${cashPosture}.`
    : "No portfolio holdings detected yet — connect an exchange or wallet to build a profile.";

  const preferences: string[] = holdings
    .slice()
    .sort((a, b) => b.usdValue - a.usdValue)
    .slice(0, 5)
    .map((h) => `${h.asset} — ${h.allocation.toFixed(1)}% of portfolio`);

  const behaviors: string[] = [];
  if (top && top.allocation > 50) behaviors.push(`Heavy single-asset concentration in ${top.asset} (${top.allocation.toFixed(0)}%)`);
  if (c.top3Pct > 0) behaviors.push(`Top 3 assets account for ${c.top3Pct.toFixed(0)}% of holdings`);
  behaviors.push(`Stablecoin reserve at ${c.stablePct.toFixed(1)}% (${cashPosture})`);
  if (input.exchangeCount > 0 && input.walletCount > 0) behaviors.push("Uses both centralized exchanges and self-custody wallets");

  const agentGuidance: string[] = [
    top ? `Treat ${top.asset} as the core position when reasoning about this portfolio` : "Encourage connecting a source so advice can be personalized",
    c.stablePct < 5 ? "Flag the low cash buffer before suggesting new entries" : "Account for the existing cash buffer when discussing deployment",
    "See the Trading and Fund Flow sections below for behavioral detail",
  ];

  return {
    summary,
    tradingStyle: "Detailed trade-level style is in the Trading section below.",
    riskProfile: top && top.allocation > 50
      ? `Elevated concentration risk: ${top.allocation.toFixed(0)}% in a single asset, ${cashPosture}.`
      : `${diversification.charAt(0).toUpperCase()}${diversification.slice(1)} portfolio, ${cashPosture}.`,
    preferences: preferences.length ? preferences : ["No holdings yet"],
    behaviors,
    agentGuidance,
    generatedAt: new Date().toISOString(),
    source: "deterministic",
  };
}

/**
 * Generate the investor profile. Tries GLM; falls back to deterministic on any failure
 * (not configured, throttled, timeout, malformed output).
 */
export async function generateInvestorProfile(input: ProfileInput): Promise<InvestorProfileData> {
  if (input.holdings.length === 0) {
    return deterministicProfile(input);
  }
  if (!isGlmConfigured()) {
    return deterministicProfile(input);
  }

  const messages: GlmMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: buildFactsMarkdown(input) },
  ];

  try {
    const raw = await glmChat(messages, { json: true, maxTokens: 2048, temperature: 0.4, timeoutMs: 48_000 });
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }
    return coerceProfile(parsed, "llm");
  } catch (err) {
    console.error("[investor-profile] GLM generation failed, using deterministic fallback:", err instanceof Error ? err.message : "unknown");
    return deterministicProfile(input);
  }
}

/** Render the profile as the headline markdown section for MCP context. */
export function renderProfileMarkdown(profile: InvestorProfileData): string {
  const lines: string[] = [];
  lines.push("# Investor Profile");
  lines.push(`> ${profile.summary}`);
  lines.push("");
  if (profile.tradingStyle) {
    lines.push(`**Trading style:** ${profile.tradingStyle}`);
  }
  if (profile.riskProfile) {
    lines.push(`**Risk profile:** ${profile.riskProfile}`);
  }
  lines.push("");
  if (profile.preferences.length) {
    lines.push("## Preferences");
    for (const p of profile.preferences) lines.push(`- ${p}`);
    lines.push("");
  }
  if (profile.behaviors.length) {
    lines.push("## Behaviors");
    for (const b of profile.behaviors) lines.push(`- ${b}`);
    lines.push("");
  }
  if (profile.agentGuidance.length) {
    lines.push("## How to advise this user");
    for (const g of profile.agentGuidance) lines.push(`- ${g}`);
    lines.push("");
  }
  return lines.join("\n").trim();
}
