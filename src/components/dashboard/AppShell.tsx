"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useDashboard } from "./DashboardProvider";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
      />
    ),
  },
  {
    href: "/dashboard/sources",
    label: "Data Sources",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
      />
    ),
  },
  {
    href: "/dashboard/mcp",
    label: "MCP Connection",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
      />
    ),
  },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
}

function Wordmark() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
        <svg
          className="w-3.5 h-3.5 text-emerald-600"
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
      <span className="font-semibold text-sm text-gray-900">CryptoContext</span>
    </div>
  );
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  /** When provided, items render as buttons (used by the dev preview harness). */
  onNavigate?: (href: string) => void;
}) {
  return (
    <>
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        const className = cn(
          "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap",
          active
            ? "bg-emerald-50 text-emerald-700"
            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
        );
        const inner = (
          <>
            <svg
              className={cn("w-4 h-4 flex-shrink-0", active ? "text-emerald-600" : "text-gray-400")}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.6}
              aria-hidden="true"
            >
              {item.icon}
            </svg>
            {item.label}
          </>
        );
        return onNavigate ? (
          <button
            key={item.href}
            type="button"
            onClick={() => onNavigate(item.href)}
            className={className}
            aria-current={active ? "page" : undefined}
          >
            {inner}
          </button>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            className={className}
            aria-current={active ? "page" : undefined}
          >
            {inner}
          </Link>
        );
      })}
    </>
  );
}

export function AppShell({
  children,
  activePath,
  onNavigate,
}: {
  children: ReactNode;
  /** Override the active route (dev preview only). */
  activePath?: string;
  /** When provided, nav renders as buttons calling this instead of routing. */
  onNavigate?: (href: string) => void;
}) {
  const pathname = usePathname();
  const currentPath = activePath ?? pathname;
  const { user, logout } = useDashboard();

  return (
    <div className="min-h-screen bg-grid relative">
      <div className="glow -left-32 -top-24" aria-hidden="true" />

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 flex-col glass border-r border-gray-200/70 px-3 py-5 z-20">
        <div className="px-2 mb-6">
          <Wordmark />
        </div>
        <nav className="flex flex-col gap-1">
          <NavLinks pathname={currentPath} onNavigate={onNavigate} />
        </nav>
        <div className="mt-auto pt-4 border-t border-gray-200/70">
          <div className="px-2 mb-2 truncate text-xs text-gray-400" title={user?.email}>
            {user?.email}
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition"
          >
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.6}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
              />
            </svg>
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-20 glass border-b border-gray-200/70">
        <div className="flex items-center justify-between px-4 py-3">
          <Wordmark />
          <button
            onClick={logout}
            className="text-xs text-gray-400 hover:text-gray-700 transition"
          >
            Log out
          </button>
        </div>
        <nav className="flex items-center gap-1 px-3 pb-2 overflow-x-auto">
          <NavLinks pathname={currentPath} onNavigate={onNavigate} />
        </nav>
      </header>

      {/* Main content */}
      <div className="lg:pl-60">
        <main className="max-w-5xl mx-auto px-5 sm:px-8 py-8 relative">{children}</main>
      </div>
    </div>
  );
}
