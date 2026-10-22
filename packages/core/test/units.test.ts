import { describe, expect, it } from "vitest";
import { formatFtIn, ftIn, kgToLb, lbToKg, mToIn, toFtIn } from "../src/units.js";

describe("units", () => {
  it("converts feet and inches to inches", () => {
    expect(ftIn(8, 6)).toBe(102);
    expect(ftIn(13, 6)).toBe(162);
    expect(ftIn(0, 7)).toBe(7);
  });

  it("splits inches into feet and inches", () => {
    expect(toFtIn(162)).toEqual({ feet: 13, inches: 6 });
    expect(toFtIn(102)).toEqual({ feet: 8, inches: 6 });
    expect(toFtIn(11.99)).toEqual({ feet: 1, inches: 0 });
  });

  it("formats for display", () => {
    expect(formatFtIn(162)).toBe(`13' 6"`);
    expect(formatFtIn(96.25)).toBe(`8' 0.25"`);
  });

  it("round-trips kilograms and pounds", () => {
    expect(kgToLb(1000)).toBeCloseTo(2204.62, 2);
    expect(lbToKg(kgToLb(1234))).toBeCloseTo(1234, 6);
  });

  it("converts meters to inches", () => {
    expect(mToIn(1)).toBeCloseTo(39.37, 2);
  });

  it("rejects non-numbers", () => {
    expect(() => ftIn(Number.NaN)).toThrow(RangeError);
  });
});
