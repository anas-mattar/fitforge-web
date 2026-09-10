import { BottomNav } from "@/components/shell/BottomNav";
import { Header } from "@/components/shell/Header";
import { Sidebar } from "@/components/shell/Sidebar";

/**
 * The authenticated shell: header, sidebar, bottom bar.
 *
 * It moved here from the root layout in feature 002 phase 7. VI-015 requires the
 * sign-in screen to render with NO shell, and the honest way to guarantee that is for
 * the shell to belong to a route group the sign-in screen is not in — rather than a
 * conditional inside the shell, which is one `if` away from leaking navigation onto a
 * screen a visitor with no account should never see.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />

      {/* VI-001 of feature 001: 220px sidebar column, fluid content column, 1rem gap.
          Below 1024px the grid collapses to one column and BottomNav takes over. */}
      <div className="mx-auto grid w-full max-w-[1400px] flex-1 gap-4 px-4 py-6 lg:grid-cols-[220px_1fr]">
        <Sidebar />
        <main className="min-w-0">{children}</main>
      </div>

      <BottomNav />
    </>
  );
}
