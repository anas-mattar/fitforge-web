import { getMe } from "@/lib/api-auth";
import { SERVICE_UNAVAILABLE, failure } from "@/lib/bff";
import { readSessionToken } from "@/lib/session";

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
