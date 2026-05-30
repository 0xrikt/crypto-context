import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Glass surface matching the landing-page aesthetic. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("glass rounded-xl", className)} {...props} />;
}
