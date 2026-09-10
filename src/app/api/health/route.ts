import { NextResponse } from "next/server";
import { getApiHealth } from "@/lib/api-client";
import type { HealthPayload } from "@/lib/health";

/**
 * `GET /api/health` — the only health shape the browser sees
 * (`specs/001-solution-scaffold/contracts/health.md` §2).
 *
 * Always 200, in all three cases. Reachability is *data*: the BFF succeeded at finding
 * out, and answering 503 here would make the browser's own transport look broken when
 * the thing that is actually broken is one hop further away.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  let payload: HealthPayload;

  try {
    payload = await getApiHealth();
  } catch (error) {
    // getApiHealth throws only when the address is not configured at all. From the
    // browser's side that is indistinguishable from an API it cannot reach, and the
    // contract has no fourth word for "we never tried" — so the answer stays
    // "unreachable".
    //
    // But the operator is not the browser. Phase 4 swallowed this error, so a missing
    // FITFORGE_API_BASE_URL produced "unreachable" with no server-side signal at all,
    // and the only clue anyone had pointed at the API process — which was fine. That is
    // the wrong-process misdirection contract §2 exists to prevent, arriving by another
    // door. The client answer is unchanged; the server now says what actually happened.
    console.error("[fitforge] readiness probe could not run:", error);

    payload = { api: "unreachable", checkedAt: new Date().toISOString() };
  }

  return NextResponse.json(payload, {
    status: 200,
    headers: { "cache-control": "no-store" },
  });
}
