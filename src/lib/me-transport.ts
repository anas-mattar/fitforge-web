/**
 * Forwarding for the `/me` routes the BFF carries but does not interpret.
 *
 * No `server-only`, same reason as `auth-transport.ts`: this is the part with rules in
 * it, and a rule that can only run inside a request is a rule that only gets tested by
 * hand. The caller supplies the address.
 */

const TIMEOUT_MS = 10_000;

export type Forwarded =
  | { readonly ok: true; readonly body: string }
  | { readonly ok: false; readonly status: number; readonly body: string }
  /** The API did not answer. Never reported to a member as their mistake (FR-017). */
  | { readonly ok: false; readonly status: null; readonly body: null };

/**
 * Send a JSON body through to the API and return its answer verbatim.
 *
 * **Verbatim is the point.** `contracts/member.md` §2 distinguishes an absent field from
 * a null one, and the API's validation problem documents name the fields a member has
 * to fix. Parsing and re-emitting either would give the BFF an opinion it is not
 * allowed to have (invariant 7) and a second place for the wording to drift.
 */
export async function forwardJson(
  baseUrl: string,
  method: "PATCH" | "POST" | "DELETE",
  path: string,
  token: string,
  body: string,
): Promise<Forwarded> {
  let response: Response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    return { ok: false, status: null, body: null };
  }

  if (response.status >= 500) {
    return { ok: false, status: null, body: null };
  }

  const text = await response.text();

  return response.ok ? { ok: true, body: text } : { ok: false, status: response.status, body: text };
}
