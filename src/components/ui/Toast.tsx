"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

type Tone = "success" | "error" | "info";

interface ToastItem {
  id: number;
  tone: Tone;
  message: string;
}

interface ToastApi {
  toast: (message: string, tone?: Tone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi>({
  toast: () => {},
  success: () => {},
  error: () => {},
});

let counter = 0;

const TONE_STYLES: Record<Tone, { bar: string; icon: string; path: string }> = {
  success: {
    bar: "bg-emerald-500",
    icon: "text-emerald-600",
    path: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  error: {
    bar: "bg-red-500",
    icon: "text-red-500",
    path: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z",
  },
  info: {
    bar: "bg-gray-400",
    icon: "text-gray-500",
    path: "M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z",
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message: string, tone: Tone = "info") => {
      const id = ++counter;
      setToasts((prev) => [...prev, { id, tone, message }]);
      setTimeout(() => remove(id), 4200);
    },
    [remove]
  );

  const api = useMemo<ToastApi>(
    () => ({
      toast: push,
      success: (m) => push(m, "success"),
      error: (m) => push(m, "error"),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Toaster toasts={toasts} onClose={remove} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  return useContext(ToastContext);
}

function Toaster({ toasts, onClose }: { toasts: ToastItem[]; onClose: (id: number) => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 w-[min(22rem,calc(100vw-2rem))]">
      {toasts.map((t) => {
        const s = TONE_STYLES[t.tone];
        return (
          <div
            key={t.id}
            className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-lg shadow-gray-900/5 pl-0 pr-3 py-3 overflow-hidden animate-[slideIn_0.2s_ease-out]"
            role="status"
          >
            <span className={cn("w-1 self-stretch rounded-full", s.bar)} />
            <svg
              className={cn("w-4 h-4 flex-shrink-0", s.icon)}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={s.path} />
            </svg>
            <p className="text-sm text-gray-700 flex-1 min-w-0">{t.message}</p>
            <button
              onClick={() => onClose(t.id)}
              className="text-gray-300 hover:text-gray-600 transition flex-shrink-0"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
