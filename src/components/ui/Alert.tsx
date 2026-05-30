import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "error" | "success" | "warning" | "info";

const PATHS: Record<Tone, string> = {
  success: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  error: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z",
  warning:
    "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",
  info: "M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z",
};

const TONES: Record<Tone, { wrap: string; icon: string; text: string }> = {
  success: { wrap: "bg-emerald-50 border-emerald-200", icon: "text-emerald-600", text: "text-emerald-700" },
  error: { wrap: "bg-red-50 border-red-200", icon: "text-red-500", text: "text-red-600" },
  warning: { wrap: "bg-amber-50 border-amber-200", icon: "text-amber-500", text: "text-amber-700" },
  info: { wrap: "bg-gray-50 border-gray-200", icon: "text-emerald-600", text: "text-gray-600" },
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
  align = "center",
}: {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
  align?: "center" | "start";
}) {
  const t = TONES[tone];
  return (
    <div
      className={cn(
        "flex gap-2.5 p-3 rounded-lg border",
        align === "center" ? "items-center" : "items-start",
        t.wrap,
        className
      )}
      role={tone === "error" ? "alert" : "status"}
    >
      <svg
        className={cn("w-4 h-4 flex-shrink-0", t.icon, align === "start" && "mt-0.5")}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={PATHS[tone]} />
      </svg>
      <div className={cn("text-sm leading-relaxed min-w-0", t.text)}>
        {title && <div className="font-medium">{title}</div>}
        {children && <div className={title ? "mt-0.5 text-xs opacity-90" : ""}>{children}</div>}
      </div>
    </div>
  );
}
