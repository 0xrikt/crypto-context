"use client";

import {
  PortfolioSummary,
  AllocationChart,
  HoldingsTable,
  ContextInsights,
  OnboardingChecklist,
} from "@/components/dashboard";
import { useDashboard } from "@/components/dashboard/DashboardProvider";
import { Alert, EmptyState, Spinner } from "@/components/ui";

export default function OverviewPage() {
  const {
    portfolio,
    syncing,
    contextSyncing,
    contextDocs,
    hasAnySources,
    hasExchanges,
    hasPortfolio,
    hasActiveToken,
    lastSyncedAt,
    sync,
  } = useDashboard();

  const onboardingComplete = hasAnySources && hasPortfolio && hasActiveToken;
  const errors = portfolio?.errors ?? [];

  // --- Full portfolio view ---
  if (portfolio && portfolio.holdings.length > 0) {
    return (
      <div className="space-y-8">
        {!onboardingComplete && (
          <OnboardingChecklist
            hasAnySources={hasAnySources}
            hasPortfolio={hasPortfolio}
            hasActiveToken={hasActiveToken}
            syncing={syncing}
            onSync={sync}
          />
        )}

        {errors.length > 0 && (
          <Alert
            tone="warning"
            align="start"
            title={`Couldn't reach ${errors.length} source${errors.length > 1 ? "s" : ""}`}
          >
            {errors.map((e) => e.source).join(", ")} — showing the latest data we have. Try syncing again
            in a moment.
          </Alert>
        )}

        <PortfolioSummary
          portfolio={portfolio}
          syncing={syncing}
          contextSyncing={contextSyncing}
          lastSyncedAt={lastSyncedAt}
          onSync={sync}
        />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <AllocationChart holdings={portfolio.holdings} totalValue={portfolio.totalUsdValue} />
          </div>
          <div className="lg:col-span-3">
            <HoldingsTable holdings={portfolio.holdings} />
          </div>
        </div>

        {(contextDocs.length > 0 || hasExchanges) && <ContextInsights documents={contextDocs} />}
      </div>
    );
  }

  // --- First-run: no portfolio yet. Checklist drives the next action. ---
  return (
    <div className="space-y-6">
      <OnboardingChecklist
        hasAnySources={hasAnySources}
        hasPortfolio={hasPortfolio}
        hasActiveToken={hasActiveToken}
        syncing={syncing}
        onSync={sync}
      />

      <EmptyState
        icon={
          syncing ? (
            <Spinner size="md" />
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
              />
            </svg>
          )
        }
        title={
          syncing
            ? "Fetching your portfolio…"
            : hasAnySources
              ? "Ready to sync"
              : "Your portfolio appears here"
        }
        description={
          syncing
            ? "Reading balances and trade history from your connected sources."
            : hasAnySources
              ? "Run a sync from the checklist above to pull balances and analyze your trading history."
              : "Connect an exchange or wallet above and every agent you link will see the full picture."
        }
      />
    </div>
  );
}
