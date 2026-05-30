import type { ReactNode } from "react";

/** Shared auth-page chrome: grid bg, glow, wordmark, glass card, footer link. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-grid relative overflow-hidden">
      <div className="glow top-[-200px] left-1/2 -translate-x-1/2" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight text-gray-900">CryptoContext</span>
        </div>

        <div className="glass rounded-xl p-6 sm:p-8">
          <h1 className="text-xl font-bold text-center text-gray-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-400 text-center">{subtitle}</p>}
          {children}
        </div>

        {footer && <div className="mt-6 text-sm text-gray-400 text-center">{footer}</div>}
      </div>
    </div>
  );
}
