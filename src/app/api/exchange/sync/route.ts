import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncExchangeContext } from "@/lib/sync";
import { upsertContextDocument } from "@/lib/store";
import { checkRateLimit, RATE_LIMITS, getClientIp } from "@/lib/security";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const rateLimit = checkRateLimit(ip, "exchange/sync", RATE_LIMITS.general.maxRequests, RATE_LIMITS.general.windowMs);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { connectionId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.connectionId || typeof body.connectionId !== "string") {
    return NextResponse.json({ error: "connectionId is required" }, { status: 400 });
  }

  const { data: connection } = await supabase
    .from("connections")
    .select("id, exchange, encrypted_key, encrypted_secret, encrypted_password")
    .eq("id", body.connectionId)
    .eq("user_id", user.id)
    .single();

  if (!connection) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }

  try {
    const result = await syncExchangeContext(connection, user.id, upsertContextDocument);

    return NextResponse.json({
      success: true,
      result: {
        exchange: result.exchange,
        tradingProfile: result.tradingProfile,
        fundFlow: result.fundFlow,
        capabilities: result.capabilities,
        durationMs: result.durationMs,
      },
    });
  } catch (err) {
    console.error("[sync] Fatal error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
