# CryptoContext

**Your AI gives generic advice because it can't see your bags.**

CryptoContext unifies your entire crypto footprint — every exchange, every wallet, plus *how* you trade — into one structured context that any AI agent can query over [MCP](https://modelcontextprotocol.io). Connect once, and Claude, Cursor, ChatGPT, or any MCP-compatible agent stops guessing and starts reasoning about your *actual* portfolio.

> **Not your context, not your AI.** Open source, MCP-native, runs for $0. Point it at any agent you choose — your context comes with you.

**Live demo**: https://app-rho-jet-70.vercel.app · **Security**: [SECURITY.md](SECURITY.md) · **License**: [MIT](LICENSE)

---

## The problem

Your money is scattered across Binance, a Bybit account, a cold wallet, and a Solana address. No AI knows what you actually hold, so every "should I rebalance?" answer is a generic textbook reply. Pasting positions into a chat by hand is tedious, instantly stale, and still misses how you trade.

## What it does

Once connected, your agent can answer questions like *"be honest, what's wrong with my portfolio?"* with specifics:

> Your conviction and your attention are in different places — BTC + ETH are 70% of your book, but 11 of your last 14 trades were memes. Stablecoins are 3%, so you have no dry powder for the dips you historically buy. Your weekly ETH DCA is disciplined, though — you're in accumulation mode.

That answer requires knowing your holdings, your concentration, your trade history, and your fund flows — across every venue at once. That's what CryptoContext assembles.

## Why it's different

- **Built for AI, not for staring.** It's not another dashboard. Your positions become clean, queryable context an agent can reason over — concentration, allocation, risk flags — not a chart you interpret yourself.
- **Knows how you trade, not just what you hold.** Trading patterns, DCA habits, fund flows, funding behavior — so advice is about *you*, not a generic investor.
- **Every venue, one picture.** Multiple exchanges + multiple chains unified into a single complete view. Comprehensiveness is the whole point.
- **Grounded numbers, AI-written profile.** Holdings, concentration and trading stats are computed locally into hard facts. A free LLM then reads only that aggregated shape — never your keys or addresses — to write a rich investor profile. The numbers stay deterministic; the interpretation is smart.
- **Open source and read-only.** Read-only API keys, encrypted at rest. Don't trust us — [read the code](SECURITY.md) or self-host.
- **No lock-in, by design.** You own the context layer and point it at any agent. Switch models freely; your context follows you.

## Quickstart — use the hosted version

1. Sign up at the [live demo](https://app-rho-jet-70.vercel.app) and connect a wallet address (zero risk) or an exchange with a **read-only** API key.
2. Create an MCP token in the dashboard.
3. Add it to your agent:

```bash
claude mcp add --transport http crypto-ctx \
  https://app-rho-jet-70.vercel.app/api/mcp \
  --header "Authorization: Bearer YOUR_TOKEN"
```

Or in any MCP client config:

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

Works with Claude Code, Cursor, and any MCP-compatible agent. The dashboard shows your exact command with your endpoint and token filled in.

## Quickstart — self-host (trust no one)

The strongest answer to "is this safe with my keys?" is running it yourself. You hold the encryption key and the database; no third party has any access.

```bash
git clone https://github.com/0xrikt/crypto-context.git
cd crypto-context
cp .env.example .env.local        # fill in the values below
npm install
npm run dev
```

You'll need a (free) [Supabase](https://supabase.com) project. Apply [`supabase-schema.sql`](supabase-schema.sql) to create the tables and row-level-security policies, then set:

| Variable | Purpose | Format |
|----------|---------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | JWT string |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (used by the MCP endpoint) | JWT string |
| `ENCRYPTION_KEY` | AES-256-GCM key encrypting your API keys | **Exactly 64 hex chars** |

Generate the encryption key with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Deploy anywhere that runs Next.js. It's tuned for Vercel's free tier — total cost to run is **$0/month**.

## How it works

1. **Connect your venues.** Add exchanges with a read-only API key; paste wallet addresses. The app can never trade or withdraw — [read-only, always](SECURITY.md).
2. **Context is auto-generated.** Holdings, concentration, trading patterns, and fund flows are computed locally into hard facts; an LLM then reads only that aggregated shape — never your keys or addresses — to write your investor profile. Refreshed on every sync.
3. **Any AI queries via MCP.** One command connects your agent. Ask anything about your portfolio — it already knows.

## Supported exchanges (10)

Binance, OKX, Bybit, Coinbase, Kraken, Bitget, KuCoin, Gate.io, HTX, MEXC.
OKX / Bitget / KuCoin also require the API passphrase. Wallets: EVM addresses on Ethereum, BNB Chain, Polygon, Arbitrum, and Base.

## Security

CryptoContext is built to be trusted with exchange keys:

- **Read-only by design** — the code only calls read endpoints; no `createOrder`/`withdraw`/`transfer` anywhere ([verify with one grep](SECURITY.md#what-cryptocontext-can-and-cannot-do)).
- **AES-256-GCM** encryption at rest, unique IV per record, key held only in an env var.
- **Row-level security** so accounts are fully isolated; MCP tokens stored as **SHA-256 hashes**.
- HTTPS-only, rate limiting, input validation, error sanitization.

Full details and threat model: **[SECURITY.md](SECURITY.md)**.

## Tech stack

| Component | Solution | Cost |
|-----------|----------|------|
| Frontend + API | Next.js 16 (App Router, Tailwind v4) | Free (Vercel) |
| Database + Auth | Supabase (PostgreSQL + RLS) | Free |
| Exchange data | CCXT v4.5 | Free |
| MCP protocol | HTTP transport, JSON-RPC 2.0 | — |
| Key encryption | AES-256-GCM | — |

**Total: $0/month.**

## MCP API

**Discovery** — `GET /api/mcp` returns server info and available tools.

**Tools** — `POST /api/mcp` (auth: `Authorization: Bearer <mcp_token>`):

| Tool | Description |
|------|-------------|
| `get_portfolio` | Current holdings with USD values and allocation %. Optional: filter by asset. |
| `get_context` | Full investment context for a query — portfolio + concentration + trading profile + fund flows. |

## Project structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── dashboard/            # Connections, portfolio, MCP tokens
│   ├── login/ · signup/      # Auth pages
│   └── api/
│       ├── auth/             # login, logout, signup
│       ├── exchange/         # connect, disconnect, portfolio
│       └── mcp/              # MCP JSON-RPC endpoint + token management
├── lib/
│   ├── exchange.ts           # CCXT wrapper — balances & pricing (read-only)
│   ├── exchange-history.ts   # Trade / deposit / withdrawal history (read-only)
│   ├── generators/           # Deterministic context: trading profile, fund flow
│   ├── context.ts            # Assembles portfolio + analysis into context
│   ├── crypto.ts             # AES-256-GCM encryption
│   ├── security.ts           # Rate limiting, validation, error sanitization, headers
│   ├── store.ts              # Supabase data layer
│   └── supabase/             # Supabase clients
└── middleware.ts             # Auth + security headers
```

## Contributing & disclosure

Issues and PRs welcome. For **security** issues, please don't open a public issue — see the disclosure process in [SECURITY.md](SECURITY.md#reporting-a-vulnerability).

## License

[MIT](LICENSE) © 2026 [0xrikt](https://github.com/0xrikt)
