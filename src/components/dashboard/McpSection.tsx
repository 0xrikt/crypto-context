"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { McpToken } from "./types";
import {
  Badge,
  Button,
  Card,
  CopyButton,
  EmptyState,
  Field,
  Input,
  Select,
  SectionHeader,
} from "@/components/ui";
import { cn } from "@/lib/cn";

interface Props {
  tokens: McpToken[];
  hasConnections: boolean;
  onGenerateToken: (name: string, permission: string) => Promise<string | null>;
  onRevokeToken: (id: string) => void;
}

const PERMISSION_LABELS: Record<string, string> = {
  full: "Full access",
  portfolio_only: "Portfolio only",
  anonymized: "Anonymized",
};

function claudeCommand(origin: string, token: string): string {
  return `claude mcp add --transport http crypto-ctx ${origin}/api/mcp --header "Authorization: Bearer ${token}"`;
}

function cursorConfig(origin: string, token: string): string {
  return JSON.stringify(
    {
      mcpServers: {
        "crypto-ctx": {
          url: `${origin}/api/mcp`,
          headers: { Authorization: `Bearer ${token}` },
        },
      },
    },
    null,
    2
  );
}

const KeyIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
  </svg>
);

const PlusIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

/** Per-client setup snippets shown right after a token is generated. */
function ClientSnippets({ origin, token }: { origin: string; token: string }) {
  const [client, setClient] = useState<"claude" | "cursor">("claude");
  const snippet = client === "claude" ? claudeCommand(origin, token) : cursorConfig(origin, token);

  return (
    <div className="code-block rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200">
        <div className="flex items-center gap-1">
          {(["claude", "cursor"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setClient(c)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition",
                client === c ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-700"
              )}
            >
              {c === "claude" ? "Claude Code" : "Cursor"}
            </button>
          ))}
        </div>
        <CopyButton value={snippet} variant="icon" />
      </div>
      <pre className="p-4 font-mono text-xs sm:text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
        {client === "claude" ? (
          <>
            <span className="text-emerald-600">$ </span>
            {snippet}
          </>
        ) : (
          snippet
        )}
      </pre>
    </div>
  );
}

function TokenReveal({
  token,
  origin,
  onDone,
}: {
  token: string;
  origin: string;
  onDone: () => void;
}) {
  return (
    <div className="space-y-3">
      <Card className="p-4 border-emerald-300 space-y-3">
        <div className="flex items-center gap-2 text-emerald-700">
          <span className="text-emerald-600">{KeyIcon}</span>
          <span className="text-xs font-medium">Copy this token now — it won&apos;t be shown again</span>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 min-w-0 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg break-all font-mono">
            {token}
          </code>
          <CopyButton value={token} variant="icon" />
        </div>
      </Card>

      <ClientSnippets origin={origin} token={token} />

      <Button variant="ghost" size="sm" onClick={onDone}>
        Done
      </Button>
    </div>
  );
}

export function McpSection({ tokens, hasConnections, onGenerateToken, onRevokeToken }: Props) {
  const [origin, setOrigin] = useState("https://your-app.vercel.app");
  useEffect(() => setOrigin(window.location.origin), []);

  const [newToken, setNewToken] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [tokenName, setTokenName] = useState("Claude Code");
  const [tokenPermission, setTokenPermission] = useState("full");
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const token = await onGenerateToken(tokenName, tokenPermission);
      if (token) {
        setNewToken(token);
        setShowForm(false);
      }
    } finally {
      setGenerating(false);
    }
  }

  const idle = !newToken && !showForm;
  const showHeaderAction = idle && hasConnections && tokens.length > 0;

  return (
    <section>
      <SectionHeader
        title="MCP Connection"
        description="Connect Claude, Cursor, or any MCP-aware agent to your portfolio context"
        action={
          showHeaderAction && (
            <Button size="sm" leftIcon={PlusIcon} onClick={() => setShowForm(true)}>
              New token
            </Button>
          )
        }
      />

      {newToken ? (
        <TokenReveal token={newToken} origin={origin} onDone={() => setNewToken("")} />
      ) : showForm ? (
        <Card className="p-5 space-y-4">
          <Field label="Token name">
            <Input
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              placeholder="e.g. Claude Code, Cursor, My Agent"
            />
          </Field>
          <Field label="Permission level">
            <Select value={tokenPermission} onChange={(e) => setTokenPermission(e.target.value)}>
              <option value="full">Full — all portfolio data with USD values</option>
              <option value="portfolio_only">Portfolio only — holdings without context</option>
              <option value="anonymized">Anonymized — hide USD values</option>
            </Select>
          </Field>
          <div className="flex items-center gap-3">
            <Button onClick={handleGenerate} loading={generating} disabled={!tokenName.trim()}>
              Generate token
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      ) : !hasConnections ? (
        <EmptyState
          icon={KeyIcon}
          title="Connect a source first"
          description="Add an exchange or wallet before creating an MCP token — your agents need data to read."
          action={
            <Link href="/dashboard/sources">
              <Button>Go to Data Sources</Button>
            </Link>
          }
        />
      ) : tokens.length === 0 ? (
        <EmptyState
          icon={KeyIcon}
          title="No MCP tokens yet"
          description="Create a token to connect Claude, Cursor, or any agent. You'll get a one-line setup command."
          action={<Button onClick={() => setShowForm(true)}>Create your first token</Button>}
        />
      ) : null}

      {/* Existing tokens */}
      {!newToken && tokens.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Active tokens</h3>
          <div className="space-y-2">
            {tokens.map((token) => (
              <Card
                key={token.id}
                className={cn("p-3.5 flex items-center justify-between group", token.revoked && "opacity-60")}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
                    {KeyIcon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900 truncate">{token.name}</span>
                      <Badge tone={token.revoked ? "gray" : "emerald"}>
                        {PERMISSION_LABELS[token.permission_level] ?? token.permission_level}
                      </Badge>
                      {token.revoked && <Badge tone="red">Revoked</Badge>}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Created {new Date(token.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {!token.revoked && (
                  <button
                    onClick={() => onRevokeToken(token.id)}
                    className="text-xs text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 flex-shrink-0"
                  >
                    Revoke
                  </button>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
