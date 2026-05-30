/**
 * Investor-profile endpoint.
 *
 * POST  — (re)generate the holistic profile from client-passed portfolio aggregates
 *         + server-read trading/fund-flow context docs, then cache it. The heavy
 *         lifting (the GLM call) lives here so MCP reads stay instant.
 * GET   — return the cached profile (null when not generated / table not provisioned).
 *
 * Privacy: only aggregated, derived facts reach the LLM — never keys, never addresses.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getContextDocuments, upsertInvestorProfile, getInvestorProfile } from "@/lib/store";
import {
  generateInvestorProfile,
  type ProfileInput,
  type ProfileHolding,
  type ProfileVenue,
} from "@/lib/generators/investor-profile";

/** GLM (free tier) can take ~45s; give the whole request room. */
export const maxDuration = 60;

function toFiniteNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function parseHoldings(value: unknown): ProfileHolding[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 100)
    .map((h): ProfileHolding | null => {
      if (!h || typeof h !== "object") return null;
      const obj = h as Record<string, unknown>;
      const asset = typeof obj.asset === "string" ? obj.asset.slice(0, 32) : "";
      if (!asset) return null;
      return {
        asset,
        usdValue: toFiniteNumber(obj.usdValue),
        allocation: toFiniteNumber(obj.allocation),
        sources: Array.isArray(obj.sources)
          ? obj.sources.filter((s): s is string => typeof s === "string").slice(0, 12)
          : [],
      };
    })
    .filter((h): h is ProfileHolding => h !== null);
}

function parseVenues(value: unknown): ProfileVenue[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 40)
    .map((v): ProfileVenue | null => {
      if (!v || typeof v !== "object") return null;
      const obj = v as Record<string, unknown>;
      const label = typeof obj.label === "string" ? obj.label.slice(0, 48) : "";
      if (!label) return null;
      return { label, usdValue: toFiniteNumber(obj.usdValue) };
    })
    .filter((v): v is ProfileVenue => v !== null);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const holdings = parseHoldings(body.holdings);
  const venues = parseVenues(body.venues);

  // Pull the per-venue trading / fund-flow analyses we already computed during sync.
  const docs = await getContextDocuments(user.id);
  const tradingDocs = docs.filter((d) => d.dimension === "trading_profile").map((d) => d.content);
  const fundFlowDocs = docs.filter((d) => d.dimension === "fund_flow").map((d) => d.content);

  const input: ProfileInput = {
    totalUsdValue: toFiniteNumber(body.totalUsdValue),
    exchangeCount: Math.max(0, Math.trunc(toFiniteNumber(body.exchangeCount))),
    walletCount: Math.max(0, Math.trunc(toFiniteNumber(body.walletCount))),
    holdings,
    venues,
    tradingDocs,
    fundFlowDocs,
  };

  const profile = await generateInvestorProfile(input);

  // Persist for MCP. If the table isn't provisioned yet, still return the fresh
  // profile so the dashboard shows value — it just won't survive a reload / reach MCP.
  let persisted = true;
  try {
    await upsertInvestorProfile(user.id, profile);
  } catch (err) {
    persisted = false;
    console.error(
      "[api/profile] persist failed (table missing?):",
      err instanceof Error ? err.message : "unknown",
    );
  }

  return NextResponse.json({ profile, persisted });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getInvestorProfile(user.id);
  return NextResponse.json({ profile });
}
