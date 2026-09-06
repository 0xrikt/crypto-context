/**
 * MCP Token management.
 * POST: Create a new token
 * GET: List user's tokens
 * PATCH: Revoke a token
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { randomBytes, createHash } from "crypto";
import {
  checkRateLimit,
  RATE_LIMITS,
  getClientIp,
  validateTokenName,
  validateUUID,
} from "@/lib/security";

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

const VALID_PERMISSIONS = ["full", "portfolio_only", "anonymized"] as const;
type PermissionLevel = (typeof VALID_PERMISSIONS)[number];

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = getClientIp(request.headers);
  const rateLimit = checkRateLimit(
    ip,
    "mcp/tokens",
    RATE_LIMITS.tokenGenerate.maxRequests,
    RATE_LIMITS.tokenGenerate.windowMs
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Invalid request body");
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, permissionLevel } = body as {
    name: string;
    permissionLevel?: string;
  };

  // Validate token name
  const nameError = validateTokenName(name);
  if (nameError) {
    return NextResponse.json({ error: nameError }, { status: 400 });
  }

  // Validate permission level
  const level = (permissionLevel ?? "full") as PermissionLevel;
  if (!VALID_PERMISSIONS.includes(level)) {
    return NextResponse.json(
      { error: "Invalid permission level" },
      { status: 400 }
    );
  }

  // Generate a random token
  const rawToken = `cctx_${randomBytes(32).toString("hex")}`;
  const hash = hashToken(rawToken);

  const { error } = await supabase.from("mcp_tokens").insert({
    user_id: user.id,
    token_hash: hash,
    name: name.trim(),
    permission_level: level,
  });

  if (error) {
    console.error("[tokens] Failed to create token:", error.message);
    return NextResponse.json(
      { error: "Failed to create token. Please try again." },
      { status: 500 }
    );
  }

  // Return the raw token ONCE — it won't be shown again
  return NextResponse.json({
    token: rawToken,
    name: name.trim(),
    permissionLevel: level,
    message: "Copy this token now — it won't be shown again.",
  });
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const rateLimit = checkRateLimit(
    ip,
    "tokens/list",
    RATE_LIMITS.general.maxRequests,
    RATE_LIMITS.general.windowMs,
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) },
      },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("mcp_tokens")
    .select("id, name, permission_level, revoked, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[tokens] Failed to list tokens:", error.message);
    return NextResponse.json(
      { error: "Failed to load tokens" },
      { status: 500 }
    );
  }

  return NextResponse.json({ tokens: data });
}

export async function PATCH(request: NextRequest) {
  // Authenticate via session cookie
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Invalid request body");
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const tokenId = body.id as string;
  const idError = validateUUID(tokenId);
  if (idError) {
    return NextResponse.json({ error: idError }, { status: 400 });
  }

  // Use service client to bypass RLS for update (user_id filter ensures ownership)
  const serviceClient = createServiceClient();
  const { error } = await serviceClient
    .from("mcp_tokens")
    .update({ revoked: true })
    .eq("id", tokenId)
    .eq("user_id", user.id);

  if (error) {
    console.error("[tokens] Failed to revoke token:", error.message);
    return NextResponse.json(
      { error: "Failed to revoke token" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
