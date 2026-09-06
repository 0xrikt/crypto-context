/**
 * GET /api/context/full — the user's full assembled context as markdown.
 *
 * Dual auth: a session cookie (the dashboard "copy / use anywhere" UI) OR an
 * `Authorization: Bearer <mcp_token>` (external skills, curl, ChatGPT, etc.).
 * Returns the SAME assembly as the MCP get_context tool (shared assembler), so
 * MCP, copy-paste, and the skill never drift.
 *
 * Responds with `text/markdown` so a skill can `curl` it and paste directly.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { authenticateMcpToken, assembleFullContext, assemblePortfolioMd, applyPermission } from "@/lib/context-assembler";
import { checkRateLimit, RATE_LIMITS, getClientIp } from "@/lib/security";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const rateLimit = checkRateLimit(ip, "context-full", RATE_LIMITS.mcp.maxRequests, RATE_LIMITS.mcp.windowMs);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
    );
  }

  let userId: string | null = null;
  let permissionLevel = "full";

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    // External path: MCP token.
    const token = authHeader.slice(7);
    const auth = token && token.length <= 256 ? await authenticateMcpToken(token) : null;
    if (!auth) {
      return NextResponse.json({ error: "Invalid or revoked token" }, { status: 401 });
    }
    userId = auth.userId;
    permissionLevel = auth.permissionLevel;
  } else {
    // Dashboard path: session cookie. Owner sees their own full data.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = user.id;
  }

  try {
    const markdown = applyPermission(await (permissionLevel === "portfolio_only" ? assemblePortfolioMd(userId) : assembleFullContext(userId)), permissionLevel);
    return new NextResponse(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[api/context/full] assembly failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Failed to assemble context" }, { status: 500 });
  }
}
