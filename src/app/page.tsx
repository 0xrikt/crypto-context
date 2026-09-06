import Link from "next/link";
import { LogoMark, LogoWordmark } from "@/components/Logo";
import { BrandLogo } from "@/components/icons/BrandLogo";
import { EXCHANGE_DISPLAY_NAMES } from "@/lib/exchange-names";
import { CHAIN_BRANDS, PICKER_WALLET_BRANDS } from "@/lib/wallets/brands";

const GITHUB_URL = "https://github.com/EarthOnlineLabs/crypto-context";

/** Every supported venue, with its mark — the ticker makes "comprehensive" tangible. */
const EXCHANGE_TILES = Object.entries(EXCHANGE_DISPLAY_NAMES).map(([id, name]) => ({ id, name }));
const CHAIN_TILES = Object.values(CHAIN_BRANDS).map((b) => ({ id: b.id, name: b.name }));
const WALLET_TILES = PICKER_WALLET_BRANDS.map((b) => ({ id: b.id, name: b.name }));
const TICKER_TILES = [...EXCHANGE_TILES, ...CHAIN_TILES];

function ArrowIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-blueprint relative overflow-hidden">
      {/* Gradient glows behind hero */}
      <div className="glow top-[-120px] left-1/2 -translate-x-1/2 scale-150" />
      <div className="glow top-[480px] right-[-220px] opacity-60" />
      <div className="glow top-[1200px] left-[-260px] opacity-40" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <LogoWordmark />
        <div className="flex items-center gap-3">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-sm text-gray-500 hover:text-gray-900 transition"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            GitHub
          </a>
          <Link
            href="/demo"
            className="hidden sm:block px-4 py-2 text-sm text-gray-500 hover:text-gray-900 transition"
          >
            Demo
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 transition whitespace-nowrap"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition shadow-lg shadow-emerald-200/50 whitespace-nowrap"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10">
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-10 sm:pt-28 text-center">
          <div className="hero-stagger">
            <div className="inline-flex items-center gap-2 sm:gap-2.5 px-3 sm:px-3.5 py-1.5 rounded-full border border-emerald-600/20 bg-white/70 backdrop-blur text-[10px] sm:text-[11px] font-mono tracking-[0.1em] sm:tracking-[0.14em] uppercase text-emerald-700 mb-8 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              MCP-native · Open source · $0 to run
            </div>

            <h1 className="text-[2.75rem] sm:text-6xl lg:text-[5rem] font-bold tracking-[-0.035em] leading-[1.02] text-gray-900">
              Not your context,
              <br />
              <span className="text-gradient">not your AI.</span>
            </h1>

            <p className="mt-7 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Your crypto identity — what you hold, how you trade — belongs to you,
              not to any app. CryptoContext turns it into context you own and point
              at any AI: read-only, no token, open source. So every agent knows you,
              instead of guessing.
            </p>

            <div className="mt-10 flex flex-wrap gap-4 justify-center">
              <Link
                href="/signup"
                className="group px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-emerald-200/60 flex items-center gap-2"
              >
                Connect your portfolio
                <span className="transition-transform group-hover:translate-x-0.5">
                  <ArrowIcon />
                </span>
              </Link>
              <Link
                href="/demo"
                className="px-6 py-3 bg-white/70 backdrop-blur border border-gray-300/80 hover:border-emerald-400 rounded-lg text-sm text-gray-700 hover:text-gray-900 transition flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                </svg>
                Try the live demo
              </Link>
            </div>

            {/* Venue ticker — 16 exchanges + 8 chains, with their marks */}
            <div className="mt-14 ticker-mask overflow-hidden" aria-hidden="true">
              <div className="ticker-track gap-7">
                {[0, 1].map((dup) => (
                  <div key={dup} className="flex shrink-0 items-center gap-7 pr-7">
                    {TICKER_TILES.map((v) => (
                      <span
                        key={`${dup}-${v.id}`}
                        className="flex items-center gap-2 whitespace-nowrap text-[11px] font-mono uppercase tracking-[0.14em] text-gray-500"
                      >
                        <BrandLogo id={v.id} size={18} />
                        {v.name}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-3 text-[11px] font-mono uppercase tracking-[0.16em] text-gray-400">
              16 exchanges · 8 chains · one context
            </p>
          </div>
        </section>

        {/* Proof: real AI transcript — the dark anchor */}
        <section className="max-w-4xl mx-auto px-6 pt-8 pb-20">
          <div className="ink-panel noise rounded-2xl overflow-hidden">
            <div className="relative flex items-center justify-between px-5 py-3.5 border-b border-emerald-300/10">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/90 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                <span className="text-xs text-emerald-100/60 font-mono">claude · crypto-context connected</span>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-emerald-100/30">example</span>
            </div>
            <div className="relative p-5 sm:p-8 space-y-5 text-sm leading-relaxed">
              {/* user turn */}
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-white/10 text-emerald-50/80 flex items-center justify-center text-xs font-medium">you</span>
                <p className="text-emerald-50/90 pt-0.5">Be honest — what&apos;s wrong with my portfolio?</p>
              </div>

              {/* tool call chip */}
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7" />
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-400/10 border border-emerald-300/20 text-xs font-mono text-emerald-200/90">
                  <svg className="w-3 h-3 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  called get_context()
                </div>
              </div>

              {/* assistant turn */}
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-400/15 text-emerald-300 flex items-center justify-center text-xs font-medium ring-1 ring-inset ring-emerald-300/20">AI</span>
                <div className="text-emerald-50/80 space-y-3 pt-0.5">
                  <p>Three things stand out, and they&apos;re connected:</p>
                  <p>
                    <span className="font-medium text-emerald-50">1. Your conviction and your attention are in different places.</span>{" "}
                    BTC + ETH are 70% of your book — that&apos;s your thesis. But 11 of your
                    last 14 trades were SOL, WIF and JUP. You&apos;re a long-term holder who
                    keeps day-trading memes on the side, and the fees are adding up
                    (~$430 in 90 days).
                  </p>
                  <p>
                    <span className="font-medium text-emerald-50">2. You have no dry powder.</span>{" "}
                    Stablecoins are 3%. Your own history shows you buy the majors on
                    20%+ dips — but if one comes now, you have almost nothing to deploy
                    without selling at a loss. That&apos;s the gap to fix.
                  </p>
                  <p>
                    <span className="font-medium text-emerald-50">3. The disciplined part:</span>{" "}
                    your weekly ETH DCA is steady and your deposits are net-positive —
                    you&apos;re in accumulation mode. Keep the DCA. Just route some of the
                    meme-churn capital into a stable reserve instead.
                    <span className="caret-blink ml-1 inline-block h-3.5 w-[7px] translate-y-0.5 bg-emerald-300/80" />
                  </p>
                </div>
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">
            The same context works in Claude, Cursor, ChatGPT, or any MCP agent — no copy-pasting your positions ever again.
          </p>
        </section>

        {/* Differentiation */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-14">
            <div className="eyebrow mb-3">Why it&apos;s different</div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">Not another portfolio tracker</h2>
            <p className="mt-3 text-gray-400 text-sm max-w-xl mx-auto">
              Trackers are dashboards for you to look at. CryptoContext is a context layer for your AI to reason with.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                n: "01",
                title: "Built for AI, not for staring",
                desc: "Your positions become clean, queryable context an agent can reason over — concentration, allocation, risk flags — not a chart you decode yourself.",
                icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z",
              },
              {
                n: "02",
                title: "Knows how you trade",
                desc: "Not just what you hold. It surfaces your trading patterns, DCA habits and fund flows — so advice is about you, not a textbook investor.",
                icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
              },
              {
                n: "03",
                title: "Every venue, one picture",
                desc: "Binance, Bybit, an Ethereum wallet, a Solana wallet — unified into one complete view. The point: your AI finally sees all of it at once.",
                icon: "M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418",
              },
            ].map((item) => (
              <div key={item.title} className="card-hairline rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute right-5 top-5 text-[11px] font-mono text-emerald-600/40">{item.n}</div>
                <div className="w-11 h-11 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center mb-5 ring-1 ring-inset ring-emerald-600/15">
                  <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Supported venues wall — "they support what I already use" */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <div className="eyebrow mb-3">Coverage</div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
              Works with what you already use
            </h2>
            <p className="mt-3 text-gray-400 text-sm max-w-xl mx-auto">
              Comprehensiveness is the whole point — a partial picture gives your AI false confidence.
            </p>
          </div>

          <div className="card-hairline rounded-2xl p-6 sm:p-8 space-y-7">
            <div>
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-gray-400">Exchanges</span>
                <span className="text-[11px] font-mono text-emerald-600">16 supported · read-only keys</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {EXCHANGE_TILES.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center gap-2 rounded-lg border border-gray-200/80 bg-white/70 px-2.5 py-2"
                  >
                    <BrandLogo id={v.id} size={22} />
                    <span className="truncate text-xs text-gray-700">{v.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-gray-400">Chains</span>
                <span className="text-[11px] font-mono text-emerald-600">8 supported · EVM + Solana</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {CHAIN_TILES.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center gap-2 rounded-lg border border-gray-200/80 bg-white/70 px-2.5 py-2"
                  >
                    <BrandLogo id={v.id} size={22} />
                    <span className="truncate text-xs text-gray-700">{v.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-gray-400">Wallets</span>
                <span className="text-[11px] font-mono text-emerald-600">any address · zero keys</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {WALLET_TILES.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center gap-2 rounded-lg border border-gray-200/80 bg-white/70 px-2.5 py-2"
                  >
                    <BrandLogo id={v.id} size={22} />
                    <span className="text-xs text-gray-700">{v.name}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2.5 text-xs text-gray-400">
                Paste an address from any of these — or any address at all. We read public balances; your keys never leave your wallet.
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-14">
            <div className="eyebrow mb-3">How it works</div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">Three steps, two minutes</h2>
            <p className="mt-3 text-gray-400 text-sm">Three steps to give every AI agent your full portfolio context.</p>
          </div>

          <div className="relative grid sm:grid-cols-3 gap-5">
            {/* connector line between the steps (desktop) */}
            <div className="hidden sm:block absolute top-[3.4rem] left-[18%] right-[18%] border-t border-dashed border-emerald-600/25" aria-hidden="true" />
            {[
              {
                step: "01",
                title: "Connect your venues",
                desc: "Add exchanges with a read-only API key and paste your wallet addresses. We can never trade or withdraw — read-only, always.",
                icon: "M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.06a4.5 4.5 0 00-6.364-6.364L4.5 8.25a4.5 4.5 0 006.364 6.364l2.382-2.382",
              },
              {
                step: "02",
                title: "Context auto-generated",
                desc: "Holdings, concentration, trading patterns and fund flows are computed locally into hard facts. An LLM then reads only that aggregated shape — never your keys or addresses — to write a rich investor profile.",
                icon: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z",
              },
              {
                step: "03",
                title: "Any AI queries via MCP",
                desc: "One command connects Claude Code, Cursor, or any MCP-compatible agent. Ask anything about your portfolio — it already knows.",
                icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z",
              },
            ].map((item) => (
              <div key={item.step} className="card-hairline rounded-2xl p-6 relative">
                <div className="relative z-10 w-11 h-11 rounded-xl bg-white text-emerald-700 flex items-center justify-center mb-5 ring-1 ring-inset ring-emerald-600/25 shadow-sm">
                  <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <div className="text-[11px] font-mono tracking-[0.16em] text-emerald-600/60 mb-2">STEP {item.step}</div>
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Code block */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="max-w-2xl mx-auto">
            <div className="eyebrow mb-3 text-center">Connect</div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center text-gray-900">One command to connect</h2>
            <p className="mt-3 text-center text-gray-400 text-sm">Use it anywhere — over MCP, as a portable skill, or one-click copy-paste into ChatGPT, OpenClaw, and the rest.</p>

            <div className="ink-panel noise mt-8 rounded-2xl overflow-hidden">
              <div className="relative flex items-center gap-2 px-4 py-3 border-b border-emerald-300/10">
                <span className="w-3 h-3 rounded-full bg-white/10" />
                <span className="w-3 h-3 rounded-full bg-white/10" />
                <span className="w-3 h-3 rounded-full bg-white/10" />
                <span className="ml-3 text-xs text-emerald-100/40 font-mono">terminal</span>
              </div>
              <div className="relative p-5 font-mono text-sm leading-relaxed overflow-x-auto">
                <span className="text-emerald-400">$</span>{" "}
                <span className="text-emerald-50/90">claude mcp add</span>{" "}
                <span className="text-emerald-100/50">--transport</span>{" "}
                <span className="text-teal-300">http</span>{" "}
                <span className="text-emerald-50/90">crypto-ctx \</span>
                <br />
                {"  "}
                <span className="text-teal-300">https://cryptocontext.earthonline.site/api/mcp</span>{" "}
                <span className="text-emerald-100/50">--header</span>{" "}
                <span className="text-emerald-50/90">&quot;Authorization: Bearer</span>{" "}
                <span className="text-emerald-400">YOUR_TOKEN</span>
                <span className="text-emerald-50/90">&quot;</span>
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-gray-400">
              Copy your exact one-line command — with your endpoint and token — from your dashboard after connecting a source.
            </p>
          </div>
        </section>

        {/* Two on-ramps */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <div className="eyebrow mb-3">Start small or go all-in</div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">Try it in 30 seconds</h2>
            <p className="mt-3 text-gray-400 text-sm">Start with zero risk. Go all-in when you&apos;re ready.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
            <div className="card-hairline rounded-2xl p-7">
              <div className="text-[11px] font-mono tracking-[0.16em] text-gray-400 mb-3">START HERE</div>
              <h3 className="text-lg font-semibold text-gray-900">Paste a wallet address</h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                Public data — zero risk, no API key. Drop in any address (even a
                whale&apos;s) and watch an AI break it down instantly. The fastest
                way to feel the difference.
              </p>
              <Link href="/signup" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-500 transition">
                Try with a wallet
                <ArrowIcon />
              </Link>
            </div>
            <div className="card-hairline rounded-2xl p-7 !border-emerald-500/40 relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-400" aria-hidden="true" />
              <div className="text-[11px] font-mono tracking-[0.16em] text-emerald-600 mb-3">THE FULL PICTURE</div>
              <h3 className="text-lg font-semibold text-gray-900">Connect everything</h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                A single wallet is one slice. The real value is the complete view —
                every exchange and chain in one context, plus how you trade. That&apos;s
                when your AI truly understands you as an investor.
              </p>
              <Link href="/signup" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-500 transition">
                Connect exchanges + wallets
                <ArrowIcon />
              </Link>
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="card-hairline rounded-2xl p-8 sm:p-10 relative overflow-hidden">
            {/* watermark mark */}
            <div className="absolute -right-16 -bottom-16 opacity-[0.05]" aria-hidden="true">
              <LogoMark size={320} />
            </div>
            <div className="relative flex flex-col sm:flex-row sm:items-start gap-8">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-600/20 bg-emerald-50 text-[11px] font-mono tracking-[0.12em] uppercase text-emerald-700 mb-4">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                  Security first · Open source
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Your keys, your control</h2>
                <p className="mt-3 text-sm text-gray-500 max-w-md leading-relaxed">
                  Read-only access, encrypted at rest, and fully open source — don&apos;t
                  trust us, read the code. We can never execute a trade or move a coin.
                </p>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-500 transition"
                >
                  Audit the source on GitHub
                  <ArrowIcon />
                </a>
              </div>
              <div className="flex-1 grid gap-3">
                {[
                  { text: "Read-only API keys — no trading or withdrawals", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
                  { text: "AES-256-GCM encryption for stored keys", icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" },
                  { text: "Open source — inspect every line yourself", icon: "M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" },
                  { text: "Disconnect your data sources anytime", icon: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3 text-sm">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-600/10 ring-1 ring-inset ring-emerald-600/15 flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                      </svg>
                    </div>
                    <span className="text-gray-700">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Thesis — the editorial moment */}
        <section className="max-w-6xl mx-auto px-6 py-24">
          <div className="max-w-2xl mx-auto text-center">
            <div className="eyebrow mb-5">The thesis</div>
            <h2 className="text-3xl sm:text-[2.6rem] font-bold tracking-tight text-gray-900 leading-tight">
              Your investor identity should be{" "}
              <span className="text-gradient">yours</span>.
            </h2>
            <p className="mt-6 text-gray-500 leading-relaxed">
              Every app traps your data to keep you inside its walls. CryptoContext is
              the opposite — an open, MCP-native layer you own and point at any agent.
              Switch from Claude to Cursor to whatever&apos;s next; your context comes
              with you.
            </p>
            <p
              className="mt-10 text-3xl sm:text-4xl text-gray-900"
              style={{ fontFamily: "var(--font-editorial), Georgia, serif", fontStyle: "italic" }}
            >
              &ldquo;Not your context, not your AI.&rdquo;
            </p>
          </div>
        </section>

        {/* CTA — ink finale */}
        <section className="max-w-6xl mx-auto px-6 pb-20 text-center">
          <div className="ink-panel noise rounded-3xl py-16 px-6 relative overflow-hidden">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.07]" aria-hidden="true">
              <LogoMark size={560} variant="plain" className="[&_circle]:!stroke-emerald-300 [&_circle:last-child]:!fill-emerald-300" />
            </div>
            <div className="relative">
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-emerald-50">
                Give your AI agents{" "}
                <span className="text-gradient">eyes</span>.
              </h2>
              <p className="mt-4 text-emerald-100/50 max-w-md mx-auto text-sm">
                Free. Open source. Connect your first source in under 2 minutes.
              </p>
              <Link
                href="/signup"
                className="group mt-9 inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-xl text-sm font-semibold transition shadow-[0_0_40px_rgba(52,211,153,0.35)]"
              >
                Get started — it&apos;s free
                <span className="transition-transform group-hover:translate-x-0.5">
                  <ArrowIcon />
                </span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200 py-8 bg-white/60 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <LogoMark size={20} variant="tile" />
            CryptoContext
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-400">MIT licensed</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-gray-400">
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 transition">GitHub</a>
            <a href={`${GITHUB_URL}/blob/main/SECURITY.md`} target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 transition">Security</a>
            <Link href="/demo" className="hover:text-gray-700 transition">Demo</Link>
            <span className="font-mono text-[11px] tracking-wide text-gray-400">Not your context, not your AI.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
