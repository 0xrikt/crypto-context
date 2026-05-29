# Reddit & Farcaster

Secondary channels. Reddit is **allergic to self-promotion** — most subs enforce a 9:1 rule (nine genuine contributions per self-post) and mods nuke drive-by launches. So: only post where you're at least a little known, lead with substance, and never cross-post the same text. Farcaster is friendlier to builders shipping things.

These are **adaptations**, not new messages — same thesis as [thesis.md](thesis.md), same proof as [transcripts.md](transcripts.md), tuned per community.

---

## Reddit

### Best-fit subs (in priority order)

**r/LocalLLaMA** — strongest fit. They love open-source, self-hostable, privacy-respecting, and "no LLM needed for this part." Lead with those, not crypto.

Title:
```
I built an open-source MCP server that gives your local agent your real
crypto portfolio — context generated deterministically, no LLM, self-hostable
```
Body:
```
Wanted my agent to give portfolio advice that's actually about MY positions,
not generic textbook stuff. Problem: my holdings are scattered across
exchanges + wallets and no model can see them.

So I built a context layer: connect venues (read-only keys) and it unifies
everything into structured context any MCP agent can query. Two things this
crowd might care about:

- The context is computed with plain deterministic rules — no LLM in the
  loop to build it. Reproducible, nothing leaves to a model, $0 to generate.
  The reasoning happens in whatever agent you point at it.
- Fully self-hostable. You run it, you hold the AES-256-GCM key, nobody
  (including me) can see your data. Open source so you can read what touches
  your keys.

Stack: Next.js + Supabase + CCXT, MCP over HTTP. Repo + threat model in
SECURITY.md. It's solo-built and early — would genuinely like this sub to
poke holes in the security model.

[repo link]
```

**r/ClaudeAI / r/cursor** — they'll appreciate it as a useful MCP server. Frame as "here's an MCP server I made," show transcript #1 as a screenshot.

Title:
```
Made an MCP server so Claude can see my actual crypto portfolio — it finally
gives advice about MY holdings instead of generic stuff
```
Body: short — 3-4 sentences + the transcript screenshot + repo link. These subs like show-and-tell, not essays.

**r/ethdev / r/ethfinance** — dev-leaning, EVM-native. Fine to be more technical; mention EVM wallet support (Ethereum, Arbitrum, Base, Polygon, BNB). Same show-and-tell shape.

### Subs to approach carefully or skip

- **r/CryptoCurrency** — enormous but ruthless on promo; a new repo link from a low-karma account gets removed or downvoted. Only consider if you have standing there, and frame as a discussion ("AI portfolio advice is useless because models can't see your bags — anyone solving this?") rather than a launch. High risk, skip unless confident.
- **r/MachineLearning** — too academic for a product launch; skip.

### Reddit rules of engagement

- Read each sub's rules + check if "Show-and-tell"/"Self-promo Saturday" threads exist; use them.
- Post natively, never the same body twice (Reddit flags duplicate text).
- Disclose you're the author in the first line. Reddit forgives self-promo it can see; it punishes the kind it catches.
- Reply to every comment. The comments are where trust gets built.

---

## Farcaster

Crypto-native, builder-positive, and your real identity fits right in. Less promo-averse than Reddit — shipping something is *expected* here.

### Cast (single post + image)

Attach the transcript #1 screenshot or the contrast table.

```
your AI gives generic crypto advice because it can't see your bags 👀

built CryptoContext: connect your exchanges (read-only) + wallets, and any
agent can query your real portfolio over MCP — holdings, concentration, how
you actually trade.

open source. read-only. $0. not your context, not your AI.

[link]
```

### Channels to post in

- **/ai** and **/mcp** (if it exists) — the wedge audience.
- **/dev** or **/builders** — building-in-public is welcome.
- A relevant crypto channel (e.g. /base if you lean into Base wallet support) — but lead with the AI angle, not the token angle.

### Notes

- Farcaster rewards genuine builder narrative — a short follow-up cast on *why* you built it (link [thesis.md](thesis.md)) does well.
- Engage with replies fast; the network is small enough that founders/devs you'd want to reach are actually reachable.
- Don't spray the same cast across many channels at once — one good cast in /ai beats five copies.

---

## Cross-channel discipline (applies to all of the above)

- **Never paste identical text across platforms** — tailor each. Algorithms and mods both penalize duplication, and audiences notice.
- **The repo and the thesis post are the destinations**; every channel is just a different on-ramp to them.
- **Stagger, don't blast.** Sequence in [the runbook](README.md) — directories → HN → Twitter → Reddit/Farcaster over days, so each can breathe and you can actually respond to every thread.
