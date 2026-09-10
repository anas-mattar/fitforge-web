import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * VI-009: height 40px, full width, rounded, `--input` border, `--background` fill, 12px
 * horizontal padding, 14px text, and a 2px focus ring in `--ring`.
 *
 * The focus ring is not decoration. It is the only indication a keyboard user has of
 * where they are, and the reference specifies its width and colour precisely.
 */
export function Input({ className, type = "text", ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "h-10 w-full rounded-md border border-input bg-background px-3 text-sm",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
