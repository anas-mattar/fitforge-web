import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * T077 — every row of the failure mapping, because the row that matters most is the one
 * that separates "your password is wrong" from "the server is down" (FR-017).
 *
 * A member told their password is wrong when the API is unreachable will change a
 * password that was fine, and then be locked out of a system that never broke for them.
 * That is the whole reason this mapping is tested rather than eyeballed.
 */
const BASE = "http://api.test";

describe("the server-side auth client", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function signInWith(fetchImpl: typeof fetch) {
    vi.stubGlobal("fetch", fetchImpl);
    const { postSignIn } = await import("../auth-transport");
    return postSignIn(BASE, "member@example.com", "correct horse battery staple");
  }

  it("returns the token when the API accepts the credentials", async () => {
    const result = await signInWith(
      vi.fn<typeof fetch>(
        async () =>
          new Response(
            JSON.stringify({ token: "t", expiresAtUtc: "2026-09-24T12:00:00Z", member: {} }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
      ),
    );

    expect(result.ok).toBe(true);
  });

  it("forwards a 401 as a credential failure with the API's own wording", async () => {
    // VI-012 fixes this string, and it lives in the API's problem document. Forwarding
    // it rather than re-inventing it here is what stops the screen drifting from the
    // contract.
    const result = await signInWith(
      vi.fn<typeof fetch>(
        async () =>
          new Response(JSON.stringify({ title: "Email or password is incorrect." }), {
            status: 401,
            headers: { "content-type": "application/json" },
          }),
      ),
    );

    expect(result).toMatchObject({
      ok: false,
      status: 401,
      title: "Email or password is incorrect.",
    });
  });

  it("forwards a 429 so the screen can say what actually happened", async () => {
    const result = await signInWith(
      vi.fn<typeof fetch>(
        async () =>
          new Response(JSON.stringify({ title: "Too many attempts. Try again shortly." }), {
            status: 429,
            headers: { "content-type": "application/json" },
          }),
      ),
    );

    expect(result).toMatchObject({ ok: false, status: 429 });
  });

  it("turns an unreachable API into a SERVICE failure, never a credential one", async () => {
    const result = await signInWith(
      vi.fn<typeof fetch>(async () => {
        throw new TypeError("fetch failed");
      }),
    );

    // status === null is the signal the route handler branches on to produce FR-017's
    // "FitForge is unavailable right now" instead of "your password is wrong".
    expect(result).toMatchObject({ ok: false, status: null });
  });

  it("turns a 500 from the API into the same SERVICE failure", async () => {
    // The API answered, but with its own failure. Not something the member did, and so
    // not something they should be told to fix about themselves.
    const result = await signInWith(
      vi.fn<typeof fetch>(async () => new Response(null, { status: 500 })),
    );

    expect(result).toMatchObject({ ok: false, status: null });
  });

  it("turns a 503 from the API into the same SERVICE failure", async () => {
    const result = await signInWith(
      vi.fn<typeof fetch>(async () => new Response(null, { status: 503 })),
    );

    expect(result).toMatchObject({ ok: false, status: null });
  });

  it("never sends the token anywhere but the Authorization header", async () => {
    const spy = vi.fn<typeof fetch>(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", spy);

    const { postSignOut } = await import("../auth-transport");
    await postSignOut(BASE, "the-token");

    const [url, init] = spy.mock.calls[0]!;

    expect(String(url)).not.toContain("the-token");
    expect(String(init?.body ?? "")).not.toContain("the-token");
    expect((init?.headers as Record<string, string>).authorization).toBe("Bearer the-token");
  });
});
