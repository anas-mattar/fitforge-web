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

export function ApiHealthIndicator() {
  const [state, setState] = useState<ApiHealth | "checking">("checking");

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/health", { signal: controller.signal, cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { api?: ApiHealth }) => setState(payload.api ?? "unreachable"))
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
