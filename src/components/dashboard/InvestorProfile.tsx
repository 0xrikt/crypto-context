"use client";

import { useDashboard } from "./DashboardProvider";
import { Spinner } from "@/components/ui";

function SourceBadge({ source }: { source: "llm" | "deterministic" }) {
  if (source === "llm") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.456-2.456L14.25 6l1.035-.259a3.375 3.375 0 002.456-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
        </svg>
        AI-generated
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500 ring-1 ring-inset ring-gray-400/20">
      Rule-based
    </span>
  );
}

export function InvestorProfile() {
  const { investorProfile, profileGenerating, generateProfile, hasPortfolio } = useDashboard();

  // Nothing to show and nothing to generate from — stay out of the way.
  if (!investorProfile && !hasPortfolio) return null;

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Investor Profile</h2>
          <p className="text-xs text-gray-400">
            Your holistic investor identity — the headline every connected agent reads first
          </p>
        </div>
        {hasPortfolio && (
          <button
            onClick={generateProfile}
            disabled={profileGenerating}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-600/20 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
          >
            {profileGenerating ? (
              <>
                <Spinner size="sm" />
                Analyzing…
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                {investorProfile ? "Regenerate" : "Generate"}
              </>
            )}
          </button>
        )}
      </div>

      {!investorProfile ? (
        <div className="glass rounded-xl p-8 text-center">
          {profileGenerating ? (
            <div className="flex flex-col items-center gap-3">
              <Spinner size="md" />
              <p className="text-sm text-gray-500">
                Reading your holdings and trading history to build your profile…
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Generate a rich profile of how you invest — trading style, risk posture, and concrete
              guidance your agents can act on.
            </p>
          )}
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          {/* Summary headline */}
          <div className="border-b border-gray-100 bg-gradient-to-br from-emerald-50/60 to-transparent px-6 py-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <SourceBadge source={investorProfile.source} />
              <span className="text-[11px] text-gray-400">
                {new Date(investorProfile.generatedAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            <p className="text-base leading-relaxed text-gray-800">{investorProfile.summary}</p>
          </div>

          <div className="space-y-5 px-6 py-5">
            {/* Trading style + Risk posture */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {investorProfile.tradingStyle && (
                <div>
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Trading style
                  </div>
                  <p className="text-sm leading-relaxed text-gray-700">{investorProfile.tradingStyle}</p>
                </div>
              )}
              {investorProfile.riskProfile && (
                <div>
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Risk posture
                  </div>
                  <p className="text-sm leading-relaxed text-gray-700">{investorProfile.riskProfile}</p>
                </div>
              )}
            </div>

            {/* Preferences as chips */}
            {investorProfile.preferences.length > 0 && (
              <div>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Preferences
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {investorProfile.preferences.map((p, i) => (
                    <span
                      key={i}
                      className="rounded-lg bg-gray-50 px-2.5 py-1 text-xs text-gray-600 ring-1 ring-inset ring-gray-200"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Behaviors */}
            {investorProfile.behaviors.length > 0 && (
              <div>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Observed behaviors
                </div>
                <ul className="space-y-1.5">
                  {investorProfile.behaviors.map((b, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-700">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Agent guidance — the actionable core, highlighted */}
            {investorProfile.agentGuidance.length > 0 && (
              <div className="rounded-xl border border-emerald-600/15 bg-emerald-50/50 p-4">
                <div className="mb-2 flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                    How your agents should help you
                  </div>
                </div>
                <ul className="space-y-1.5">
                  {investorProfile.agentGuidance.map((g, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-700">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-600" />
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
