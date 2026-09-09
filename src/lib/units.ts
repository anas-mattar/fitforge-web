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
