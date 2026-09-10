import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * VI-008: 14px, medium weight, 6px above its input.
 *
 * A plain `<label>` rather than Radix's: `htmlFor` is all this needs, and plan §5 does
 * not approve a Radix dependency.
 */
export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("text-sm font-medium", className)} {...props} />;
}
