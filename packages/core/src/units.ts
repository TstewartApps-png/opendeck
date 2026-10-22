/**
 * Unit helpers. All OpenDeck math runs in inches and pounds;
 * convert at the edges with these functions.
 */

const IN_PER_FT = 12;
const LB_PER_KG = 2.2046226218;
const MM_PER_IN = 25.4;

/** Feet + inches → inches. ftIn(8, 6) === 102 */
export function ftIn(feet: number, inches = 0): number {
  assertFinite(feet, "feet");
  assertFinite(inches, "inches");
  return feet * IN_PER_FT + inches;
}

/** Inches → { feet, inches }, inches rounded to the nearest 1/4". */
export function toFtIn(totalInches: number): { feet: number; inches: number } {
  assertFinite(totalInches, "totalInches");
  const sign = totalInches < 0 ? -1 : 1;
  const quarterInches = Math.round(Math.abs(totalInches) * 4) / 4;
  let feet = Math.floor(quarterInches / IN_PER_FT);
  let inches = quarterInches - feet * IN_PER_FT;
  if (inches >= IN_PER_FT) {
    feet += 1;
    inches -= IN_PER_FT;
  }
  return { feet: sign * feet, inches: sign * inches };
}

/** Inches → display string like 13' 6" */
export function formatFtIn(totalInches: number): string {
  const { feet, inches } = toFtIn(totalInches);
  return `${feet}' ${inches}"`;
}

export function inToFt(inches: number): number {
  return inches / IN_PER_FT;
}

export function ftToIn(feet: number): number {
  return feet * IN_PER_FT;
}

export function mmToIn(mm: number): number {
  return mm / MM_PER_IN;
}

export function inToMm(inches: number): number {
  return inches * MM_PER_IN;
}

export function mToIn(meters: number): number {
  return mmToIn(meters * 1000);
}

export function kgToLb(kg: number): number {
  return kg * LB_PER_KG;
}

export function lbToKg(lb: number): number {
  return lb / LB_PER_KG;
}

function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be a finite number, got ${value}`);
  }
}
