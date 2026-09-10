import { NextResponse, type NextRequest } from "next/server";

/**
 * One job: make sure a page carrying member data is never served from a cache.
 *
 * Named `proxy.ts`, not `middleware.ts`: Next 16 deprecates the middleware convention
 * and warns on every request. Writing new code against a convention the framework is
 * already deprecating buys nothing and costs a migration later.
 *
 * T085. After sign-out, pressing Back must not restore an authenticated view. The shell
 * re-reads the session on every navigation — `(app)/layout.tsx` calls the API — but a
 * cached *response* would never reach that code at all, so the header is what makes the
 * re-read reachable.
 *
 * Deliberately NOT doing the redirect here. A cookie proves someone once had a session,
 * not that they still do, and a middleware check on cookie presence would be a second
 * place that decides who is signed in — one that disagrees with the authoritative one
 * for every expired, revoked or deleted-member session. One decision, in the layout.
 */
export default function proxy(request: NextRequest): NextResponse {
  const response = NextResponse.next();

  if (!request.nextUrl.pathname.startsWith("/sign-in")) {
    response.headers.set("cache-control", "no-store, must-revalidate");
  }

  return response;
}

export const config = {
  // Everything except Next's own assets and the favicon. The BFF routes are included on
  // purpose: /api/bff/me returns one member's personal data and setting the header in
  // two places is cheaper than the day somebody adds a route and forgets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
