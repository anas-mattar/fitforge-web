import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * VI-006 and VI-018: rounded corners, a 1px `--border`, `--card` fill. Padding differs
 * by screen — 24px on sign-in, 20px on profile — so it is passed in rather than baked
 * in, and the caller cites the VI item it is satisfying.
 */
export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-lg border border-border bg-card", className)}
      {...props}
    />
  );
}
