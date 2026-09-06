"use client";

import type { Holding } from "./types";
import { TokenIcon } from "@/components/icons/TokenIcon";

const BAR_COLORS = [
  "bg-emerald-500",
  "bg-blue-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-gray-400",
];

interface Props {
  holdings: Holding[];
}

export function HoldingsTable({ holdings }: Props) {
  if (holdings.length === 0) {
    return (
      <div className="glass rounded-xl p-6 flex items-center justify-center min-h-[280px]">
        <p className="text-sm text-gray-400">Connect a source to see holdings</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100">
        <h3 className="text-sm font-medium text-gray-500">Holdings</h3>
      </div>
      <div className="divide-y divide-gray-50">
        {holdings.map((h, i) => (
          <div key={h.asset} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50 transition">
            <TokenIcon symbol={h.asset} size={32} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">{h.asset}</span>
                <span className="text-sm font-medium text-gray-900 tabular-nums">
                  {h.priceUnavailable ? "Price unavailable" : `$${h.usdValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
                </span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-xs text-gray-400 tabular-nums">
                  {h.amount.toLocaleString("en-US", { maximumFractionDigits: 4 })}
                </span>
                <span className="text-xs text-gray-400 tabular-nums">{h.priceUnavailable ? "—" : `${h.allocation}%`}</span>
              </div>
              <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`}
                  style={{ width: `${Math.max(h.allocation, 1)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
