import { describe, expect, it } from "vitest";
import { toApiHealth } from "../ApiHealthIndicator";

/**
 * T068. The narrowing that stands between an unexpected `/api/health` body and a blank
 * application.
 *
 * Phase 4 cast the parsed JSON straight to `ApiHealth` and indexed a lookup table with
 * it. Any value outside the three words produced `undefined`, and destructuring
 * `undefined` throws *during render* — inside the root layout, where the global error
 * boundary replaces the whole page. A health indicator that can take down the thing it
 * reports on is worse than no indicator, and `?? "unreachable"` did not help: it guarded
 * a missing field and made the value look validated.
 *
 * Pure function, tested without a DOM, because the rule is the part worth testing.
 */
describe("toApiHealth", () => {
  it.each(["ready", "degraded", "unreachable"] as const)("passes %s through", (value) => {
    expect(toApiHealth(value)).toBe(value);
  });

  it.each([
    ["an unknown word", "healthy"],
    ["an empty string", ""],
    ["the wrong case", "Ready"],
    ["a number", 503],
    ["a boolean", true],
    ["null", null],
    ["undefined", undefined],
    ["an object", { api: "ready" }],
    ["an array", ["ready"]],
  ])("falls back to unreachable for %s", (_label, value) => {
    expect(toApiHealth(value)).toBe("unreachable");
  });

  it("never returns a value the presentation table lacks a key for", () => {
    // The actual invariant. Whatever comes back off the wire, the caller can index the
    // lookup table with the result and destructure it without a guard.
    const known = ["ready", "degraded", "unreachable"];
    const hostile = [Symbol("x"), () => "ready", NaN, Infinity, -0, new Date()];

    for (const value of hostile) {
      expect(known).toContain(toApiHealth(value));
    }
  });
});
