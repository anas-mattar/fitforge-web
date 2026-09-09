import { describe, expect, it } from "vitest";
import { kgToLb, lbToKg } from "../units";

describe("unit conversion", () => {
  it("converts kilograms to pounds", () => {
    expect(kgToLb(100)).toBeCloseTo(220.462, 3);
  });

  it("round-trips without drifting", () => {
    // Invariant §4: display conversion must never corrupt the canonical value.
    expect(lbToKg(kgToLb(102.5))).toBeCloseTo(102.5, 10);
  });
});
