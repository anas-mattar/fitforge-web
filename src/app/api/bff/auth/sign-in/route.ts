import { signIn } from "@/lib/api-auth";
import { FORBIDDEN_ORIGIN, SERVICE_UNAVAILABLE, failure, originIsAllowed } from "@/lib/bff";
import { writeSessionToken } from "@/lib/session";

/**
 * POST /api/bff/auth/sign-in — contracts/member.md §6.
 *
 * Maps one call and sets the cookie. There is deliberately NO generic pass-through
 * route anywhere in this application: a `/bff/proxy/[...path]` would hand the browser
 * the entire API surface behind a cookie and make invariant 7 unenforceable by
 * inspection (plan.md D11).
 */
export async function POST(request: Request): Promise<Response> {
  if (!originIsAllowed(request)) {
    return failure(FORBIDDEN_ORIGIN);
  }

  const body = (await request.json().catch(() => ({}))) as {
    email?: unknown;
    password?: unknown;
  };

  const result = await signIn(
    typeof body.email === "string" ? body.email : "",
    typeof body.password === "string" ? body.password : "",
  );

  if (!result.ok) {
    // FR-017. status === null means the API never answered, and the member is told the
    // SERVICE is unavailable — never that their credentials are wrong. Getting this
    // branch backwards makes a member change a password that was fine.
    return result.status === null
      ? failure(SERVICE_UNAVAILABLE)
      : failure({ status: result.status, title: result.title });
  }

  await writeSessionToken(result.value.token, result.value.expiresAtUtc);

  // The token is NOT in the response body. It goes into an HttpOnly cookie and nowhere
  // else, so nothing script-readable ever holds a credential (FR-005, SC-003).
  return Response.json({ member: result.value.member }, { status: 200 });
}
