/**
 * MCP HTTP Endpoint.
 *
 * This is a simplified MCP-compatible JSON-RPC handler.
 * AI agents call this endpoint to get user crypto context.
 *
 * Auth: Bearer token in Authorization header.
 */

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createServerClient } from "@supabase/ssr";
import { decrypt } from "@/lib/crypto";
import { fetchPortfolio, type SupportedExchange, type ExchangeCredentials, type PortfolioSnapshot } from "@/lib/exchange";
import { generatePortfolioContext } from "@/lib/context";
import { checkRateLimit, RATE_LIMITS, getClientIp } from "@/lib/security";

// Use service role for MCP endpoint (no cookie auth needed)
function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  );
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

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
      "Get relevant crypto context for a query. Analyzes the query and returns the most relevant slices of the user's portfolio, trading profile, and market position.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The question or topic to get context for",
        },
      },
      required: ["query"],
    },
  },
];

async function authenticateToken(
  token: string
): Promise<{ userId: string; permissionLevel: string } | null> {
  const supabase = createServiceClient();
  const hash = hashToken(token);

  const { data } = await supabase
    .from("mcp_tokens")
    .select("user_id, permission_level")
    .eq("token_hash", hash)
    .eq("revoked", false)
    .single();

  if (!data) return null;
  return {
    userId: data.user_id as string,
    permissionLevel: data.permission_level as string,
  };
}

async function fetchAllPortfolios(
  userId: string
): Promise<PortfolioSnapshot[]> {
  const supabase = createServiceClient();

  const { data: connections } = await supabase
    .from("connections")
    .select("*")
    .eq("user_id", userId);

  if (!connections || connections.length === 0) return [];

  const snapshots: PortfolioSnapshot[] = [];

  for (const conn of connections) {
    try {
      const credentials: ExchangeCredentials = {
        apiKey: decrypt(conn.encrypted_key),
        secret: decrypt(conn.encrypted_secret),
        password: conn.encrypted_password
          ? decrypt(conn.encrypted_password)
          : undefined,
      };

      const snapshot = await fetchPortfolio(
        conn.exchange as SupportedExchange,
        credentials
      );
      snapshots.push(snapshot);
    } catch (err) {
      // Log only exchange name and error type — NEVER log credentials
      console.error(
        `[MCP] Portfolio fetch failed: exchange=${conn.exchange}`,
        err instanceof Error ? err.message : "unknown error"
      );
    }
  }

  return snapshots;
}

function handleListTools(): McpTool[] {
  return TOOLS;
}

async function handleCallTool(
  toolName: string,
  args: Record<string, unknown>,
  userId: string,
  permissionLevel: string
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const snapshots = await fetchAllPortfolios(userId);
  const portfolioMd = generatePortfolioContext(snapshots);

  if (toolName === "get_portfolio") {
    const asset = args.asset as string | undefined;

    let result = portfolioMd;

    // Filter by asset if specified
    if (asset) {
      const lines = portfolioMd.split("\n");
      const filtered = lines.filter(
        (line) =>
          !line.startsWith("|") ||
          line.includes("Asset") ||
          line.includes("---") ||
          line.toUpperCase().includes(asset.toUpperCase())
      );
      result = filtered.join("\n");
    }

    // Anonymize if needed
    if (permissionLevel === "anonymized") {
      result = result.replace(/\$[\d,]+/g, "$***");
    }

    return { content: [{ type: "text", text: result }] };
  }

  if (toolName === "get_context") {
    // For V1, return full portfolio context for any query.
    // V2 will add semantic retrieval based on the query.
    let result = portfolioMd;

    if (permissionLevel === "anonymized") {
      result = result.replace(/\$[\d,]+/g, "$***");
    }

    return { content: [{ type: "text", text: result }] };
  }

  return {
    content: [{ type: "text", text: `Unknown tool: ${toolName}` }],
  };
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = getClientIp(request.headers);
  const rateLimit = checkRateLimit(
    ip,
    "mcp",
    RATE_LIMITS.mcp.maxRequests,
    RATE_LIMITS.mcp.windowMs
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: { code: -32000, message: "Rate limit exceeded" },
        id: null,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  // Authenticate
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: { code: -32000, message: "Missing or invalid Authorization header" },
        id: null,
      },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7);
  if (!token || token.length > 256) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: { code: -32000, message: "Invalid token format" },
        id: null,
      },
      { status: 401 }
    );
  }

  const auth = await authenticateToken(token);

  if (!auth) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: { code: -32000, message: "Invalid or revoked token" },
        id: null,
      },
      { status: 401 }
    );
  }

  // Parse JSON-RPC request
  let body: McpRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: { code: -32700, message: "Parse error" },
        id: null,
      },
      { status: 400 }
    );
  }

  const { method, params, id } = body;

  // Handle MCP methods
  try {
    if (method === "initialize") {
      return NextResponse.json({
        jsonrpc: "2.0",
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: {
            name: "crypto-context",
            version: "0.1.0",
          },
        },
        id,
      });
    }

    if (method === "tools/list") {
      return NextResponse.json({
        jsonrpc: "2.0",
        result: { tools: handleListTools() },
        id,
      });
    }

    if (method === "tools/call") {
      const toolName = (params?.name as string) ?? "";
      const toolArgs = (params?.arguments as Record<string, unknown>) ?? {};
      const result = await handleCallTool(
        toolName,
        toolArgs,
        auth.userId,
        auth.permissionLevel
      );
      return NextResponse.json({ jsonrpc: "2.0", result, id });
    }

    // Ping/notifications
    if (method === "notifications/initialized" || method === "ping") {
      return NextResponse.json({ jsonrpc: "2.0", result: {}, id });
    }

    return NextResponse.json({
      jsonrpc: "2.0",
      error: { code: -32601, message: `Method not found: ${method}` },
      id,
    });
  } catch (err) {
    // Log error server-side without leaking details
    console.error("[MCP] Internal error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({
      jsonrpc: "2.0",
      error: {
        code: -32603,
        message: "Internal server error",
      },
      id,
    });
  }
}

// MCP discovery endpoint (GET)
export async function GET() {
  return NextResponse.json({
    name: "crypto-context",
    version: "0.1.0",
    description:
      "Personal crypto context layer. Provides your portfolio, trading profile, and investment thesis to AI agents.",
    protocol: "mcp",
    tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
  });
}
