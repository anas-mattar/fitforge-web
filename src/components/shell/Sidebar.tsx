import { NavLink } from "./NavLink";
import { PRIMARY_NAV, PROFILE_NAV } from "./navigation";

/**
 * The 220px navigation column, shown at 1024px and above.
 *
 * VI-001/VI-002: a bordered card — 1px --border, --card background, radius --radius,
 * 0.75rem padding. VI-003: the five destinations in fixed order, then Profile & settings
 * below a 1px divider. Below 1024px this is not hidden but replaced, by BottomNav.
 */
export function Sidebar() {
  return (
    <aside className="hidden rounded-lg border border-border bg-card p-3 lg:block">
      <nav aria-label="Primary" className="space-y-0.5 text-sm">
        {PRIMARY_NAV.map(({ href, label, icon: Icon }) => (
          <NavLink
            key={href}
            href={href}
            label={label}
            icon={<Icon className="size-4" aria-hidden />}
            variant="sidebar"
          />
        ))}
      </nav>
      <div className="mt-4 border-t border-border pt-3">
        <NavLink
          href={PROFILE_NAV.href}
          label={PROFILE_NAV.label}
          icon={<PROFILE_NAV.icon className="size-4" aria-hidden />}
          variant="sidebar"
        />
      </div>
    </aside>
  );
}
