# Launch kit — CryptoContext

Everything needed to take CryptoContext public, organized so the **message** drives the **format** (not the other way round). Read this file first; it's the map and the runbook.

> **The discipline:** the substance is the product and the proof. The channels below are just on-ramps to two destinations — the **repo** and the **thesis post**. Don't let format-fiddling (which platform, video vs. image) come before "is the thing genuinely worth attention." It is — so ship.

---

## The locked message (keep everything coherent to this)

**Slogan:** *Not your context, not your AI.* (riff on "not your keys, not your coins")

**Three-layer message architecture** — every piece of content is built from these, top to bottom:

1. **Hook (the pain):** *Your AI gives generic advice because it can't see your bags.* Your crypto is scattered across exchanges and wallets; no model sees the whole picture, so advice is generic.
2. **Proof (the goods):** Connect once → any agent answers *"what's wrong with my portfolio?"* about YOUR holdings — concentration, dry powder, how you actually trade — across every venue at once. The [transcripts](transcripts.md) are this layer.
3. **Thesis (the why-it-matters):** In an agent world, whoever owns your context owns the relationship. It should be you — open source, MCP-native, portable. *Not your context, not your AI.* The [thesis post](thesis.md) is this layer.

**Three differentiators that must always survive editing:**
- **Comprehensive** — every venue + how you trade, one picture. A partial view is worse than none.
- **Deterministic** — context computed by rules, no LLM. Reproducible, private, $0.
- **Yours** — open source, read-only, self-hostable, no lock-in.

---

## Files in this kit

| File | What it is | Channel |
|------|-----------|---------|
| [transcripts.md](transcripts.md) | The core proof — 4 AI sessions + the contrast table. Reused everywhere. | All |
| [thesis.md](thesis.md) | The substance anchor: *Not your context, not your AI.* | Blog / Mirror / long X |
| [show-hn.md](show-hn.md) | Show HN title, body, prepared first comment. | Hacker News |
| [twitter-thread.md](twitter-thread.md) | Single-post option + full thread. | X / Twitter |
| [mcp-directories.md](mcp-directories.md) | Listing blurbs + the Awesome-MCP PR line + repo metadata. | MCP directories |
| [reddit-and-farcaster.md](reddit-and-farcaster.md) | Tailored posts per community. | Reddit / Farcaster |

---

## Go-live checklist (do before any posting)

