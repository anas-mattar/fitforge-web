/**
 * Who the browser in front of this BFF is, for the API's sign-in throttle
 * (contracts/auth.md §6).
 *
 * Deliberately NOT marked `server-only`, same reason as `auth-transport.ts`: this is the
 * part with a rule in it, and a rule that can only run inside a request is a rule that
 * only ever gets tested by hand. Feature 002's finding F1 is precisely what that costs.
 *
 * **What F1 was.** `contracts/auth.md` §6 says the source address is "supplied by the BFF
 * as `X-Forwarded-For`". The BFF never supplied it — a search of this whole tree for
 * `forwarded` returned one comment and one type name — so the API saw no header on every
 * production request, hashed the empty string, and put every member in the world into one
 * per-source bucket of thirty. Thirty failed sign-ins from anywhere locked out everyone,
 * and the API's tests stayed green because they set the header themselves.
 */

/** The header, spelled once. */
export const FORWARDED_FOR = "x-forwarded-for";

/**
 * The caller's address, or `null` when this BFF cannot honestly say.
 *
 * **The last entry, not the first.** A proxy appends the address it saw, so the rightmost
 * entry is the one the nearest proxy wrote and the leftmost is whatever the original
 * caller chose to send. Reading the leftmost — the reflex, and what most "get the client
 * IP" snippets do — reads attacker-controlled input and hands every request its own
 * throttle bucket.
 *
 * **The assumption, stated so it can be checked.** Exactly one appending hop is expected
 * in front of this BFF. A deployment with two must collapse the header at the edge; if it
 * does not, the rightmost entry is the inner proxy's address, and the API refuses to key a
 * bucket on a host it already trusts. The failure mode of getting this wrong is therefore
 * a weaker throttle, never the product-wide outage F1 describes.
 *
 * `null` rather than a placeholder, and that distinction is the whole fix: "I do not know
 * who this is" must not be spelled the same way for two different callers.
 */
export function callerAddress(request: Request): string | null {
  const header = request.headers.get(FORWARDED_FOR);

  if (header === null) {
    // No proxy in front of us — a local `next dev`, or a direct call. Nobody has told us
    // anything, so we tell the API nothing.
    return null;
  }

  const last = header.split(",").at(-1)?.trim();

  return last ? last : null;
}
