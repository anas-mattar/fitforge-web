/**
 * The unauthenticated shell — which is to say, no shell at all.
 *
 * VI-015: no sidebar, no bottom bar, no header on the sign-in screen. This is a
 * ROUTE-GROUP decision rather than a conditional inside the shell, and the difference
 * matters: a conditional is one `if` away from leaking navigation onto a screen a
 * visitor with no account should never see, and every future screen added to this group
 * inherits the right answer without anyone remembering to.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return <div className="min-h-full">{children}</div>;
}
