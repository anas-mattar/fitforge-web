/**
 * The BFF's share of contracts/auth.md, as functions with the address passed in.
 *
 * Kept free of `server-only` and of any environment access on purpose — the same split
 * feature 001 made between `health.ts` and `api-client.ts`, and for the same reason:
 * this is the part with rules in it, and the rule that matters most (FR-017: an
 * unreachable API is never reported as a credential problem) is exactly the one that
 * ends up only being tested by hand if it can only run inside a request.
 *
 * The browser is not a party to any of this. `api-auth.ts` supplies the address and is
 * the module marked server-only.
 */

/** What the API returns on register and sign-in. */
export type Credentialed = {
  readonly token: string;
  readonly expiresAtUtc: string;
  readonly member: Record<string, unknown>;
};

export type ApiResult<T> =
  | { readonly ok: true; readonly value: T }
  /** The API answered, and its answer is a failure the caller should map. */
  | { readonly ok: false; readonly status: number; readonly title: string }
  /** The API did not answer at all — FR-017's case, and never a credential problem. */
  | { readonly ok: false; readonly status: null; readonly title: null };

/**
 * Ten seconds. Long enough for a 210,000-iteration password hash on a cold instance,
 * short enough that a member is told something rather than watching a spinner.
 */
const TIMEOUT_MS = 10_000;

async function post<T>(
  baseUrl: string,
  path: string,
  body: unknown,
  token?: string,
): Promise<ApiResult<T>> {
  let response: Response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    // Unreachable, DNS failure, timeout. FR-017: the member is told the service is
    // unavailable. Deliberately no detail — the exception text can carry the API's
    // address, and that belongs in a server log, not in a browser.
    return { ok: false, status: null, title: null };
  }

  if (response.status >= 500) {
    // The API answered, but with its own failure. Same treatment as unreachable: this is
    // not something the member did.
    return { ok: false, status: null, title: null };
  }

  if (response.status === 204) {
    return { ok: true, value: undefined as T };
  }

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      // The API's problem document titles are member-facing by design — VI-012 fixes
      // the sign-in one verbatim — so they are forwarded rather than re-invented here.
      // Re-writing them in the BFF would put the same string in two places and let the
      // screen drift from the contract.
      title: typeof payload.title === "string" ? payload.title : "Something went wrong.",
    };
  }

  return { ok: true, value: payload as T };
}

/** contracts/auth.md §2. */
export function postRegister(baseUrl: string, email: string, password: string, displayName: string) {
  return post<Credentialed>(baseUrl, "/api/v1/auth/register", { email, password, displayName });
}

/** contracts/auth.md §3. */
export function postSignIn(baseUrl: string, email: string, password: string) {
  return post<Credentialed>(baseUrl, "/api/v1/auth/sign-in", { email, password });
}

/** contracts/auth.md §4. */
export function postSignOut(baseUrl: string, token: string) {
  return post<void>(baseUrl, "/api/v1/auth/sign-out", {}, token);
}
