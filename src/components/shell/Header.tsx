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
export function Header({ displayName }: { displayName?: string }) {
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
            {/* Feature 002 phase 8 fills the hook phase 3 left here. The member's
                initials come from the shell's own session read, so the avatar cannot
                show one member above another member's page. */}
            <span aria-hidden>{initialsOf(displayName)}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

/**
 * At most two initials from a display name.
 *
 * Falls back to the wordmark's letters rather than to something invented: a member with
 * a name the split cannot handle should see FitForge's mark, not a stray character.
 */
function initialsOf(displayName?: string): string {
  const parts = (displayName ?? "").trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "FF";
  }

  return parts
    .slice(0, 2)
    .map((part) => [...part][0]!.toUpperCase())
    .join("");
}
