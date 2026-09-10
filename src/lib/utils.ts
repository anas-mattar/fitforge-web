import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names, letting a later Tailwind utility win over an earlier one of the
 * same kind. Every shadcn/ui component generated into `src/components/ui/` expects this
 * to exist at `@/lib/utils` — it is the one import the generator hard-codes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
