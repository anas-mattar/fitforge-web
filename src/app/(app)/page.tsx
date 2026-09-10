/**
 * Today — the landing screen after sign-in.
 *
 * Deliberately empty. The reference's Today screen (next-session card, stat tiles,
 * recent sessions) needs a member, a program and logged sessions, none of which exist
 * until features 002, 004 and 007. Rendering a plausible-looking card of invented
 * numbers here would be worse than an empty state: it reads as working software and
 * quietly becomes the thing nobody remembers to replace.
 */
export default function TodayPage() {
  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h1 className="text-lg font-semibold tracking-tight">Today</h1>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">
        The shell is in place. Today&apos;s workout, your streak and this week&apos;s
        volume arrive with the features that produce them.
      </p>
    </section>
  );
}
