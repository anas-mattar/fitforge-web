import { getMe } from "@/lib/api-auth";
import { apiBaseUrl } from "@/lib/api-client";
import { FORBIDDEN_ORIGIN, SERVICE_UNAVAILABLE, failure, originIsAllowed } from "@/lib/bff";
import { forwardJson } from "@/lib/me-transport";
import { clearSessionToken, readSessionToken } from "@/lib/session";

/**
 * GET /api/bff/me — contracts/member.md §6.
 *
 * No Origin check: this is a GET and changes nothing, and `SameSite=Lax` sends the
 * cookie on top-level navigations by design. The origin check guards the MUTATING
 * routes, which is where CSRF has something to win.
 */
export async function GET(): Promise<Response> {
  const token = await readSessionToken();

  if (!token) {
    return failure({ status: 401, title: "Not signed in." });
  }

  const result = await getMe(token);

  if (!result.ok) {
    return result.status === null
      ? failure(SERVICE_UNAVAILABLE)
      : failure({ status: result.status, title: result.title });
  }

  return Response.json(result.value, {
    // Never cached, anywhere. This response carries one member's personal data, and a
    // shared cache holding it is invariant 2's failure with a different mechanism.
    headers: { "cache-control": "no-store" },
  });
}

/** DELETE /api/bff/me — contracts/member.md §4 and §6. */
export async function DELETE(request: Request): Promise<Response> {
  if (!originIsAllowed(request)) {
    return failure(FORBIDDEN_ORIGIN);
  }

  const token = await readSessionToken();

  if (!token) {
    return failure({ status: 401, title: "Not signed in." });
  }

  const result = await forwardJson(
    apiBaseUrl(),
    "DELETE",
    "/api/v1/me",
    token,
    await request.text(),
  );

  if (!result.ok) {
    // A wrong password is a 401 from the API and the cookie is NOT cleared: nothing was
    // deleted, and signing the member out of a failed attempt would be a second
    // consequence they did not ask for.
    return result.status === null
      ? failure(SERVICE_UNAVAILABLE)
      : new Response(result.body, {
          status: result.status,
          headers: { "content-type": "application/json", "cache-control": "no-store" },
        });
  }

  // The account is gone and every session with it (FR-014). Clearing the cookie is
  // tidying up after the API, not the act itself — a member whose account is deleted is
  // signed out because the sessions are revoked, whatever this browser still holds.
  await clearSessionToken();

  return new Response(null, { status: 204 });
}
