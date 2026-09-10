import { signOut } from "@/lib/api-auth";
import { FORBIDDEN_ORIGIN, failure, originIsAllowed } from "@/lib/bff";
import { clearSessionToken, readSessionToken } from "@/lib/session";

/**
 * POST /api/bff/auth/sign-out — contracts/member.md §6, contracts/auth.md §4.
 */
export async function POST(request: Request): Promise<Response> {
  if (!originIsAllowed(request)) {
    return failure(FORBIDDEN_ORIGIN);
  }

  const token = await readSessionToken();

  if (token) {
    // Server-side revoke first, cookie second (FR-006). If the revoke fails the cookie
    // is cleared anyway: the member asked to be signed out of THIS browser, and leaving
    // them signed in because the API hiccuped would be the wrong way to fail. The
    // session's own expiry is the backstop.
    await signOut(token);
  }

  await clearSessionToken();

  return new Response(null, { status: 204 });
}
