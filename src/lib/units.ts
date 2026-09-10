/**
 * Unit conversion at the presentation edge only.
 *
 * Canonical storage is kilograms (modules/training/training-invariants.md §4): a stored
 * value is never re-derived from a rounded displayed value, so these helpers convert one
 * way, for display, and are never used to produce a value that is persisted.
 */
export const KG_PER_LB = 0.45359237;

/** Kilograms to pounds, for display only. */
export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

/** Pounds to kilograms, for values entered in pounds before they are stored. */
export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

/** Centimetres per inch. Exact, by definition. */
export const CM_PER_IN = 2.54;

/** Centimetres to inches, for display only. */
export function cmToIn(cm: number): number {
  return cm / CM_PER_IN;
}

/** The two things a member can be shown measurements in (contracts/member.md §2). */
export type UnitPreference = "Metric" | "Imperial";

/**
 * A height, rendered for a member.
 *
 * Feature 002 phase 9, T094. Conversion happens HERE and only here — at render. Nothing
 * this function produces is ever sent back: `PATCH /me/preferences` carries the
 * preference, never a measurement, and the stored centimetres are untouched (FR-011,
 * invariant 4, VI-028).
 *
 * Imperial reads as feet and inches because that is how the people who use it say it.
 * "66 in" is arithmetically correct and nobody describes themselves that way.
 */
export function formatHeight(heightCm: number | null, units: UnitPreference): string {
  if (heightCm === null) {
    return "—";
  }

  if (units === "Metric") {
    return `${round(heightCm, 1)} cm`;
  }

  const totalInches = cmToIn(heightCm);
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);

  // 11.6 inches rounds to 12, which is not an inch count — it is the next foot.
  return inches === 12 ? `${feet + 1}' 0"` : `${feet}' ${inches}"`;
}

function round(value: number, places: number): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}
