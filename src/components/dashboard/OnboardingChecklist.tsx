"use client";

import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/cn";

interface Props {
  hasAnySources: boolean;
  hasPortfolio: boolean;
  hasActiveToken: boolean;
  syncing: boolean;
  onSync: () => void;
}

interface Step {
  key: "connect" | "portfolio" | "token";
  title: string;
  description: string;
  done: boolean;
}

const CheckIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

/**
 * Adaptive first-run checklist. Marks each step done from live state, highlights
 * the first incomplete step, and surfaces exactly one contextual CTA.
 */
export function OnboardingChecklist({
  hasAnySources,
  hasPortfolio,
  hasActiveToken,
  syncing,
  onSync,
}: Props) {
  const steps: Step[] = [
    {
      key: "connect",
      title: "Connect a data source",
      description: "Link an exchange or wallet so we can read your balances and trade history.",
      done: hasAnySources,
    },
    {
      key: "portfolio",
      title: "See your portfolio",
      description: "Sync to pull every venue into one complete, unified picture.",
      done: hasPortfolio,
    },
    {
      key: "token",
      title: "Create an MCP token",
      description: "Generate a token so Claude, Cursor, or any agent can read your context.",
      done: hasActiveToken,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const total = steps.length;
  const firstIncomplete = steps.findIndex((s) => !s.done);

  return (
    <Card className="relative overflow-hidden p-6 sm:p-7">
      <div className="glow -right-24 -top-20" aria-hidden="true" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">Get started</h2>
          <span className="text-xs font-medium text-gray-400 whitespace-nowrap">
            {doneCount} of {total} done
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-0.5 mb-4">
          Three steps to a complete, agent-ready portfolio context.
        </p>

        <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden mb-6">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
            style={{ width: `${(doneCount / total) * 100}%` }}
          />
        </div>

        <ol className="space-y-1.5">
          {steps.map((step, i) => {
            const isActive = i === firstIncomplete;
            return (
              <li
                key={step.key}
                className={cn(
                  "flex items-center gap-3.5 rounded-xl p-3 transition",
                  isActive && "bg-emerald-50/70 ring-1 ring-emerald-200"
                )}
              >
                <div
                  className={cn(
                    "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold",
                    step.done
                      ? "bg-emerald-600 text-white"
                      : isActive
                        ? "bg-white text-emerald-700 ring-2 ring-emerald-400"
                        : "bg-gray-100 text-gray-400"
                  )}
                >
                  {step.done ? CheckIcon : i + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <div
                    className={cn(
                      "text-sm font-medium",
                      step.done ? "text-gray-400 line-through" : "text-gray-900"
                    )}
                  >
                    {step.title}
                  </div>
                  {!step.done && <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>}
                </div>

                {isActive && (
                  <div className="flex-shrink-0">
                    {step.key === "portfolio" ? (
                      <Button size="sm" onClick={onSync} loading={syncing}>
                        Sync now
                      </Button>
                    ) : (
                      <Link href={step.key === "connect" ? "/dashboard/sources" : "/dashboard/mcp"}>
                        <Button size="sm">{step.key === "connect" ? "Connect" : "Create token"}</Button>
                      </Link>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </Card>
  );
}
