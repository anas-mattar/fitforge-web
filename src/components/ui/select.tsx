import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * VI-020 to VI-022: 40px tall, full width.
 *
 * A native `<select>`, not a Radix listbox. Plan §5 approves no Radix dependency, and
 * on the phone this product is used on, the native control is the one that opens the
 * platform picker a member already knows.
 */
export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-md border border-input bg-background px-3 text-sm",
        "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
