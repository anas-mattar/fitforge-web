"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * One navigation item. Client-side only because the active state depends on the current
 * pathname — keeping that here means the sidebar, the bottom bar and the header stay
 * server components, which is the default plan §4.6 sets.
 *
 * `icon` is a rendered element, not a component: a function cannot cross the
 * server-to-client boundary, so the server renders the icon and passes the result.
 */
export function NavLink({
  href,
  label,
  icon,
  variant,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  variant: "sidebar" | "bottom";
}) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  if (variant === "bottom") {
    // px-1, not px-2: at 375px the five items divide the width evenly, and "Programs"
    // clears a px-2 box by less than a pixel. That is not a fit — a 360px device, a
    // larger default font size, or the fallback face before Inter loads all break it.
    // The reference does not specify the bar's internal padding, so this buys headroom
    // without departing from it.
    return (
      <Link
        href={href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-md px-1 py-1.5 text-xs",
          isActive ? "font-medium text-foreground" : "text-muted-foreground",
        )}
      >
        {icon}
        {label}
      </Link>
    );
  }

  // VI-004/VI-005: 0.75rem x 0.5rem padding, radius md, 0.875rem text, 0.625rem gap.
  // Active is --secondary on --secondary-foreground at medium weight; inactive is
  // --muted-foreground, and --accent appears on hover only — as a background, and
  // nothing else. Phase 3 also set hover:text-accent-foreground, which the reference
  // does not have; the recorded compliance loop marked VI-004 PASS anyway, because it
  // compared the resting colours and never hovered anything.
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm",
        isActive
          ? "bg-secondary font-medium text-secondary-foreground"
          : "text-muted-foreground hover:bg-accent",
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
