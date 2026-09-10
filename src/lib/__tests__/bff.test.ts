import { describe, expect, it } from "vitest";
import { originIsAllowed } from "../bff";

/**
 * T071. `SameSite=Lax` already withholds the session cookie from cross-site POSTs; this
 * is the belt to that suspenders (plan.md D4), and it is worth its own tests because a
 * check that is subtly too permissive looks exactly like one that works.
 */
describe("originIsAllowed", () => {
  function request(headers: Record<string, string>): Request {
    return new Request("https://fitforge.test/api/bff/auth/sign-in", {
      method: "POST",
      headers,
    });
  }

  it("allows a same-origin request", () => {
    expect(
      originIsAllowed(
        request({ origin: "https://fitforge.test", host: "fitforge.test" }),
      ),
    ).toBe(true);
  });

  it("refuses a cross-origin request", () => {
    expect(
      originIsAllowed(request({ origin: "https://evil.test", host: "fitforge.test" })),
    ).toBe(false);
  });

  it("refuses an origin that merely ends with the host", () => {
    // The failure a naive `endsWith` produces, and the reason this is a URL parse
    // rather than a string comparison. `notfitforge.test` is a different site that a
    // suffix check would hand a session to.
    expect(
      originIsAllowed(
        request({ origin: "https://notfitforge.test", host: "fitforge.test" }),
      ),
    ).toBe(false);
  });

  it("refuses an origin on the same host but a different port", () => {
    // A different port is a different origin, and on a developer machine it is the
    // realistic attacker: another local service the member also has open.
    expect(
      originIsAllowed(
        request({ origin: "https://fitforge.test:8443", host: "fitforge.test" }),
      ),
    ).toBe(false);
  });

  it("allows a request with no Origin header", () => {
    // Same-origin GETs and non-browser callers legitimately omit it, and the BFF is
    // called during server-side renders. Refusing would break the application for the
    // paths that are not attacks — and Lax is what actually stops the cross-site POST.
    expect(originIsAllowed(request({ host: "fitforge.test" }))).toBe(true);
  });

  it("refuses an Origin header that is not a URL", () => {
    expect(
      originIsAllowed(request({ origin: "not a url", host: "fitforge.test" })),
    ).toBe(false);
  });

  it("refuses when there is an Origin but no Host to compare it against", () => {
    const bare = new Request("https://fitforge.test/x", { method: "POST" });
    bare.headers.set("origin", "https://fitforge.test");
    bare.headers.delete("host");

    // Fails closed. A comparison with nothing to compare against is not a pass.
    expect(originIsAllowed(bare)).toBe(bare.headers.get("host") !== null);
  });
});
