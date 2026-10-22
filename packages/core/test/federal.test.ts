import { describe, expect, it } from "vitest";
import {
  axleSpanFt,
  bridgeFormulaWeight,
  checkBridgeFormula,
  checkFederal,
  FEDERAL_LIMITS,
} from "../src/federal.js";
import type { Axle, LoadedDimensions } from "../src/types.js";

describe("bridgeFormulaWeight", () => {
  // Worked examples published by FHWA (FHWA-HOP-19-028).
  it.each([
    [9, 3, 42_500],
    [20, 3, 51_000],
    [23, 4, 57_500],
    [35, 4, 65_500],
    [51, 5, 80_000],
  ])("L=%i ft, N=%i → %i lb (FHWA example)", (l, n, expected) => {
    expect(bridgeFormulaWeight(l, n)).toBe(expected);
  });

  it("rejects fewer than 2 axles", () => {
    expect(() => bridgeFormulaWeight(10, 1)).toThrow(RangeError);
  });

  it("rejects a non-positive length", () => {
    expect(() => bridgeFormulaWeight(0, 3)).toThrow(RangeError);
  });
});

describe("axleSpanFt", () => {
  it("rounds to the nearest foot, 6 inches up", () => {
    expect(axleSpanFt(119)).toBe(10);
    expect(axleSpanFt(125)).toBe(10);
    expect(axleSpanFt(126)).toBe(11);
  });
});

const axle = (positionIn: number, weightLb: number, label = "A"): Axle => ({
  positionIn,
  weightLb,
  label,
});

describe("checkBridgeFormula", () => {
  it("flags an overweight single axle", () => {
    const r = checkBridgeFormula([axle(0, 21_000)]);
    expect(r[0]?.ok).toBe(false);
    expect(r[0]?.rule).toBe("single");
  });

  it("uses the 34,000 lb tandem limit for two axles ≤ 96 in apart", () => {
    const r = checkBridgeFormula([axle(0, 17_500), axle(52, 17_500)]);
    const pair = r.find((g) => g.axleCount === 2)!;
    expect(pair.rule).toBe("tandem");
    expect(pair.allowedLb).toBe(34_000);
    expect(pair.ok).toBe(false);
  });

  it("applies the bridge formula to longer groups", () => {
    // 5-axle tractor-trailer, 51 ft outer span → 80,000 lb
    const axles = [axle(0, 12_000), axle(230, 17_000), axle(282, 17_000), axle(587, 17_000), axle(636, 17_000)];
    const all = checkBridgeFormula(axles).find((g) => g.axleCount === 5)!;
    expect(all.spanFt).toBe(53);
    expect(all.allowedLb).toBe(80_000);
    expect(all.ok).toBe(true);
  });

  it("allows 68,000 lb on two tandems 36 ft apart (formula alone gives 66,000)", () => {
    const tandems = [axle(0, 17_000), axle(52, 17_000), axle(380, 17_000), axle(432, 17_000)];
    const group = checkBridgeFormula(tandems).find((g) => g.axleCount === 4)!;
    expect(group.spanFt).toBe(36);
    expect(bridgeFormulaWeight(36, 4)).toBe(66_000);
    expect(group.rule).toBe("tandem-pair-exception");
    expect(group.allowedLb).toBe(68_000);
    expect(group.ok).toBe(true);
  });

  it("keeps the bridge formula when it allows more than the two-tandem exception", () => {
    const tandems = [axle(0, 17_000), axle(52, 17_000), axle(428, 17_000), axle(480, 17_000)];
    const group = checkBridgeFormula(tandems).find((g) => g.axleCount === 4)!;
    expect(group.spanFt).toBe(40);
    expect(group.rule).toBe("bridge-formula");
    expect(group.allowedLb).toBe(68_500);
  });

  it("does not apply the two-tandem exception under 36 ft", () => {
    const tandems = [axle(0, 17_000), axle(52, 17_000), axle(368, 17_000), axle(420, 17_000)];
    const group = checkBridgeFormula(tandems).find((g) => g.axleCount === 4)!;
    expect(group.spanFt).toBe(35);
    expect(group.rule).toBe("bridge-formula");
    expect(group.allowedLb).toBe(65_500);
    expect(group.ok).toBe(false);
  });

  it("checks every consecutive run of axles", () => {
    const r = checkBridgeFormula([axle(0, 1), axle(50, 1), axle(300, 1)]);
    // 3 singles + (0,1) + (0,2) + (1,2)
    expect(r).toHaveLength(6);
  });
});

function load(overrides: Partial<LoadedDimensions> = {}): LoadedDimensions {
  return {
    overallHeightIn: 160,
    overallWidthIn: 102,
    overallLengthIn: 840,
    trailerWithLoadLengthIn: 576,
    frontOverhangIn: 0,
    rearOverhangIn: 0,
    grossWeightLb: 70_000,
    deckUsed: "main",
    axles: [axle(0, 12_000, "Steer"), axle(230, 14_500), axle(282, 14_500), axle(660, 14_500), axle(709, 14_500)],
    axleWeightsAreEstimates: true,
    ...overrides,
  };
}

describe("checkFederal", () => {
  it("passes a legal load with only info flags", () => {
    const flags = checkFederal(load());
    expect(flags.every((f) => f.severity === "info")).toBe(true);
    expect(flags.some((f) => f.code === "height.state")).toBe(true);
  });

  it("flags oversize width", () => {
    const flags = checkFederal(load({ overallWidthIn: 120 }));
    expect(flags[0]?.code).toBe("width.oversize");
    expect(flags[0]?.limit).toBe(FEDERAL_LIMITS.widthIn);
  });

  it("flags overweight gross", () => {
    const flags = checkFederal(load({ grossWeightLb: 95_000 }));
    expect(flags.some((f) => f.code === "weight.gross" && f.severity === "violation")).toBe(true);
  });

  it("reports estimated axle overloads as warnings, not violations", () => {
    const heavy = load({ axles: [axle(0, 12_000, "Steer"), axle(230, 22_000, "Drive 1")] });
    const f = checkFederal(heavy).find((x) => x.code === "axle.single")!;
    expect(f.severity).toBe("warning");
    expect(f.message).toMatch(/estimated/);
  });

  it("notes overhang for state review", () => {
    const flags = checkFederal(load({ rearOverhangIn: 48 }));
    expect(flags.some((f) => f.code === "overhang.state")).toBe(true);
  });

  it("sorts violations before warnings before info", () => {
    const flags = checkFederal(load({ overallWidthIn: 130, grossWeightLb: 90_000, rearOverhangIn: 10 }));
    const rank = { violation: 0, warning: 1, info: 2 } as const;
    const ranks = flags.map((f) => rank[f.severity]);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });
});
