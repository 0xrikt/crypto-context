import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "gray" | "emerald" | "red" | "amber" | "blue";

const TONES: Record<Tone, string> = {
  gray: "bg-gray-100 text-gray-500",
  emerald: "bg-emerald-50 text-emerald-600",
  red: "bg-red-50 text-red-500",
  amber: "bg-amber-50 text-amber-600",
  blue: "bg-blue-50 text-blue-600",
};

export function Badge({
  tone = "gray",
  children,
  className,
  dot = false,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium",
        TONES[tone],
        className
      )}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
