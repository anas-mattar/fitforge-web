/**
 * The BFF's entire share of the health contract
 * (`specs/001-solution-scaffold/contracts/health.md` §2), as pure functions.
 *
 * Kept free of `server-only` and of any environment access on purpose: this is the part
 * with rules in it, and rules that can only run inside a request are rules that end up
 * only being tested by hand. `api-client.ts` supplies the address and the real `fetch`.
 */

/** What the browser is told. Never a status code — reachability is data, not an error. */
export type ApiHealth = "ready" | "degraded" | "unreachable";

export interface HealthPayload {
  readonly api: ApiHealth;
  readonly checkedAt: string;
}

/** Contract §3: the BFF applies a 10s timeout to this call and MUST NOT retry it. */
export const HEALTH_TIMEOUT_MS = 10_000;

/**
 * Contract §2's mapping table, as one function.
 *
 * `degraded` and `unreachable` are deliberately not collapsed: one means the API
 * answered and told the truth about itself, the other means it never answered. Merging
 * them sends whoever is debugging to the wrong process.
 */
export function classifyStatus(status: number): ApiHealth {
  if (status === 200) return "ready";
  if (status === 503) return "degraded";
  // Any other status — 500, 502, a proxy's 404, an HTML error page — means we did not
  // get an answer we can believe. That is indistinguishable from not reaching it.
  return "unreachable";
}

export interface ProbeOptions {
  readonly baseUrl: string;
  readonly fetchImpl?: typeof fetch;
  readonly timeoutMs?: number;
  readonly now?: () => Date;
}

/**
 * Ask the API how it is, and turn whatever happens into one of three words.
 *
 * Every failure mode — timeout, connection refused, DNS failure, a body that will not
 * parse — lands on `unreachable` rather than throwing, because the BFF succeeded at
 * finding out. Only the answer is bad news.
 */
export async function probeApiHealth({
  baseUrl,
  fetchImpl = fetch,
  timeoutMs = HEALTH_TIMEOUT_MS,
  now = () => new Date(),
}: ProbeOptions): Promise<HealthPayload> {
  const checkedAt = now().toISOString();

  try {
    const response = await fetchImpl(`${baseUrl.replace(/\/+$/, "")}/health/ready`, {
      // No retry. A health probe that retries reports a stale truth — by the time the
      // second attempt succeeds, the answer describes a moment that has passed.
      signal: AbortSignal.timeout(timeoutMs),
      headers: { accept: "application/json" },
      cache: "no-store",
    });

    return { api: classifyStatus(response.status), checkedAt };
  } catch {
    return { api: "unreachable", checkedAt };
  }
}
