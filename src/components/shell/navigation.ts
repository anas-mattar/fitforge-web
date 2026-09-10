import {
  CalendarCheck,
  Dumbbell,
  History,
  LayoutList,
  Settings,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  readonly href: string;
  readonly label: string;
  readonly icon: LucideIcon;
};

/**
 * The five primary destinations, in the order VI-003 fixes: Today, Library, Programs,
 * History, Progress. Declared once and consumed by both the sidebar and the bottom tab
 * bar, so the two can never disagree about the order or drift apart when one gains an
 * item — "never reordered" only holds if there is a single list to not reorder.
 */
export const PRIMARY_NAV: readonly NavItem[] = [
  { href: "/", label: "Today", icon: CalendarCheck },
  { href: "/library", label: "Library", icon: Dumbbell },
  { href: "/programs", label: "Programs", icon: LayoutList },
  { href: "/history", label: "History", icon: History },
  { href: "/progress", label: "Progress", icon: TrendingUp },
];

/**
 * Sits below a divider in the sidebar and moves into the header avatar below 1024px
 * (VI-003, VI-006). Separate from PRIMARY_NAV because it is separate in the reference.
 */
export const PROFILE_NAV: NavItem = {
  href: "/profile",
  label: "Profile & settings",
  icon: Settings,
};
