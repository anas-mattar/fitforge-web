import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { callerAddress } from "../source-address";

/**
 * T114 — the test feature 002's review asked for by name: *"a test must assert the header
 * leaves the BFF — the current tests fabricate it."*
 *
 * That sentence is the whole lesson of finding F1. The API's throttle tests set
 * `X-Forwarded-For` themselves and passed for months against a production path where
 * nothing set it, so a green suite proved the defence worked everywhere except where it
 * ran. Asserting on the outgoing request is what closes that gap: these tests watch what
 * the BFF actually puts on the wire.
 */

const BASE = "http://api.test";

function requestWith(headers: Record<string, string>): Request {
  return new Request("http://fitforge.test/api/bff/auth/sign-in", { method: "POST", headers });
}

describe("reading the caller's address", () => {
  it("takes the LAST entry, because that is the one a proxy wrote", () => {
    // The leftmost entry is whatever the original caller chose to send. Reading it — the
    // reflex, and what most "get the client IP" snippets do — would hand every request its
    // own throttle bucket for the price of one header.
    expect(callerAddress(requestWith({ "x-forwarded-for": "10.9.9.9, 203.0.113.7" })))
      .toBe("203.0.113.7");
  });

  it("reads a single entry", () => {
    expect(callerAddress(requestWith({ "x-forwarded-for": "203.0.113.7" }))).toBe("203.0.113.7");
  });

  it("trims the spacing proxies leave behind", () => {
    expect(callerAddress(requestWith({ "x-forwarded-for": "10.0.0.1,   203.0.113.7  " })))
      .toBe("203.0.113.7");
  });

  it("says null when there is no header at all", () => {
    // A local `next dev`, or any deployment with no proxy in front. Null rather than "" is
    // the fix itself: an empty string is an address as far as a hash is concerned, and
    // every caller sharing one is exactly finding F1.
    expect(callerAddress(requestWith({}))).toBeNull();
  });

  it("says null for a header that names nobody", () => {
    expect(callerAddress(requestWith({ "x-forwarded-for": "  " }))).toBeNull();
    expect(callerAddress(requestWith({ "x-forwarded-for": "10.0.0.1, " }))).toBeNull();
  });
});

describe("what the BFF actually sends the API", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function capture(call: (transport: typeof import("../auth-transport")) => Promise<unknown>) {
    const spy = vi.fn<typeof fetch>(
      async () =>
        new Response(JSON.stringify({ token: "t", expiresAtUtc: "2026-09-24T12:00:00Z", member: {} }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );

    vi.stubGlobal("fetch", spy);
    await call(await import("../auth-transport"));

    return (spy.mock.calls[0]![1]?.headers ?? {}) as Record<string, string>;
  }

  it("puts the address on the sign-in request", async () => {
    const headers = await capture(({ postSignIn }) =>
      postSignIn(BASE, "member@example.com", "correct horse battery staple", "203.0.113.7"),
    );

    expect(headers["x-forwarded-for"]).toBe("203.0.113.7");
  });

  it("puts the address on the register request", async () => {
    // contracts/auth.md §2 has listed a 429 under register since before implementation.
    // Finding F3 is that nothing produced one; a throttle with no address to key on would
    // not have been much better.
    const headers = await capture(({ postRegister }) =>
      postRegister(BASE, "member@example.com", "correct horse battery staple", "Member", "203.0.113.7"),
    );

    expect(headers["x-forwarded-for"]).toBe("203.0.113.7");
  });

  it("omits the header entirely when the address is unknown", async () => {
    // Not an empty value. The API distinguishes "unknown" from "an address", and sending
    // "" would collapse that distinction back into one shared bucket.
    const headers = await capture(({ postSignIn }) =>
      postSignIn(BASE, "member@example.com", "correct horse battery staple", null),
    );

    expect(headers).not.toHaveProperty("x-forwarded-for");
  });

  it("does not send an address with sign-out, which verifies nothing", async () => {
    const headers = await capture(({ postSignOut }) => postSignOut(BASE, "the-token"));

    expect(headers).not.toHaveProperty("x-forwarded-for");
    expect(headers.authorization).toBe("Bearer the-token");
  });

  it("puts the address on the forwarded /me calls that verify a password", async () => {
    // Finding F6: the password change and the account deletion each perform a full
    // verification, and neither was throttled. Forwarding the address is half of the fix
    // and this is the half that lives here.
    const spy = vi.fn<typeof fetch>(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", spy);

    const { forwardJson } = await import("../me-transport");
    await forwardJson(BASE, "POST", "/api/v1/me/password", "the-token", "{}", "203.0.113.7");

    const headers = (spy.mock.calls[0]![1]?.headers ?? {}) as Record<string, string>;

    expect(headers["x-forwarded-for"]).toBe("203.0.113.7");
  });
});
