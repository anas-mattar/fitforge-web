import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountCard } from "@/components/profile/AccountCard";
import { PreferencesCard } from "@/components/profile/PreferencesCard";
import { getMe } from "@/lib/api-auth";
import { readSessionToken } from "@/lib/session";

export const metadata: Metadata = {
  title: "Profile · FitForge",
};

/**
 * Profile — VI-017 through VI-028.
 *
 * Two declared deviations from the reference, both from `spec.md` and neither
 * discovered here:
 *
 *  - **No "My gear" card.** Gear is the exercise library's catalog (INV-003 / INV-012,
 *    feature 003). Building it here would claim territory 003 needs and create a
 *    catalog neither feature owns. The right column holds the Account card alone.
 *  - **No "Export my data" button.** No spec defines what the export contains or what
 *    format it takes, and a button that produces nothing is worse than an absent one.
 *    VI-025 therefore lists two buttons where the reference shows three.
 */
export default async function ProfilePage() {
  const token = await readSessionToken();

  // The layout already gated this route; this is the read, not a second gate. If the
  // session died between the layout's call and this one, redirecting is the same answer
  // the layout would have given.
  const me = token ? await getMe(token) : null;

  if (!me?.ok) {
    redirect("/sign-in");
  }

  return (
    // VI-017: two EQUAL columns at >=1024px, 16px gap; one column below.
    <div className="grid gap-4 lg:grid-cols-2">
      <PreferencesCard member={me.value.member} profile={me.value.profile} />

      {/* The right column stacks its cards with 16px between them — one card today,
          and the stack is what feature 003 adds "My gear" to. */}
      <div className="flex flex-col gap-4">
        <AccountCard member={me.value.member} />
      </div>
    </div>
  );
}
