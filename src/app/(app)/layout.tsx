import { redirect } from "next/navigation";
import { BottomNav } from "@/components/shell/BottomNav";
import { Header } from "@/components/shell/Header";
import { Sidebar } from "@/components/shell/Sidebar";
import { getMe } from "@/lib/api-auth";
import { readSessionToken } from "@/lib/session";

/**
 * The authenticated shell, and the gate in front of it.
 *
 * FR-007: an unauthenticated visitor is redirected to sign-in **without member data
 * being rendered**. Doing it in the layout is what makes the second half true — the
 * redirect is thrown before any child page renders, so there is no window in which a
 * page component runs without a member and improvises.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const token = await readSessionToken();

  if (!token) {
    redirect("/sign-in");
  }

  // The AUTHORITATIVE check, and the reason there is no cookie-presence shortcut in
  // middleware: a cookie proves someone once had a session, not that they still do.
  // Expired, revoked, and belonging-to-a-deleted-member all look identical to a cookie
  // and are all resolved here (contracts/auth.md §5).
  const me = await getMe(token);

  if (!me.ok) {
    // Including the unreachable-API case. Rendering the shell with no member would mean
    // showing someone else's last-rendered name or an empty one, and neither is better
    // than sending them to sign in.
    redirect("/sign-in");
  }

  return (
    <>
      <Header displayName={me.value.member.displayName} />

      {/* Feature 001 VI-001: 220px sidebar column, fluid content column, 1rem gap.
          Below 1024px the grid collapses to one column and BottomNav takes over. */}
      <div className="mx-auto grid w-full max-w-[1400px] flex-1 gap-4 px-4 py-6 lg:grid-cols-[220px_1fr]">
        <Sidebar />
        <main className="min-w-0">{children}</main>
      </div>

      <BottomNav />
    </>
  );
}
