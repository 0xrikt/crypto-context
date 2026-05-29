# Show HN

Hacker News is the credibility moment, and it's crypto-skeptical. So: lead with the **technical** idea (an MCP context layer, deterministic generation, open source, self-hostable, $0), treat crypto as the *domain* not the pitch, and be honest about limitations. The security/open-source story is what plays here — HN will read the code.

**Submit the GitHub repo as the URL** (open source is the trust signal), not the marketing site. Post around 8–10am ET on a weekday. Then immediately post the prepared first comment.

---

## Title

Primary:

```
Show HN: CryptoContext – Give any AI agent your crypto portfolio via MCP
```

Alternates (if the primary feels off, or for a retry):

- `Show HN: Open-source MCP server that gives your AI your full crypto portfolio`
- `Show HN: A context layer that lets any AI see your real crypto positions`

Keep it plain. No "revolutionary," no emoji. HN punishes hype.

**URL:** `https://github.com/0xrikt/crypto-context`

---

## Body text (the submission text box)

```
Every AI gives generic portfolio advice because it can't see what you
actually hold — your money is split across exchanges and wallets and no
model has the full picture. Pasting positions into a chat by hand is
stale the moment you send it.

CryptoContext is an MCP server that unifies your holdings across 10
exchanges (read-only API keys) and EVM wallets, plus your trading
behavior (DCA cadence, buy/sell ratio, fund flows), into one structured
context any MCP agent can query. Connect once and Claude/Cursor/etc. can
answer "what's wrong with my portfolio?" about YOUR portfolio.

Two design choices I care about:

1. The context is generated deterministically — plain rules over your
   data, no LLM in the loop. It's reproducible, nothing gets sent to a
   model to BUILD the context, and it costs $0 to generate. The agent you
   point at it does the reasoning; the layer's job is just to be correct.

2. It's open source and read-only on purpose. The #1 objection to anything
   touching exchange keys is "why would I trust you." The answer is: don't
   — read the code, or self-host it and hold your own encryption key. The
   integration only ever calls read endpoints; there's no createOrder or
   withdraw anywhere (one grep confirms it). Keys are AES-256-GCM encrypted
   at rest; MCP tokens are stored as SHA-256 hashes.

Stack: Next.js, Supabase (Postgres + RLS), CCXT, MCP over HTTP/JSON-RPC.
Runs free on Vercel's tier. Live demo + one-line setup in the README.

It's early and solo-built — feedback, holes in the security model, and
"this is dumb because X" all welcome.
```

(~210 words — long enough to be substantive, short enough to read. Trim if it feels heavy.)

---

## Prepared first comment (post immediately after submitting)

```
Author here. The thing that made me build this: the AI model race is
converging, so the bottleneck for "is my assistant actually useful" is
shifting from how smart the model is to how much it knows about my
situation. And the place my situation is most fragmented is crypto —
balances scattered across CEXs and chains that no single app sees.

A few things I expect pushback on, so let me front-run them:

- "It's just a portfolio tracker with an API." The difference I care about
  is the artifact: a tracker renders a dashboard for a human to interpret;
  this emits structured context for a machine to reason over, including
  behavioral dimensions (trading patterns, fund flows) a snapshot tracker
  doesn't have. Fair to disagree on whether that's a real distinction.

- "Read-only isn't real security." Correct that software promises aren't
  enough alone — the real guard is exchange-side: you create a read-only
  key, and the exchange enforces it no matter what my code does. The code
  only calling read endpoints is the second layer, self-hosting is the
  third. SECURITY.md lays out the threat model honestly, including what it
  does NOT protect against (e.g. a key you wrongly gave trade permissions).

- "Why not just use vector DB / embeddings for the context?" Didn't need
  it — the context is small and structured, so it's computed directly by
  dimension rather than retrieved semantically. Less to go wrong, nothing
  to hallucinate.

Known limitations right now: EVM wallets only (no Solana yet), spot
balances (no perps/positions), and pricing leans on exchange tickers.
Roadmap and warts in the repo. Happy to go deep on any of it.
```

---

## Tips for the thread

- **Answer every comment in the first 3 hours**, especially skeptical ones, calmly and technically. HN rewards a maker who engages honestly far more than a perfect launch.
- If someone finds a real security hole, thank them publicly and fix it fast — that thread *becomes* your credibility.
- Don't argue the crypto-is-a-scam tangent; redirect to the technical idea (context layers / MCP) which stands on its own.
- Don't ask for upvotes anywhere — it's against the rules and HN detects voting rings. The directory + Twitter push (see [the runbook](README.md)) drives organic eyes instead.
