import Link from "next/link";

const GITHUB_URL = "https://github.com/0xrikt/crypto-context";

export default function Home() {
  return (
    <div className="min-h-screen bg-grid relative overflow-hidden">
      {/* Gradient glow behind hero */}
      <div className="glow top-[-100px] left-1/2 -translate-x-1/2" />
      <div className="glow top-[500px] right-[-200px] opacity-50" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight text-gray-900">CryptoContext</span>
        </div>
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
            href="/login"
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 transition"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition shadow-lg shadow-emerald-200/50"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10">
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-12 sm:pt-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-xs text-emerald-700 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              MCP-native · Open source · $0 to run
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] text-gray-900">
              Your AI gives generic advice
              <br />
              because it{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                can&apos;t see your bags.
              </span>
            </h1>

            <p className="mt-6 text-lg text-gray-500 max-w-xl leading-relaxed">
              Your money is scattered across exchanges and wallets, so no AI knows
              what you actually hold. CryptoContext unifies your entire crypto
              footprint — every venue, plus how you trade — into one context that
              any AI agent can query over MCP. You own it. You&apos;re never locked in.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-emerald-200/50 flex items-center gap-2"
              >
                Connect your portfolio
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 border border-gray-200 hover:border-gray-400 rounded-lg text-sm text-gray-500 hover:text-gray-900 transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
                Star on GitHub
              </a>
            </div>

            <p className="mt-8 text-sm font-medium text-gray-400">
              Not your context,{" "}
              <span className="text-gray-900">not your AI.</span>
            </p>
          </div>
        </section>

        {/* Proof: real AI transcript */}
        <section className="max-w-4xl mx-auto px-6 pb-20">
          <div className="glass rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200/80">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-xs text-gray-400 font-mono">claude · crypto-context connected</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-gray-300">example</span>
            </div>
            <div className="p-5 sm:p-7 space-y-5 text-sm leading-relaxed">
              {/* user turn */}
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-medium">you</span>
                <p className="text-gray-700 pt-0.5">Be honest — what&apos;s wrong with my portfolio?</p>
              </div>

              {/* tool call chip */}
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7" />
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200 text-xs font-mono text-gray-400">
                  <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  called get_context()
                </div>
              </div>

              {/* assistant turn */}
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-medium">AI</span>
                <div className="text-gray-700 space-y-3 pt-0.5">
                  <p>
                    Three things stand out, and they&apos;re connected:
                  </p>
                  <p>
                    <span className="font-medium text-gray-900">1. Your conviction and your attention are in different places.</span>{" "}
                    BTC + ETH are 70% of your book — that&apos;s your thesis. But 11 of your
                    last 14 trades were SOL, WIF and JUP. You&apos;re a long-term holder who
                    keeps day-trading memes on the side, and the fees are adding up
                    (~$430 in 90 days).
                  </p>
                  <p>
                    <span className="font-medium text-gray-900">2. You have no dry powder.</span>{" "}
                    Stablecoins are 3%. Your own history shows you buy the majors on
                    20%+ dips — but if one comes now, you have almost nothing to deploy
                    without selling at a loss. That&apos;s the gap to fix.
                  </p>
                  <p>
                    <span className="font-medium text-gray-900">3. The disciplined part:</span>{" "}
                    your weekly ETH DCA is steady and your deposits are net-positive —
                    you&apos;re in accumulation mode. Keep the DCA. Just route some of the
                    meme-churn capital into a stable reserve instead.
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
            <h2 className="text-3xl font-bold text-gray-900">Not another portfolio tracker</h2>
            <p className="mt-3 text-gray-400 text-sm max-w-xl mx-auto">
              Trackers are dashboards for you to look at. CryptoContext is a context layer for your AI to reason with.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                title: "Built for AI, not for staring",
                desc: "Your positions are structured into clean, queryable context an agent can actually reason over — concentration, allocation, risk flags — not a chart you have to interpret yourself.",
                icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z",
              },
              {
                title: "Knows how you trade",
                desc: "Not just what you hold. It surfaces your trading patterns, DCA habits, fund flows and funding behavior — so advice is about you, not a generic textbook investor.",
                icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
              },
              {
                title: "Every venue, one picture",
                desc: "Binance, Bybit, Coinbase, an Ethereum wallet, an Arbitrum wallet — unified into a single complete view. The whole point is that your AI finally sees all of it at once.",
                icon: "M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418",
              },
            ].map((item) => (
              <div key={item.title} className="glass rounded-xl p-6">
                <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900">How it works</h2>
            <p className="mt-3 text-gray-400 text-sm">Three steps to give every AI agent your full portfolio context.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
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
              <div key={item.step} className="glass rounded-xl p-6 hover:border-gray-300 transition group">
                <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <div className="text-xs text-gray-300 font-mono mb-2">{item.step}</div>
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Code block */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900">One command to connect</h2>
            <p className="mt-3 text-center text-gray-400 text-sm">Works with Claude Code, Cursor, and any MCP-compatible agent.</p>

            <div className="code-block mt-8 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
                <span className="w-3 h-3 rounded-full bg-gray-300" />
                <span className="w-3 h-3 rounded-full bg-gray-300" />
                <span className="w-3 h-3 rounded-full bg-gray-300" />
                <span className="ml-3 text-xs text-gray-400 font-mono">terminal</span>
              </div>
              <div className="p-5 font-mono text-sm leading-relaxed overflow-x-auto">
                <span className="text-emerald-600">$</span>{" "}
                <span className="text-gray-700">claude mcp add</span>{" "}
                <span className="text-gray-400">--transport</span>{" "}
                <span className="text-teal-600">http</span>{" "}
                <span className="text-gray-700">crypto-ctx \</span>
                <br />
                {"  "}
                <span className="text-amber-600">https://&lt;your-endpoint&gt;/api/mcp</span>{" "}
                <span className="text-gray-400">--header</span>{" "}
                <span className="text-gray-700">&quot;Authorization: Bearer</span>{" "}
                <span className="text-emerald-600">YOUR_TOKEN</span>
                <span className="text-gray-700">&quot;</span>
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
            <h2 className="text-3xl font-bold text-gray-900">Try it in 30 seconds</h2>
            <p className="mt-3 text-gray-400 text-sm">Start with zero risk. Go all-in when you&apos;re ready.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="glass rounded-xl p-7">
              <div className="text-xs font-mono text-gray-300 mb-3">START HERE</div>
              <h3 className="text-lg font-semibold text-gray-900">Paste a wallet address</h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                Wallet addresses are public data — zero risk, no API key. Drop in
                any address (even a whale&apos;s) and watch an AI break it down
                instantly. The fastest way to feel the difference.
              </p>
              <Link href="/signup" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-500 transition">
                Try with a wallet
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
            <div className="glass rounded-xl p-7 border-emerald-200">
              <div className="text-xs font-mono text-emerald-400 mb-3">THE FULL PICTURE</div>
              <h3 className="text-lg font-semibold text-gray-900">Connect everything</h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                A single wallet is just one slice. The real value is the complete
                view — every exchange and chain in one context, plus how you trade.
                That&apos;s when your AI actually understands you as an investor.
              </p>
              <Link href="/signup" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-500 transition">
                Connect exchanges + wallets
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="glass rounded-xl p-8 sm:p-10">
            <div className="flex flex-col sm:flex-row sm:items-start gap-8">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-xs text-emerald-700 mb-4">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                  Security first · Open source
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Your keys, your control</h2>
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
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </div>
              <div className="flex-1 grid gap-3">
                {[
                  { text: "Read-only API keys — no trading or withdrawals", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
                  { text: "AES-256-GCM encryption for stored keys", icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" },
                  { text: "Open source — inspect every line yourself", icon: "M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" },
                  { text: "Delete all your data anytime", icon: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3 text-sm">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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

        {/* Thesis */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
              Your investor identity should be{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                yours
              </span>
              .
            </h2>
            <p className="mt-5 text-gray-500 leading-relaxed">
              Every app traps your data to keep you inside its walls. CryptoContext is
              the opposite: an open, MCP-native layer you own and point at any AI
              agent you choose. Switch from Claude to Cursor to the next thing — your
              context comes with you. No lock-in, by design.
            </p>
            <p className="mt-8 text-2xl font-bold text-gray-900">
              Not your context, not your AI.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-6 pb-20 text-center">
          <div className="glass rounded-2xl py-14 px-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Give your AI agents{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                eyes
              </span>
              .
            </h2>
            <p className="mt-4 text-gray-400 max-w-md mx-auto text-sm">
              Free to start. Open source. Connect your first source in under 2 minutes.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-emerald-200/50"
            >
              Get started — it&apos;s free
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="w-5 h-5 rounded bg-emerald-50 flex items-center justify-center">
              <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            CryptoContext
          </div>
          <div className="flex items-center gap-5 text-xs text-gray-300">
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 transition">GitHub</a>
            <span>Not your context, not your AI.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
