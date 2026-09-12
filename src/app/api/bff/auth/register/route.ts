import { register } from "@/lib/api-auth";
import { FORBIDDEN_ORIGIN, SERVICE_UNAVAILABLE, failure, originIsAllowed } from "@/lib/bff";
import { callerAddress } from "@/lib/source-address";
import { writeSessionToken } from "@/lib/session";

/** POST /api/bff/auth/register — contracts/member.md §6, contracts/auth.md §2. */
export async function POST(request: Request): Promise<Response> {
  if (!originIsAllowed(request)) {
    return failure(FORBIDDEN_ORIGIN);
  }

  const body = (await request.json().catch(() => ({}))) as {
    email?: unknown;
    password?: unknown;
    displayName?: unknown;
  };

  const result = await register(
    typeof body.email === "string" ? body.email : "",
    typeof body.password === "string" ? body.password : "",
    typeof body.displayName === "string" ? body.displayName : "",
    // Register is throttled too (contracts/auth.md §2 → §6): a 409 versus a 201 is an
    // existence oracle, and without an address the count would be one global bucket.
    callerAddress(request),
  );

  if (!result.ok) {
    return result.status === null
      ? failure(SERVICE_UNAVAILABLE)
      : failure({ status: result.status, title: result.title });
  }

  await writeSessionToken(result.value.token, result.value.expiresAtUtc);

  return Response.json({ member: result.value.member }, { status: 201 });
}
