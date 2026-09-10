import { NavLink } from "./NavLink";
import { PRIMARY_NAV } from "./navigation";

/**
 * The mobile navigation, shown below 1024px.
 *
 * VI-006: exactly five items — the same five as the sidebar, from the same list — and
 * Profile & settings is NOT among them; it lives in the header avatar at this width.
 * This is a replacement for the sidebar, not a second copy of it: at any viewport
 * exactly one of the two is present.
 */
export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 z-40 flex border-t border-border bg-card/95 px-2 py-1.5 backdrop-blur lg:hidden"
    >
      {PRIMARY_NAV.map(({ href, label, icon: Icon }) => (
        <NavLink
          key={href}
          href={href}
          label={label}
          icon={<Icon className="size-5" aria-hidden />}
          variant="bottom"
        />
      ))}
    </nav>
  );
}
