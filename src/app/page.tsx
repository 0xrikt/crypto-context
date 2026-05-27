import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-grid relative overflow-hidden">
      {/* Gradient glow behind hero */}
      <div className="glow top-[-100px] left-1/2 -translate-x-1/2" />
      <div className="glow top-[400px] right-[-200px] opacity-50" />

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
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-xs text-emerald-700 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              MCP-native protocol
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-gray-900">
              Every AI tool already
              <br />
              knows{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                what you hold.
              </span>
            </h1>

            <p className="mt-6 text-lg text-gray-500 max-w-xl leading-relaxed">
              Connect your exchanges and wallets once. CryptoContext structures
              your full portfolio into a personal context layer that any AI agent
              can query via MCP — so you never explain your positions again.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-emerald-200/50 flex items-center gap-2"
              >
                Connect your first exchange
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <a
                href="#how-it-works"
                className="px-6 py-3 border border-gray-200 hover:border-gray-400 rounded-lg text-sm text-gray-500 hover:text-gray-900 transition"
              >
                How it works
              </a>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { value: "$0", label: "Monthly cost" },
              { value: "10+5", label: "Exchanges + chains" },
              { value: "<1s", label: "Context generation" },
              { value: "AES-256", label: "Encryption standard" },
            ].map((stat) => (
              <div key={stat.label} className="glass rounded-xl p-4 text-center">
                <div className="text-xl sm:text-2xl font-bold text-emerald-600">{stat.value}</div>
                <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900">How it works</h2>
            <p className="mt-3 text-gray-400 text-sm">Three steps to give every AI agent your full portfolio context.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Connect exchanges",
                desc: "Add Binance, OKX, Bybit, Coinbase, Kraken, KuCoin, and more with a read-only API key. We can never trade or withdraw.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.06a4.5 4.5 0 00-6.364-6.364L4.5 8.25a4.5 4.5 0 006.364 6.364l2.382-2.382" />
                  </svg>
                ),
              },
              {
                step: "02",
                title: "Context auto-generated",
                desc: "Your portfolio, allocation, and concentration are structured into clean context — updated every sync.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                  </svg>
                ),
              },
              {
                step: "03",
                title: "AI queries via MCP",
                desc: "One command connects Claude Code, Cursor, or any MCP-compatible agent. Ask anything about your portfolio.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div key={item.step} className="glass rounded-xl p-6 hover:border-gray-300 transition group">
                <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition">
                  {item.icon}
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
                <span className="text-amber-600">https://your-app.vercel.app/api/mcp</span>{" "}
                <span className="text-gray-400">--header</span>{" "}
                <span className="text-gray-700">&quot;Authorization: Bearer</span>{" "}
                <span className="text-emerald-600">YOUR_TOKEN</span>
                <span className="text-gray-700">&quot;</span>
              </div>
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
                  Security first
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Your keys, your control</h2>
                <p className="mt-3 text-sm text-gray-500 max-w-md leading-relaxed">
                  We take a read-only approach to your exchange data. Your API keys are encrypted at rest and we can never execute trades.
                </p>
              </div>
              <div className="flex-1 grid gap-3">
                {[
                  { text: "Read-only API keys — no trading or withdrawals", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
                  { text: "AES-256-GCM encryption for stored keys", icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" },
                  { text: "All data over TLS 1.3", icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" },
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

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Ready to give your AI agents{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
              portfolio context
            </span>
            ?
          </h2>
          <p className="mt-4 text-gray-400 max-w-md mx-auto text-sm">
            Free forever. Connect your first exchange in under 2 minutes.
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
          <div className="text-xs text-gray-300">
            Your portfolio context, everywhere.
          </div>
        </div>
      </footer>
    </div>
  );
}
