"use client";

import { useState } from "react";

interface ContextDoc {
  dimension: string;
  content: string;
  metadata: Record<string, unknown>;
  updatedAt: string;
}

interface Props {
  documents: ContextDoc[];
}

function TradingProfileCard({ doc }: { doc: ContextDoc }) {
  const [expanded, setExpanded] = useState(false);
  const meta = doc.metadata;

  const tradeCount = (meta.tradeCount as number) ?? 0;
  const tradesPerWeek = (meta.tradesPerWeek as number) ?? 0;
  const uniquePairs = (meta.uniquePairs as number) ?? 0;
  const hasOpenOrders = (meta.hasOpenOrders as boolean) ?? false;
  const dateRange = (meta.dateRange as string) ?? "";

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          <h3 className="text-sm font-medium text-gray-700">Trading Profile</h3>
        </div>
        <span className="text-xs text-gray-400">
          {new Date(doc.updatedAt).toLocaleDateString()}
        </span>
      </div>

      <div className="p-5">
        {tradeCount === 0 ? (
          <p className="text-sm text-gray-400">No trade history found. This account may be used primarily for holding.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div>
                <div className="text-xs text-gray-400">Trades</div>
                <div className="text-lg font-bold text-gray-900">{tradeCount}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Trades/Week</div>
                <div className="text-lg font-bold text-gray-900">{tradesPerWeek.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Pairs Traded</div>
                <div className="text-lg font-bold text-gray-900">{uniquePairs}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Open Orders</div>
                <div className="text-lg font-bold text-gray-900">{hasOpenOrders ? "Yes" : "None"}</div>
              </div>
            </div>
            {dateRange && (
              <p className="text-xs text-gray-400 mb-3">Period: {dateRange}</p>
            )}
          </>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-emerald-600 hover:text-emerald-500 transition flex items-center gap-1"
        >
          {expanded ? "Hide" : "Show"} full profile
          <svg
            className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {expanded && (
          <pre className="mt-3 p-4 bg-gray-50 rounded-lg text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed border border-gray-100">
            {doc.content}
          </pre>
        )}
      </div>
    </div>
  );
}

function FundFlowCard({ doc }: { doc: ContextDoc }) {
  const [expanded, setExpanded] = useState(false);
  const meta = doc.metadata;

  const totalDeposits = (meta.totalDeposits as number) ?? 0;
  const totalWithdrawals = (meta.totalWithdrawals as number) ?? 0;
  const totalTransfers = (meta.totalTransfers as number) ?? 0;
  const fundingPattern = (meta.fundingPattern as string) ?? "unknown";
  const dateRange = (meta.dateRange as string) ?? "";

  const patternLabels: Record<string, string> = {
    regular: "Regular (DCA-like)",
    lump_sum: "Lump Sum",
    mixed: "Mixed",
    inactive: "Inactive",
  };

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
          <h3 className="text-sm font-medium text-gray-700">Fund Flow</h3>
        </div>
        <span className="text-xs text-gray-400">
          {new Date(doc.updatedAt).toLocaleDateString()}
        </span>
      </div>

      <div className="p-5">
        {totalTransfers === 0 ? (
          <p className="text-sm text-gray-400">No deposit or withdrawal history found.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div>
                <div className="text-xs text-gray-400">Deposits</div>
                <div className="text-lg font-bold text-emerald-600">{totalDeposits}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Withdrawals</div>
                <div className="text-lg font-bold text-rose-500">{totalWithdrawals}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Total Transfers</div>
                <div className="text-lg font-bold text-gray-900">{totalTransfers}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Pattern</div>
                <div className="text-sm font-bold text-gray-900">{patternLabels[fundingPattern] ?? fundingPattern}</div>
              </div>
            </div>
            {dateRange && (
              <p className="text-xs text-gray-400 mb-3">Period: {dateRange}</p>
            )}
          </>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-emerald-600 hover:text-emerald-500 transition flex items-center gap-1"
        >
          {expanded ? "Hide" : "Show"} full analysis
          <svg
            className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {expanded && (
          <pre className="mt-3 p-4 bg-gray-50 rounded-lg text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed border border-gray-100">
            {doc.content}
          </pre>
        )}
      </div>
    </div>
  );
}

export function ContextInsights({ documents }: Props) {
  const tradingProfiles = documents.filter((d) => d.dimension === "trading_profile");
  const fundFlows = documents.filter((d) => d.dimension === "fund_flow");

  if (documents.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Context Insights</h2>
        <p className="text-xs text-gray-400 mb-4">Trading patterns and fund flow analysis</p>
        <div className="glass rounded-xl p-6 text-center">
          <p className="text-sm text-gray-400">
            Context not yet generated. Click &quot;Sync&quot; above to analyze your trading history.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-bold text-gray-900 mb-1">Context Insights</h2>
      <p className="text-xs text-gray-400 mb-4">Trading patterns and fund flow analysis — fed to AI agents via MCP</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {tradingProfiles.map((doc, i) => (
          <TradingProfileCard key={`tp-${i}`} doc={doc} />
        ))}
        {fundFlows.map((doc, i) => (
          <FundFlowCard key={`ff-${i}`} doc={doc} />
        ))}
      </div>
    </section>
  );
}
