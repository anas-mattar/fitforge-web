import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * VI-008. Buttons are 40px tall (`h-10`) with radius `md`. Primary is a --primary fill
 * on --primary-foreground; secondary is a bordered transparent button that takes
 * --accent on hover.
 *
 * The height is not cosmetic. Annotation H2 on the session screen — the screen this
 * application exists for — reads "never smaller; this screen is used with sweaty
 * thumbs". So `h-10` is the floor for anything a member taps mid-set, and there is
 * deliberately no smaller size variant here to reach for.
 *
 * No `asChild`: shadcn's version takes a Radix dependency to support it, plan §5 does
 * not approve one, and nothing needs it yet. A link that should look like a button can
 * use `buttonVariants()` directly.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:opacity-90",
        // text-foreground is NOT redundant with inheritance. A <button> carries the
        // user agent's `color: buttontext`, which does not inherit, so a variant that
        // sets no colour renders near-black in BOTH themes — dark text on a dark card.
        // Found in feature 002 phase 9's Visual Compliance Loop on the profile screen,
        // measured: this button stayed rgb(9,9,11) while every sibling moved to
        // rgb(250,250,250). It is a feature 001 defect and it is fixed here because
        // the profile screen cannot meet its dark reference while it stands.
        secondary:
          "border border-border bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:opacity-90",
      },
      size: {
        default: "h-10 px-4",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
