/**
 * POST /api/exchange/connect
 * Connect a new exchange with read-only API key.
 * Validates the key, stores encrypted.
 *
 * Performance: verifyReadOnly alone takes ~2s (loadMarkets + fetchBalance).
 * Portfolio fetch is deferred to the dashboard sync button to avoid
 * hitting Vercel's 10s function timeout with ticker calls per asset.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyReadOnly, PASSPHRASE_EXCHANGES, SUPPORTED_EXCHANGES, type SupportedExchange } from "@/lib/exchange";
import { saveConnection } from "@/lib/store";
import {
  checkRateLimit,
  RATE_LIMITS,
  getClientIp,
  validateApiKey,
  validateSecret,
  validatePassphrase,
  validateLabel,
} from "@/lib/security";

/** Extend Vercel function timeout to 30s for exchanges with many markets */
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = getClientIp(request.headers);
  const rateLimit = checkRateLimit(
    ip,
    "exchange/connect",
    RATE_LIMITS.exchangeConnect.maxRequests,
    RATE_LIMITS.exchangeConnect.windowMs
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse body
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { exchange, apiKey, secret, password, label } = body as {
    exchange: string;
    apiKey: string;
    secret: string;
    password?: string;
    label?: string;
  };

  // Validate exchange
  if (!exchange || !SUPPORTED_EXCHANGES.includes(exchange as SupportedExchange)) {
    return NextResponse.json(
      { error: "Unsupported exchange. Please select a valid exchange." },
      { status: 400 }
    );
  }

  const exchangeId = exchange as SupportedExchange;

  // Validate API key
  const keyError = validateApiKey(apiKey);
  if (keyError) {
    return NextResponse.json({ error: keyError }, { status: 400 });
  }

  // Validate secret
  const secretError = validateSecret(secret);
  if (secretError) {
    return NextResponse.json({ error: secretError }, { status: 400 });
  }

  // Validate passphrase for exchanges that require it
  if (PASSPHRASE_EXCHANGES.includes(exchangeId)) {
    if (!password) {
      return NextResponse.json(
        { error: `${exchangeId.toUpperCase()} requires a passphrase.` },
        { status: 400 }
      );
    }
    const passError = validatePassphrase(password);
    if (passError) {
      return NextResponse.json({ error: passError }, { status: 400 });
    }
  }

  // Validate label
  if (label) {
    const labelError = validateLabel(label);
    if (labelError) {
      return NextResponse.json({ error: labelError }, { status: 400 });
    }
  }

  // Step 1: Verify key is valid and read-only
  const verification = await verifyReadOnly(exchangeId, {
    apiKey: apiKey.trim(),
    secret: secret.trim(),
    password: password?.trim(),
  });

  if (!verification.valid) {
    return NextResponse.json(
      { error: verification.error ?? "Invalid API key" },
      { status: 400 }
    );
  }

  // Step 2: Save encrypted connection
  try {
    const connectionId = await saveConnection(
      user.id,
      exchangeId,
      { apiKey: apiKey.trim(), secret: secret.trim(), password: password?.trim() },
      label?.trim() ?? `${exchangeId} account`
    );

    // Portfolio fetch is deferred — the dashboard will trigger it via
    // the "Sync now" button or on page load. This keeps the connect
    // endpoint fast and avoids Vercel timeout with large portfolios.
    return NextResponse.json({
      success: true,
      connectionId,
      portfolio: null,
      message: "Exchange connected successfully. Syncing portfolio...",
    });
  } catch (err) {
    console.error(`[connect] Failed to save connection: ${err instanceof Error ? err.message : "unknown"}`);
    return NextResponse.json(
      { error: "Failed to save connection. Please try again." },
      { status: 500 }
    );
  }
}
