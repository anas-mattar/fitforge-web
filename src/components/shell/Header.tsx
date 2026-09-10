import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ApiHealthIndicator } from "./ApiHealthIndicator";
import { ThemeToggle } from "./ThemeToggle";
import { PROFILE_NAV } from "./navigation";

/**
 * VI-007: sticky to the top, 1px bottom border, --card at 95% opacity with a backdrop
 * blur. VI-006: below 1024px the avatar is where Profile & settings lives, since the
 * bottom tab bar carries only the five primary destinations.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4">
        <Link href="/" className="text-base font-semibold tracking-tight">
          FitForge
        </Link>

        <div className="ml-auto flex items-center gap-3">
          <ApiHealthIndicator />
          <ThemeToggle />
          <Link
            href={PROFILE_NAV.href}
            aria-label={PROFILE_NAV.label}
            // buttonVariants, not a hand-copy. Phase 3 duplicated the secondary/icon
            // classes here and the file's own comment offers this escape hatch for
            // exactly this case; a copy drifts the first time the variant changes and
            // nothing tells you. rounded-full is the deliberate part — an avatar, not a
            // button — so it overrides the variant's radius rather than restating it.
            className={cn(
              buttonVariants({ variant: "secondary", size: "icon" }),
              "rounded-full border border-border bg-transparent text-muted-foreground lg:hidden",
            )}
          >
            {/* Feature 002 replaces this with the signed-in member's initials. */}
            <span aria-hidden>FF</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
