# MCP directory listings

**This is the wedge.** The MCP/AI-dev crowd is the audience that understands "context layer" instantly, and the directories are where they browse for servers. Getting listed everywhere is the highest-leverage, lowest-effort distribution you have — do this *first* (see [the runbook](README.md)), before the HN/Twitter push, so there's somewhere credible to land.

CryptoContext is a **remote (HTTP) MCP server** with Bearer-token auth, and it's also self-hostable (open source). Some directories assume stdio/npm servers — list it as remote/hosted where that option exists.

**Canonical facts to reuse:**

- **Name:** CryptoContext
- **Endpoint:** `https://app-rho-jet-70.vercel.app/api/mcp` (HTTP transport, JSON-RPC 2.0)
- **Auth:** `Authorization: Bearer <token>` (created in the dashboard)
- **Repo:** https://github.com/0xrikt/crypto-context
- **Tools:** `get_portfolio`, `get_context`
- **Tags:** crypto, finance, portfolio, trading, context, read-only, open-source

---

## One-liner (use everywhere a short description is asked)

```
Unify your crypto portfolio across every exchange and wallet into structured
context any AI agent can query over MCP — holdings, concentration, and how you
actually trade. Open source, read-only, $0 to run.
```

## Tagline (≤ 60 chars, for cards/titles)

```
Your crypto portfolio as context for any AI agent
```

---

## Standard listing description (mcp.so, Glama, PulseMCP, Smithery "about")

```
CryptoContext is an MCP server that gives any AI agent your real crypto
portfolio. It connects to 10 exchanges (Binance, OKX, Bybit, Coinbase,
Kraken, Bitget, KuCoin, Gate.io, HTX, MEXC) via read-only API keys and to
EVM wallets, then unifies everything — holdings, allocation, concentration,
trading patterns, and fund flows — into clean, structured context.

Instead of pasting positions into a chat by hand, connect once and ask your
agent "what's wrong with my portfolio?" — it answers about YOUR holdings,
across every venue at once.

Design choices:
• Deterministic context generation (no LLM) — reproducible, private, free.
• Read-only by design — no order/withdraw code paths; exchange-side keys
  enforce it.
• Open source and self-hostable — hold your own encryption key.
• AES-256-GCM at rest; MCP tokens stored as SHA-256 hashes.

Tools: get_portfolio (holdings + USD value + allocation %), get_context
(full investment context: portfolio + concentration + trading profile +
fund flows).
```

## Tools description (for directories that list tools)

```
get_portfolio — Current holdings across all connected venues with USD values
and allocation %. Optional asset filter.

get_context — Full investment context for a query: unified portfolio,
concentration analysis, trading profile (DCA cadence, buy/sell ratio), and
fund-flow patterns. The one call that makes an agent understand your book.
```

## Client config snippet (directories that show install/config)

```json
{
  "mcpServers": {
    "crypto-context": {
      "url": "https://app-rho-jet-70.vercel.app/api/mcp",
      "headers": { "Authorization": "Bearer YOUR_TOKEN" }
    }
  }
}
```

CLI form:

```bash
claude mcp add --transport http crypto-ctx \
  https://app-rho-jet-70.vercel.app/api/mcp \
  --header "Authorization: Bearer YOUR_TOKEN"
```

---

## Per-directory notes

### mcp.so
Largest directory; submit via their "Submit" flow. Use the standard description + tagline + tools. Category: Finance / Crypto. Link both repo and live endpoint.

### Glama (glama.ai/mcp/servers)
Indexes GitHub repos and scores them. It largely **auto-ingests from the repo**, so the README + good repo metadata (description, topics) do most of the work — make sure the GitHub repo's About blurb and topics are set (see below). You can also submit manually.

### PulseMCP (pulsemcp.com)
Curated, editorial tone. They like a clear "what problem does this solve." Lead with the "AI can't see your bags" framing. Mark as remote server.

### Smithery (smithery.ai)
Geared toward installable servers; supports remote. Provide the config snippet. If they require a `smithery.yaml` or similar, that's a small repo addition — defer unless they ask.

### Awesome-MCP-Servers (the GitHub list — punqjj or appcypher fork)
This is a PR, not a form. Open the repo, find the right category (Finance & Fintech / Crypto), and add **one alphabetically-placed line**. Exact entry to submit:

```markdown
- [CryptoContext](https://github.com/0xrikt/crypto-context) 🏎️ ☁️ - Unify your crypto portfolio across every exchange and wallet into structured context any AI agent can query — holdings, concentration, and how you actually trade. Open source, read-only.
```

(Check that repo's legend for the right emoji: 🏎️ often = TypeScript/Deno/Go-fast, ☁️ = cloud/remote service. Match whatever convention the specific list uses — read its header before submitting. Keep the description to one line; long entries get rejected.)

---

## GitHub repo metadata (do this — Glama and humans both read it)

Set on the repo so directories auto-ingest cleanly:

- **About / description:**
  `Give any AI agent your real crypto portfolio via MCP. Unifies every exchange + wallet into structured context. Open source, read-only, $0.`
- **Topics:** `mcp`, `model-context-protocol`, `crypto`, `portfolio`, `ai-agents`, `claude`, `cursor`, `ccxt`, `defi`, `nextjs`, `open-source`
- **Website:** the live demo URL.

Commands (gh CLI) are in [the runbook](README.md).
