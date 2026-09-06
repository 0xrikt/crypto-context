"use client";

import type { Holding } from "./types";
import { TokenIcon } from "@/components/icons/TokenIcon";

const COLORS = [
  "#10b981", // emerald-500
  "#3b82f6", // blue-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#f43f5e", // rose-500
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
];
const OTHER_COLOR = "#d1d5db"; // gray-300

interface Props {
  holdings: Holding[];
  totalValue: number;
}

export function AllocationChart({ holdings, totalValue }: Props) {
  if (holdings.length === 0 || totalValue === 0) {
    return (
      <div className="glass rounded-xl p-6 flex items-center justify-center min-h-[280px]">
        <p className="text-sm text-gray-400">No holdings to display</p>
      </div>
    );
  }

  const maxSlices = 6;
  const topHoldings = holdings.slice(0, maxSlices);
  const otherValue = holdings
    .slice(maxSlices)
    .reduce((sum, h) => sum + h.usdValue, 0);

  const slices: Array<{ label: string; value: number; pct: number; color: string }> = topHoldings.map(
    (h, i) => ({
      label: h.asset,
      value: h.usdValue,
      pct: h.allocation,
      color: COLORS[i % COLORS.length],
    })
  );

  if (otherValue > 0) {
    slices.push({
      label: "Other",
      value: otherValue,
      pct: Number(((otherValue / totalValue) * 100).toFixed(1)),
      color: OTHER_COLOR,
    });
  }

  const gradientStops = slices.map((s, i) => {
    const start = slices.slice(0, i).reduce((sum, row) => sum + row.pct, 0);
    return `${s.color} ${start}% ${start + s.pct}%`;
  });

  const conicGradient = `conic-gradient(${gradientStops.join(", ")})`;

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-4">Allocation</h3>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Donut */}
        <div className="relative flex-shrink-0">
          <div
            className="w-[140px] h-[140px] rounded-full"
            style={{ background: conicGradient }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[90px] h-[90px] rounded-full bg-white flex items-center justify-center">
              <div className="text-center">
                <div className="text-xs text-gray-400">Total</div>
                <div className="text-sm font-bold text-gray-900">
                  ${totalValue >= 1000
                    ? `${(totalValue / 1000).toFixed(1)}K`
                    : totalValue.toFixed(0)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2 min-w-0 w-full">
          {slices.map((s) => (
            <div key={s.label} className="flex items-center gap-2 text-sm">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: s.color }}
              />
              {s.label !== "Other" && <TokenIcon symbol={s.label} size={18} />}
              <span className="text-gray-700 truncate flex-1">{s.label}</span>
              <span className="text-gray-400 text-xs tabular-nums">{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
