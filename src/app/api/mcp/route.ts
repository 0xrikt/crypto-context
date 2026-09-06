/**
 * MCP HTTP Endpoint.
 *
 * A simplified MCP-compatible JSON-RPC handler. AI agents call this endpoint to
 * get the user's crypto context. Auth: Bearer token in the Authorization header.
 *
 * The actual context assembly lives in lib/context-assembler.ts, shared with the
 * /api/context/full export endpoint so MCP and copy-paste/skill never drift.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  authenticateMcpToken,
  assemblePortfolioMd,
  assembleFullContext,
  applyPermission,
} from "@/lib/context-assembler";
import { checkRateLimit, RATE_LIMITS, getClientIp } from "@/lib/security";

/** MCP fetches across all connected exchanges — needs more time. */
export const maxDuration = 60;

interface McpRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

interface McpTool {
  name: string;
  description: string;
  inputSchema: object;
}

const TOOLS: McpTool[] = [
  {
    name: "get_portfolio",
    description:
      "Get the user's current crypto portfolio. Returns holdings across all connected exchanges with asset names, amounts, USD values, and allocation percentages.",
    inputSchema: {
      type: "object",
      properties: {
        asset: {
          type: "string",
          description: "Optional: filter by specific asset (e.g. 'BTC', 'ETH')",
        },
      },
    },
  },
  {
    name: "get_context",
    description:
      "Get the user's full crypto investor profile. Returns the holistic investor profile, the user's own strategy notes, the current portfolio snapshot, trading patterns and style analysis, and fund flow (deposits/withdrawals). All dimensions are included by default.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Optional: the question or topic you need context for",
        },
      },
    },
  },
];

function handleListTools(): McpTool[] {
  return TOOLS;
}

async function handleCallTool(
  toolName: string,
  args: Record<string, unknown>,
  userId: string,
  permissionLevel: string,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  if (toolName === "get_portfolio") {
    let result = await assemblePortfolioMd(userId);

    const asset = args.asset as string | undefined;
    if (asset) {
      const lines = result.split("\n");
      let inHoldings = false;
      result = lines
        .filter((line) => {
          if (line.startsWith("## ")) inHoldings = line === "## Holdings";
          return !inHoldings || !line.startsWith("|") || line.startsWith("| Asset ") ||
            line.startsWith("|---") || line.split("|")[1]?.trim().toUpperCase() === asset.toUpperCase();
        })
        .join("\n");
    }

    return { content: [{ type: "text", text: applyPermission(result, permissionLevel) }] };
  }

  if (toolName === "get_context") {
    const result = await (permissionLevel === "portfolio_only" ? assemblePortfolioMd(userId) : assembleFullContext(userId));
    return { content: [{ type: "text", text: applyPermission(result, permissionLevel) }] };
  }

  return { content: [{ type: "text", text: `Unknown tool: ${toolName}` }] };
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  }
  // Rate limiting
  const ip = getClientIp(request.headers);
  const rateLimit = checkRateLimit(ip, "mcp", RATE_LIMITS.mcp.maxRequests, RATE_LIMITS.mcp.windowMs);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { jsonrpc: "2.0", error: { code: -32000, message: "Rate limit exceeded" }, id: null },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) },
      },
    );
  }

  // Authenticate
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { jsonrpc: "2.0", error: { code: -32000, message: "Missing or invalid Authorization header" }, id: null },
      { status: 401 },
    );
  }

  const token = authHeader.slice(7);
  if (!token || token.length > 256) {
    return NextResponse.json(
      { jsonrpc: "2.0", error: { code: -32000, message: "Invalid token format" }, id: null },
      { status: 401 },
    );
  }

  const auth = await authenticateMcpToken(token);
  if (!auth) {
    return NextResponse.json(
      { jsonrpc: "2.0", error: { code: -32000, message: "Invalid or revoked token" }, id: null },
      { status: 401 },
    );
  }

  // Parse JSON-RPC request
  let body: McpRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { jsonrpc: "2.0", error: { code: -32700, message: "Parse error" }, id: null },
      { status: 400 },
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body) || body.jsonrpc !== "2.0" ||
      typeof body.method !== "string" ||
      (body.id !== undefined && typeof body.id !== "string" && typeof body.id !== "number") ||
      (body.params !== undefined && (!body.params || typeof body.params !== "object" || Array.isArray(body.params)))) {
    return NextResponse.json({jsonrpc:"2.0",error:{code:-32600,message:"Invalid request"},id:null},{status:400});
  }
  const { method, params, id } = body;
  if (id === undefined) {
    return new NextResponse(null, { status: 202 });
  }

  try {
    if (method === "initialize") {
      return NextResponse.json({
        jsonrpc: "2.0",
        result: {
          protocolVersion: "2025-03-26",
          capabilities: { tools: {} },
          serverInfo: { name: "crypto-context", version: "0.1.1" },
        },
        id,
      });
    }

    if (method === "tools/list") {
      return NextResponse.json({ jsonrpc: "2.0", result: { tools: handleListTools() }, id });
    }

    if (method === "tools/call") {
      const toolName = (params?.name as string) ?? "";
      const toolArgs = (params?.arguments as Record<string, unknown>) ?? {};
      if (!TOOLS.some(t => t.name === toolName) || !toolArgs || typeof toolArgs !== "object" || Array.isArray(toolArgs) ||
          (toolArgs.asset !== undefined && (typeof toolArgs.asset !== "string" || toolArgs.asset.length > 32)) ||
          (toolArgs.query !== undefined && (typeof toolArgs.query !== "string" || toolArgs.query.length > 2000))) {
        return NextResponse.json({jsonrpc:"2.0",error:{code:-32602,message:"Invalid tool or arguments"},id});
      }
      const result = await handleCallTool(toolName, toolArgs, auth.userId, auth.permissionLevel);
      return NextResponse.json({ jsonrpc: "2.0", result, id });
    }

    if (method === "notifications/initialized" || method === "ping") {
      return NextResponse.json({ jsonrpc: "2.0", result: {}, id });
    }

    return NextResponse.json({
      jsonrpc: "2.0",
      error: { code: -32601, message: `Method not found: ${method}` },
      id,
    });
  } catch (err) {
    console.error("[MCP] Internal error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({
      jsonrpc: "2.0",
      error: { code: -32603, message: "Internal server error" },
      id,
    });
  }
}

// MCP discovery endpoint (GET)
export async function GET(request: NextRequest) {
  if (request.headers.get("accept")?.includes("text/event-stream")) {
    return new NextResponse(null, {status:405, headers:{Allow:"POST"}});
  }
  return NextResponse.json({
    name: "crypto-context",
    version: "0.1.1",
    description:
      "Personal crypto context layer. Provides your portfolio, investor profile, strategy notes, and trading patterns to AI agents.",
    protocol: "mcp",
    tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
  });
}
