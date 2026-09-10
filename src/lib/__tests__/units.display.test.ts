import { describe, expect, it } from "vitest";
import { CM_PER_IN, cmToIn, formatHeight } from "../units";

/**
 * T094 and part of T095 — FR-011, invariant 4, VI-028.
 *
 * Unit preference is a rendering instruction. These functions convert one way, at
 * render, and nothing they produce is ever persisted. The half of VI-028 that says
 * "no stored value changes" is enforced on the API side (T055, which mutation-checks
 * it); this is the half that says the display actually changes.
 */
describe("formatHeight", () => {
  it("renders centimetres when the member reads metric", () => {
    expect(formatHeight(167.5, "Metric")).toBe("167.5 cm");
  });

  it("renders feet and inches when the member reads imperial", () => {
    // 167.5cm is 5'6". Not "65.9 in": arithmetically correct and nobody describes
    // themselves that way.
    expect(formatHeight(167.5, "Imperial")).toBe(`5' 6"`);
  });

  it("carries the next foot rather than reporting twelve inches", () => {
    // 182.7cm is 71.93 inches — 5 feet and 11.93 inches, which rounds to 5'12".
    // A member is 6 feet tall, not five feet and twelve inches.
    expect(formatHeight(182.7, "Imperial")).toBe(`6' 0"`);
  });

  it("shows a dash rather than a zero when no height is recorded", () => {
    // Every profile field is optional. Rendering 0 would be a measurement the member
    // never gave, and "0 cm" reads as data rather than as absence.
    expect(formatHeight(null, "Metric")).toBe("—");
    expect(formatHeight(null, "Imperial")).toBe("—");
  });

  it("uses the exact definition of an inch", () => {
    // 2.54 is exact by definition, not an approximation to be tuned.
    expect(CM_PER_IN).toBe(2.54);
    expect(cmToIn(2.54)).toBe(1);
  });

  it("changes only the rendering, never the value it was given", () => {
    // The property VI-028 is about, stated on the only thing a pure function can be
    // asked: the same input, twice, through two different preferences.
    const stored = 167.5;

    const metric = formatHeight(stored, "Metric");
    const imperial = formatHeight(stored, "Imperial");

    expect(metric).not.toBe(imperial);
    expect(stored).toBe(167.5);
  });
});
