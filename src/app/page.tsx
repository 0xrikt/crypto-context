import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <span className="text-lg font-semibold tracking-tight">
          CryptoContext
        </span>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-100 transition"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 rounded-lg transition"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-3xl mx-auto px-6 pt-24 pb-32">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
          Every AI tool already knows
          <br />
          <span className="text-emerald-400">what you hold.</span>
        </h1>
        <p className="mt-6 text-lg text-zinc-400 max-w-xl">
          Connect your exchanges and wallets once. CryptoContext structures your
          portfolio into a personal context layer that any AI agent can query via
          MCP — so you never explain your positions again.
        </p>

        <div className="mt-10 flex gap-4">
          <Link
            href="/signup"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition"
          >
            Connect your first exchange
          </Link>
          <a
            href="#how-it-works"
            className="px-6 py-3 border border-zinc-700 hover:border-zinc-500 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 transition"
          >
            How it works
          </a>
        </div>

        {/* How it works */}
        <section id="how-it-works" className="mt-32">
          <h2 className="text-2xl font-bold">How it works</h2>
          <div className="mt-8 grid gap-8">
            {[
              {
                step: "1",
                title: "Connect your exchanges",
                desc: "Add your Binance, OKX, or other exchange with a read-only API key. We can never trade or withdraw your funds.",
              },
              {
                step: "2",
                title: "Context is auto-generated",
                desc: "Your portfolio, allocation, and concentration are structured into clean context files — updated every time you sync.",
              },
              {
                step: "3",
                title: "AI agents query via MCP",
                desc: 'Add one line to Claude Code or Cursor. When you ask "analyze my portfolio risk," the AI already knows exactly what you hold.',
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center text-sm font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-zinc-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* MCP Setup */}
        <section className="mt-24">
          <h2 className="text-2xl font-bold">One command to connect</h2>
          <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-lg p-4 font-mono text-sm text-zinc-300 overflow-x-auto">
            <span className="text-zinc-500">$</span> claude mcp add
            --transport http crypto-ctx
            https://app-rho-jet-70.vercel.app/api/mcp --header
            &quot;Authorization: Bearer YOUR_TOKEN&quot;
          </div>
          <p className="mt-3 text-sm text-zinc-500">
            Works with Claude Code, Cursor, and any MCP-compatible agent.
          </p>
        </section>

        {/* Security */}
        <section className="mt-24">
          <h2 className="text-2xl font-bold">Security first</h2>
          <div className="mt-6 grid gap-3 text-sm text-zinc-400">
            {[
              "Read-only API keys only — we cannot trade or withdraw",
              "Keys encrypted with AES-256-GCM before storage",
              "All data transmitted over TLS 1.3",
              "You can delete all your data at any time",
              "Open source — verify our claims yourself",
            ].map((item) => (
              <div key={item} className="flex gap-2">
                <span className="text-emerald-400 flex-shrink-0">
                  &#10003;
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 text-center text-sm text-zinc-600">
        CryptoContext — your portfolio context, everywhere.
      </footer>
    </div>
  );
}
