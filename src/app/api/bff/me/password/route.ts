import { apiBaseUrl } from "@/lib/api-client";
import { FORBIDDEN_ORIGIN, SERVICE_UNAVAILABLE, failure, originIsAllowed } from "@/lib/bff";
import { readSessionToken } from "@/lib/session";
import { forwardJson } from "@/lib/me-transport";
import { callerAddress } from "@/lib/source-address";

/** POST /api/bff/me/password — contracts/member.md §3 and §6. */
export async function POST(request: Request): Promise<Response> {
  if (!originIsAllowed(request)) {
    return failure(FORBIDDEN_ORIGIN);
  }

  const token = await readSessionToken();

  if (!token) {
    return failure({ status: 401, title: "Not signed in." });
  }

  const result = await forwardJson(
    apiBaseUrl(),
    "POST",
    "/api/v1/me/password",
    token,
    await request.text(),
    // This route verifies a password, so the API throttles it (finding F6) and needs to
    // know whose attempt it is.
    callerAddress(request),
  );

  if (!result.ok) {
    return result.status === null
      ? failure(SERVICE_UNAVAILABLE)
      : new Response(result.body, {
          status: result.status,
          headers: { "content-type": "application/json", "cache-control": "no-store" },
        });
  }

  // The presented session survives a password change by design (FR-013), so the cookie
  // is deliberately NOT cleared here: the member stays signed in on the tab they are
  // using, and every other session is dead. Clearing it would sign them out of the one
  // place they just proved they belong.
  return new Response(null, { status: 204 });
}
