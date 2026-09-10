/**
 * Shared plumbing for the BFF route handlers.
 *
 * Deliberately NOT marked `server-only`, unlike `session.ts`: nothing here reads the
 * environment or touches a secret, and the marker would only make the origin check
 * untestable. `server-only` guards against leaking server state into the bundle; it is
 * not a general "this is backend code" label, and using it as one costs coverage on the
 * checks that most need it.
 *
 * The BFF maps and nothing else: it holds no rule from
 * modules/training/training-invariants.md, opens no database connection, and never
 * decides what a member may do (invariant 7, plan.md D11).
 */

/**
 * SameSite=Lax withholds the cookie from cross-site POSTs already. This is the belt to
 * that suspenders, and it is three lines in one place rather than a decision each new
 * route handler has to remember.
 *
 * A request with no Origin header is allowed: same-origin GETs and non-browser callers
 * legitimately omit it, and rejecting them would break the BFF for the server-rendered
 * paths that call it during a render.
 */
export function originIsAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");

  if (origin === null) {
    return true;
  }

  const host = request.headers.get("host");

  if (host === null) {
    return false;
  }

  try {
    return new URL(origin).host === host;
  } catch {
    // An Origin header that is not a URL is not a browser we recognise.
    return false;
  }
}

/**
 * What the browser is told when a request fails.
 *
 * Deliberately narrow. The API's problem document may carry detail the BFF has no
 * business forwarding wholesale, so each route maps the cases it knows about and
 * everything else becomes a service failure.
 */
export type BffFailure = {
  readonly status: number;
  readonly title: string;
};

/**
 * FR-017. When the API is unreachable, times out, or answers 5xx, the member is told the
 * SERVICE is unavailable — never that their credentials are wrong.
 *
 * This is not a nicety. A member told their password is wrong when the server is down
 * will change a password that was fine, and then be locked out of a system that was
 * never broken for them in the first place.
 */
export const SERVICE_UNAVAILABLE: BffFailure = {
  status: 503,
  title: "FitForge is unavailable right now. Please try again.",
};

export const FORBIDDEN_ORIGIN: BffFailure = {
  status: 403,
  title: "That request did not come from FitForge.",
};

export function failure({ status, title }: BffFailure): Response {
  return Response.json({ title }, { status });
}
