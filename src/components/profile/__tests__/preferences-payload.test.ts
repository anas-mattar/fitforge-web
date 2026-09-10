import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * T095's other half — VI-028: switching units "sends no measurement to the BFF".
 *
 * Asserted against the source rather than a rendered click, and deliberately so. The
 * failure this guards is not a wrong value in one payload; it is somebody later adding
 * a measurement to the save call because it seemed convenient — a change a rendering
 * test of today's behaviour would pass right over. What must stay true is that the only
 * things this screen ever sends are the four preferences.
 */
const CARD = join(process.cwd(), "src/components/profile/PreferencesCard.tsx");

const MEASUREMENT_FIELDS = ["heightCm", "birthYear", "weight", "loadKg", "sex"];

describe("the preferences card sends preferences and nothing else", () => {
  const source = readFileSync(CARD, "utf8");

  it("never puts a measurement in a request body", () => {
    // `profile` is read for display. It must not appear in a save call.
    const saveCalls = [...source.matchAll(/void save\(\{([^}]*)\}\)/g)].map((m) => m[1]!);

    expect(saveCalls.length).toBeGreaterThan(0);

    for (const call of saveCalls) {
      for (const field of MEASUREMENT_FIELDS) {
        expect(call).not.toContain(field);
      }
    }
  });

  it("sends exactly the four fields contracts/member.md §2 defines", () => {
    const saveCalls = [...source.matchAll(/void save\(\{\s*([A-Za-z]+)\s*:/g)].map(
      (m) => m[1]!,
    );

    expect(new Set(saveCalls)).toEqual(
      new Set(["units", "goal", "experience", "timeZone"]),
    );
  });

  it("saves one field at a time", () => {
    // Sending the whole form on every change would carry values the member did not
    // touch, which is how a stale tab overwrites a change made in another one. Each
    // save call carries exactly one key.
    for (const [, body] of source.matchAll(/void save\(\{([^}]*)\}\)/g)) {
      expect(body!.split(":").length - 1).toBe(1);
    }
  });

  it("renders the mandatory time-zone copy verbatim", () => {
    // VI-023 is mandatory (annotation K3) and its wording is fixed. A paraphrase is a
    // visual deviation that no layout measurement would catch.
    expect(source).toContain("Weeks and streaks are counted in this zone.");
  });
});
