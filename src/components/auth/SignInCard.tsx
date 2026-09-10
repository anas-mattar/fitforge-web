"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Mode = "sign-in" | "register";

/**
 * VI-006 through VI-014. The one client component on this screen — everything else
 * renders on the server (ADR-001 §4.6, "server components by default").
 */
export function SignInCard() {
  // VI-007: Sign in is selected by default (annotation A2).
  const [mode, setMode] = useState<Mode>("sign-in");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const displayName = String(form.get("displayName") ?? "");

    const path = mode === "sign-in" ? "/api/bff/auth/sign-in" : "/api/bff/auth/register";

    let response: Response;

    try {
      response = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          mode === "sign-in" ? { email, password } : { email, password, displayName },
        ),
      });
    } catch {
      // The BFF itself was unreachable. Same rule as FR-017: a network problem is never
      // reported as a credential problem.
      setError("FitForge is unavailable right now. Please try again.");
      setBusy(false);
      return;
    }

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { title?: string };

      // VI-012's copy comes from the API, verbatim, so the screen and the contract
      // cannot drift apart. A default here would be a second place the wording lives.
      setError(body.title ?? "Something went wrong.");
      setBusy(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    // VI-006: rounded, 1px border, --card fill, 24px padding.
    <Card className="w-full p-6">
      {/* VI-007: --muted background, 4px inset, two equal-width buttons, 20px above the
          first label. Selected = --card fill + a small shadow + medium weight. */}
      <div className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1">
        <ModeButton current={mode} value="sign-in" onSelect={setMode}>
          Sign in
        </ModeButton>
        <ModeButton current={mode} value="register" onSelect={setMode}>
          Register
        </ModeButton>
      </div>

      <form onSubmit={submit} className="mt-5" noValidate>
        {mode === "register" && (
          <div className="mb-4">
            <Label htmlFor="displayName">Name</Label>
            <div className="mt-1.5">
              <Input id="displayName" name="displayName" autoComplete="name" required />
            </div>
          </div>
        )}

        {/* VI-008: email first, then password. */}
        <div>
          <Label htmlFor="email">Email</Label>
          <div className="mt-1.5">
            {/* VI-009. 16px below it, which the wrapper's mb-4 provides. */}
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-invalid={error !== null}
            />
          </div>
        </div>

        <div className="mt-4">
          {/* VI-010: the label sits on a row with "Forgot?" right-aligned.
              DECLARED DEVIATION (spec.md): "Forgot?" is NOT rendered — password reset
              needs email delivery FitForge does not have, and a link that goes nowhere
              is worse than an absent one. The row layout therefore applies to the label
              alone, exactly as the spec says it should. */}
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
          </div>
          <div className="mt-1.5">
            {/* VI-011: identical to the email input. */}
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              required
              aria-invalid={error !== null}
            />
          </div>
        </div>

        {/* VI-012: directly under the password field and ABOVE the submit button, 12px,
            --destructive, hidden when there is no error. The position is specified
            because an error below the button is an error a member does not see. */}
        {error !== null && (
          <p role="alert" className="mt-2 text-xs text-destructive">
            {error}
          </p>
        )}

        {/* VI-013: full width, 40px tall (annotation A5). 8px below the password field
            when there is no error, which mt-2 on the error preserves. */}
        <Button type="submit" className="mt-4 w-full" disabled={busy}>
          {mode === "sign-in" ? "Sign in" : "Create account"}
        </Button>
      </form>

      {/* VI-014: 16px below the button, centred, 12px muted, with the link in
          --foreground and underlined. */}
      <p className="mt-4 text-center text-xs text-muted-foreground">
        {mode === "sign-in" ? "New here? " : "Already a member? "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "sign-in" ? "register" : "sign-in");
            setError(null);
          }}
          className="text-foreground underline"
        >
          {mode === "sign-in" ? "Create an account" : "Sign in"}
        </button>
      </p>
    </Card>
  );
}

function ModeButton({
  current,
  value,
  onSelect,
  children,
}: {
  current: Mode;
  value: Mode;
  onSelect: (mode: Mode) => void;
  children: string;
}) {
  const selected = current === value;

  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      aria-pressed={selected}
      className={cn(
        "rounded-sm px-3 py-1.5 text-sm transition-colors",
        selected
          ? "bg-card font-medium text-foreground shadow-sm"
          : "text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}
