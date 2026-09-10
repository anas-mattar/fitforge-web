import { apiBaseUrl } from "@/lib/api-client";
import { FORBIDDEN_ORIGIN, SERVICE_UNAVAILABLE, failure, originIsAllowed } from "@/lib/bff";
import { readSessionToken } from "@/lib/session";
import { forwardJson } from "@/lib/me-transport";

/** PATCH /api/bff/me/preferences — contracts/member.md §2 and §6. */
export async function PATCH(request: Request): Promise<Response> {
  if (!originIsAllowed(request)) {
    return failure(FORBIDDEN_ORIGIN);
  }

  const token = await readSessionToken();

  if (!token) {
    return failure({ status: 401, title: "Not signed in." });
  }

  // The body is forwarded as received rather than reshaped. contracts/member.md §2
  // distinguishes an ABSENT field from a null one, and any reshaping here — a spread, a
  // pick, a record binding — collapses the two and turns "leave it alone" into "clear
  // it". The API is the one that decides; the BFF carries.
  const result = await forwardJson(
    apiBaseUrl(),
    "PATCH",
    "/api/v1/me/preferences",
    token,
    await request.text(),
  );

  if (!result.ok) {
    return result.status === null
      ? failure(SERVICE_UNAVAILABLE)
      : new Response(result.body, {
          status: result.status,
          headers: { "content-type": "application/json", "cache-control": "no-store" },
        });
  }

  return new Response(result.body, {
    status: 200,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
