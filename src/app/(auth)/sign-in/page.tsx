import type { Metadata } from "next";
import { SignInCard } from "@/components/auth/SignInCard";

export const metadata: Metadata = {
  title: "Sign in · FitForge",
};

/**
 * Sign in and register — VI-001 through VI-016.
 *
 * One screen, two modes. The segmented control switches the card in place rather than
 * routing away (spec, declared deviations): the reference shows one card, and a member
 * who mistyped their address should not lose what they typed to a navigation.
 */
export default function SignInPage() {
  return (
    // VI-001: two columns at >=1024px, sized 1fr and 380px, 24px gap. BELOW 1024px the
    // left panel is not rendered at all (annotation A1) — `hidden lg:flex`, not a
    // narrower column, because the reference drops it rather than shrinking it.
    <div className="mx-auto grid min-h-dvh w-full max-w-[1400px] items-center gap-6 px-4 py-6 lg:grid-cols-[1fr_380px]">
      <MarketingPanel />

      {/* VI-001, below 1024px: "the card alone, centered". Centred is not the whole of
          it — without the cap the single-column grid stretches the card to the full
          viewport, which at 900px is an 868px-wide sign-in form and looks nothing like
          the reference. The cap is lifted at lg, where the 380px grid track takes over.
          Found by the Visual Compliance Loop measuring at 1023, 900 and 390px; the
          first version passed "centred" and failed the reference. */}
      <div className="mx-auto w-full max-w-[380px] lg:max-w-none">
        <SignInCard />
      </div>
    </div>
  );
}

/** VI-002 through VI-005. Not rendered below 1024px. */
function MarketingPanel() {
  return (
    <aside className="hidden h-full flex-col justify-between rounded-lg border border-border bg-card p-10 lg:flex">
      {/* VI-003: the mark at 28x28 stroked in --primary, beside the wordmark at 20px
          semibold with tight tracking, 8px apart. */}
      <div className="flex items-center gap-2">
        <DumbbellMark />
        <span className="text-xl font-semibold tracking-tight text-foreground">FitForge</span>
      </div>

      {/* VI-004. Both strings are transcribed from the reference, not paraphrased: the
          prototype is source-of-truth rung 2 and this copy is part of it. */}
      <div className="max-w-96">
        <h1 className="text-2xl font-semibold leading-snug tracking-tight">
          Log the set. Watch the number move.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Programs, an exercise library that knows what gear you have, and progress that
          comes from what you actually lifted.
        </p>
      </div>

      {/* VI-005 */}
      <p className="text-xs text-muted-foreground">
        No nutrition tracking. No feed. Just training.
      </p>
    </aside>
  );
}

/**
 * VI-003. Inline rather than from lucide-react: the reference draws FitForge's own
 * mark, and the nearest lucide dumbbell is a different shape. A visual reference is not
 * satisfied by something similar.
 */
function DumbbellMark() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="hsl(var(--primary))"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6.5 6.5v11" />
      <path d="M17.5 6.5v11" />
      <path d="M3.5 9v6" />
      <path d="M20.5 9v6" />
      <path d="M6.5 12h11" />
    </svg>
  );
}
