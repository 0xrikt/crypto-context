"use client";

import { useHydrated } from "@/lib/use-hydrated";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

export function Modal({
  open,
  onClose,
  children,
  className,
  label = "Confirmation",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  const mounted = useHydrated();
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !mounted) return;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const focusables = () => [...(dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex="0"]') ?? [])];
    (focusables()[0] ?? dialog.current)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const items = focusables();
        const index = items.indexOf(document.activeElement as HTMLElement);
        if (items.length === 0) {e.preventDefault();dialog.current?.focus();}
        else if (e.shiftKey && index <= 0) {e.preventDefault();items[items.length-1].focus();}
        else if (!e.shiftKey && (index === items.length-1 || index === -1)) {e.preventDefault();items[0].focus();}
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [open, onClose, mounted]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      ref={dialog}
      tabIndex={-1}
      aria-label={label}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-md bg-white rounded-2xl p-6 border border-gray-100 shadow-2xl shadow-gray-900/10 animate-[popIn_0.18s_ease-out]",
          className
        )}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