- [ ] **Build is green** — `npm run build` passes locally.
- [ ] **Production is live and healthy** — landing page loads, signup works, an MCP token can be created, and `get_context` returns for a connected venue.
- [ ] **Repo is public** at github.com/0xrikt/crypto-context, with `LICENSE`, `SECURITY.md`, and the rewritten `README.md` present.
- [ ] **Repo metadata set** (directories + humans read it) — run:
  ```bash
  gh repo edit 0xrikt/crypto-context \
    --description "Give any AI agent your real crypto portfolio via MCP. Unifies every exchange + wallet into structured context. Open source, read-only, \$0." \
    --homepage "https://app-rho-jet-70.vercel.app" \
    --add-topic mcp --add-topic model-context-protocol --add-topic crypto \
    --add-topic portfolio --add-topic ai-agents --add-topic claude \
    --add-topic cursor --add-topic ccxt --add-topic defi --add-topic open-source
  ```
  ⚠️ Run this while `gh` is authenticated as the repo owner **0xrikt**. The local `gh` is currently logged in as `EarthOnlineDev`, which can push over SSH but lacks admin rights to edit `0xrikt/crypto-context` (you'll get an HTTP 404). Switch with `gh auth switch` / `gh auth login`, or just set the description/topics/website in the GitHub web UI.
- [ ] **(Decision) Custom domain** — see below. Either swap now, or consciously launch on the Vercel URL.
- [ ] **A clean transcript screenshot exists** for the thread / HN / Farcaster (real session preferred; else the landing-page transcript card).

---

## Domain swap (your call — 2 minutes)

The kit currently uses the live Vercel URL `app-rho-jet-70.vercel.app`, which **works today**. You mentioned a custom domain is ready. If you want to launch on it (recommended — it's more brandable and you only get one first impression), do this *before* posting:

1. **Point the domain in Vercel** (Project → Settings → Domains → add your domain), or:
   ```bash
   vercel domains add <yourdomain> ; vercel alias set <deployment> <yourdomain>
   ```
2. **Find-replace the URL across the kit + README** (the landing page itself is already domain-neutral, so it needs no change):
   ```bash
   cd /Users/rik/projects/crypto-context-layer/app
   grep -rl "app-rho-jet-70.vercel.app" README.md launch/ HANDOVER.md \
     | xargs sed -i '' 's/app-rho-jet-70\.vercel\.app/YOURDOMAIN/g'
   ```
   (Replace `YOURDOMAIN` with the real host, no scheme.)
3. **Update repo metadata homepage** to the new domain (re-run the `gh repo edit --homepage` line above).
4. Re-verify the live demo + MCP endpoint resolve on the new domain, then commit the URL changes.

If you'd rather not decide now, launching on the Vercel URL is completely fine — nothing breaks. Just don't swap mid-launch (links in posts go stale).

---

## Posting sequence (stagger over ~3–5 days, don't blast)

Order matters: seed the credible "home base" first, then drive waves of attention to it, with enough spacing that you can answer every comment.

**Day 0 — quietly seed the directories** ([mcp-directories.md](mcp-directories.md))
Submit to mcp.so, PulseMCP, Smithery; open the Awesome-MCP-Servers PR; set repo metadata so Glama auto-ingests. No fanfare — this just ensures that when people search "MCP crypto," you exist. Low effort, compounding.

**Day 1 — Show HN** ([show-hn.md](show-hn.md))
Morning ET, weekday. Submit the **repo** URL. Post the prepared first comment immediately. Then *stay on the thread for 3+ hours* answering everything. This is the credibility event — treat it as the main thing you do that day.

**Day 1–2 — X / Twitter** ([twitter-thread.md](twitter-thread.md))
Same day as HN or the next, from your real account. Single post or thread. Pin it. If HN went well, you can quote the HN thread ("ended up on the front page of HN, here's what it is"). Reply to your own thread with the other transcripts over following days.

**Day 2–4 — Farcaster, then Reddit** ([reddit-and-farcaster.md](reddit-and-farcaster.md))
Farcaster cast in /ai. Then the 1–2 best-fit subreddits (r/LocalLLaMA, r/ClaudeAI) — *natively written, never duplicated*, and only where you have some standing. Space them a day apart.

**Ongoing — engage, don't broadcast**
The follow-up transcripts, replies, and any "someone found a bug, I fixed it in an hour" moments are the real long tail. A launch is a week, not a day.

---

## Engagement playbook

- **Speed of honest replies > polish of the launch.** Especially on HN and Reddit, a maker who answers skeptics calmly and technically earns more trust than a flawless post.
- **Security questions are gifts** — answer them with specifics and point to SECURITY.md. If someone finds a real hole, thank them publicly and fix it fast; that exchange *becomes* your credibility.
- **Don't fight the crypto-skepticism tangent.** Redirect to the technical idea (context layers / MCP) which stands on its own.
- **No upvote-begging, no vote rings, no identical cross-posts.** Every platform detects and punishes it.

---

## What "success" looks like (set expectations)

For a solo, $0, organic launch, the realistic wins are: a respectable HN showing with a substantive comment thread, a handful of MCP-directory listings that keep delivering trickle traffic for months, GitHub stars from the AI-dev crowd, and a few genuinely engaged early users who connect real portfolios and give feedback. Industry "震动" comes from the *idea* ("not your context, not your AI") spreading — optimize for the thesis being repeated, not for a one-day traffic spike.
