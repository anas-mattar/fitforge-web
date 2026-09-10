import "server-only";

import { cookies } from "next/headers";

/**
 * The session cookie the BFF owns and the browser cannot read.
 *
 * plan.md D4, FR-005, invariant 7, annotation A6. The token itself is opaque and 256
 * bits (contracts/auth.md §1); this module is only about carrying it.
 *
 * `import "server-only"` is the enforcement: a client component that imports this fails
 * the build rather than shipping a way to read the cookie into the bundle.
 */

/**
 * The `__Host-` prefix is the part worth naming.
 *
 * It makes the browser ENFORCE what would otherwise be a server-side promise: Secure,
 * Path=/, and no Domain attribute. A later handler cannot quietly widen the cookie's
 * scope to a sibling subdomain, because the browser would reject the cookie outright.
 *
 * It works on `http://localhost`, which browsers treat as a secure context, so
 * development needs no exception and no second code path.
 */
export const SESSION_COOKIE = "__Host-fitforge_session";

/**
 * Read the token for a server-side call to the API.
 */
export async function readSessionToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

/**
 * Store a token the API issued.
 *
 * The cookie is NOT additionally sealed or encrypted (D4). HttpOnly already stops script
 * reads, and a sealed blob is exactly as replayable as the token it wraps — sealing
 * would add a key, a rotation story and a decrypt path in exchange for approximately
 * nothing.
 */
export async function writeSessionToken(token: string, expiresAtUtc: string): Promise<void> {
  const store = await cookies();

  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAtUtc),
  });
}

/**
 * Clear the cookie.
 *
 * Always paired with a server-side revoke (FR-006). Clearing alone would leave a live
 * session that a copied cookie could still use — "signed out" has to mean the token
 * stopped working, not that this browser forgot it.
 */
export async function clearSessionToken(): Promise<void> {
  const store = await cookies();

  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
