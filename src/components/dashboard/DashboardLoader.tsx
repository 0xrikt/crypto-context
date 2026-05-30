import { Spinner } from "@/components/ui";

/** Branded full-screen loader shown while the dashboard hydrates. */
export function DashboardLoader() {
  return (
    <div className="min-h-screen bg-grid relative flex items-center justify-center">
      <div className="glow left-1/2 top-1/3 -translate-x-1/2" aria-hidden="true" />
      <div className="relative flex flex-col items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <span className="font-semibold text-gray-900">CryptoContext</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Spinner size="sm" />
          Loading your portfolio…
        </div>
      </div>
    </div>
  );
}
