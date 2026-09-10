import Link from "next/link";
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
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="text-base font-semibold tracking-tight">
          FitForge
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Link
            href={PROFILE_NAV.href}
            aria-label={PROFILE_NAV.label}
            className="flex size-10 items-center justify-center rounded-full border border-border text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground lg:hidden"
          >
            {/* Feature 002 replaces this with the signed-in member's initials. */}
            <span aria-hidden>FF</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
