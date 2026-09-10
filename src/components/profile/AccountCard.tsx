"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Me } from "@/lib/auth-transport";

/**
 * The retention window, stated to the member.
 *
 * VI-027 puts this number in front of them, and the API's `RetentionPolicy.Window` is
 * the code that honours it. Two languages, one promise: if the number changes, both
 * change or neither does. Written here rather than interpolated from an API response
 * because a member reading a promise should not depend on a request having succeeded.
 */
const RETENTION_DAYS = 30;

/** VI-024 through VI-027. */
export function AccountCard({ member }: { member: Me["member"] }) {
  const [open, setOpen] = useState<"none" | "password" | "delete">("none");

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold">Account</h2>

      {/* VI-024: a two-row list at 14px with 8px between rows, label muted on the left
          and value on the right. */}
      <dl className="mt-4 flex flex-col gap-2 text-sm">
        <Row label="Email" value={member.email} />
        {/* Formatted here, not by the API: the instant is what crosses the wire
            (invariant 4) and only the browser knows the member's locale. */}
        <Row label="Member since" value={formatDate(member.memberSince)} />
      </dl>

      {/* VI-025: 16px below, a WRAPPING row of 36px-tall buttons, 8px apart. Wrapping
          matters — at the narrow end these two do not fit side by side, and a row that
          overflows instead of wrapping puts "Delete account" off-screen. */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          className="h-9"
          onClick={() => setOpen(open === "password" ? "none" : "password")}
        >
          Change password
        </Button>

        {/* VI-026: the ONLY destructive-coloured control in the product, and always
            LAST (annotation K4). Both halves are deliberate — last so it is never the
            button a thumb reaches first, and uniquely coloured so the colour keeps
            meaning something. Nothing else in FitForge may use it. */}
        <Button
          type="button"
          className="h-9 border border-destructive bg-transparent text-destructive hover:bg-destructive/10"
          onClick={() => setOpen(open === "delete" ? "none" : "delete")}
        >
          Delete account
        </Button>
      </div>

      {/* VI-027, verbatim. The member is told what deletion means BEFORE they open the
          form, not inside it. */}
      <p className="mt-3 text-xs text-muted-foreground">
        Deleting soft-deletes your account and training data; it is recoverable for{" "}
        {RETENTION_DAYS} days, then permanently removed (invariant 10).
      </p>

      {open === "password" && <ChangePassword onDone={() => setOpen("none")} />}
      {open === "delete" && <DeleteAccount />}
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}

function ChangePassword({ onDone }: { onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  return (
    <form
      className="mt-4 flex flex-col gap-3 border-t border-border pt-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);

        const form = new FormData(event.currentTarget);
        const response = await fetch("/api/bff/me/password", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            currentPassword: String(form.get("currentPassword") ?? ""),
            newPassword: String(form.get("newPassword") ?? ""),
          }),
        }).catch(() => null);

        if (response?.ok) {
          setDone(true);
          onDone();
          return;
        }

        const body = (await response?.json().catch(() => ({}))) as {
          title?: string;
          errors?: Record<string, string[]>;
        };

        // The API names the field; showing its wording keeps one source for it.
        setError(body?.errors?.newPassword?.[0] ?? body?.title ?? "That did not work.");
      }}
    >
      <div>
        <Label htmlFor="currentPassword">Current password</Label>
        <div className="mt-1.5">
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="newPassword">New password</Label>
        <div className="mt-1.5">
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
          />
        </div>
      </div>

      {error !== null && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}

      {done && <p className="text-xs text-muted-foreground">Password changed.</p>}

      {/* FR-013, said plainly. A member who changes their password should know their
          other devices were signed out, rather than discovering it on the train. */}
      <p className="text-xs text-muted-foreground">
        Changing your password signs you out everywhere else.
      </p>

      <Button type="submit" className="h-9 self-start">
        Change password
      </Button>
    </form>
  );
}

function DeleteAccount() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <form
      className="mt-4 flex flex-col gap-3 border-t border-border pt-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);

        const form = new FormData(event.currentTarget);
        const response = await fetch("/api/bff/me", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ password: String(form.get("password") ?? "") }),
        }).catch(() => null);

        if (response?.ok) {
          router.push("/sign-in");
          router.refresh();
          return;
        }

        const body = (await response?.json().catch(() => ({}))) as { title?: string };
        setError(body?.title ?? "That did not work.");
      }}
    >
      {/* Re-authentication, and the member is told why. contracts/member.md §4: a
          stolen session must not be able to destroy an account. */}
      <div>
        <Label htmlFor="deletePassword">Confirm your password to delete</Label>
        <div className="mt-1.5">
          <Input
            id="deletePassword"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
      </div>

      {error !== null && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}

      <Button
        type="submit"
        className="h-9 self-start border border-destructive bg-transparent text-destructive hover:bg-destructive/10"
      >
        Delete my account
      </Button>
    </form>
  );
}

/** VI-024's date format: `19 Aug 2026`. */
function formatDate(instant: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(instant));
}
