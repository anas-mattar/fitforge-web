"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { ApiHealth } from "@/lib/health";

/**
 * Says whether the C# API behind this application is answering.
 *
 * It fetches `/api/health` — this application's own origin — and never the API
 * directly. That is the visible half of ADR-001 §4.6: open devtools, and the only host
 * in the network tab is this one.
 *
 * The three states are reported distinctly, because "the API said it is unhealthy" and
 * "the API did not answer" send you to different places to look.
 */
const PRESENTATION: Record<ApiHealth | "checking", { label: string; dot: string; text: string }> = {
  checking: { label: "Checking API…", dot: "bg-muted-foreground", text: "text-muted-foreground" },
  ready: { label: "API ready", dot: "bg-success", text: "text-muted-foreground" },
  degraded: { label: "API degraded", dot: "bg-destructive", text: "text-destructive" },
  unreachable: { label: "API unreachable", dot: "bg-muted-foreground", text: "text-muted-foreground" },
};

/**
 * Narrows an unknown payload to a state this component can render.
 *
 * Phase 4 cast the parsed JSON to `{ api?: ApiHealth }` and used it. A cast is a claim
 * about data we did not produce: any value outside the three words made
 * `PRESENTATION[state]` `undefined`, and destructuring that throws *during render* —
 * inside the root layout, so the global error boundary replaces the entire application.
 * A health indicator that can take the page down is worse than no health indicator.
 * `?? "unreachable"` covered a missing field and made the value look validated; it did
 * nothing about a wrong one.
 */
export function toApiHealth(value: unknown): ApiHealth {
  return value === "ready" || value === "degraded" || value === "unreachable" ? value : "unreachable";
}

export function ApiHealthIndicator() {
  const [state, setState] = useState<ApiHealth | "checking">("checking");

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/health", { signal: controller.signal, cache: "no-store" })
      .then((response) => response.json())
      .then((payload: unknown) =>
        setState(toApiHealth((payload as { api?: unknown } | null)?.api)))
      // If our own route cannot be reached, the honest answer is still "unreachable" —
      // and it must never take the page down with it.
      .catch(() => {
        if (!controller.signal.aborted) setState("unreachable");
      });

    return () => controller.abort();
  }, []);

  const { label, dot, text } = PRESENTATION[state];

  return (
    <span
      className={cn("hidden items-center gap-2 text-xs sm:inline-flex", text)}
      // Not aria-live: this settles once on load, and announcing it would interrupt a
      // screen-reader user mid-sentence for something they did not ask about.
      title={label}
    >
      <span className={cn("size-2 rounded-full", dot)} aria-hidden />
      {label}
    </span>
  );
}
