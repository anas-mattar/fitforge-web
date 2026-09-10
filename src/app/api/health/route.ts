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
  } catch {
    // getApiHealth throws only when the address is not configured at all. From the
    // browser's side that is indistinguishable from an API it cannot reach, and the
    // contract has no fourth word for "we never tried".
    payload = { api: "unreachable", checkedAt: new Date().toISOString() };
  }

  return NextResponse.json(payload, {
    status: 200,
    headers: { "cache-control": "no-store" },
  });
}
