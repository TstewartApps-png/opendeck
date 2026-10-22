import { describe, expect, it } from "vitest";
import { computeLoad, spreadAxles, TYPICAL_TRACTOR } from "../src/load.js";
import type { Trailer } from "../src/types.js";

// A simple made-up test trailer (not from the library) so tests don't depend on data files.
const flatbed: Trailer = {
  id: "test-flatbed",
  name: "Test 48' flatbed",
  type: "flatbed",
  lengthIn: 576,
  widthIn: 102,
  tareWeightLb: 10_000,
  decks: [{ name: "main", heightIn: 60, lengthIn: 576, startIn: 0 }],
  kingpinSetbackIn: 36,
  kingpinToAxleCenterIn: 460,
  axles: { count: 2, spreadIn: 49 },
};

const stepDeck: Trailer = {
  ...flatbed,
  id: "test-step",
  type: "step-deck",
  decks: [
    { name: "upper", heightIn: 60, lengthIn: 132, startIn: 0 },
    { name: "lower", heightIn: 40, lengthIn: 444, startIn: 132 },
  ],
};

const excavator = { lengthIn: 360, widthIn: 120, heightIn: 120, weightLb: 45_000 };

describe("computeLoad", () => {
  it("adds deck height to equipment height", () => {
    const r = computeLoad({ equipment: excavator, trailer: flatbed });
    expect(r.overallHeightIn).toBe(180);
  });

  it("uses the wider of trailer and equipment", () => {
    expect(computeLoad({ equipment: excavator, trailer: flatbed }).overallWidthIn).toBe(120);
    const narrow = { ...excavator, widthIn: 90 };
    expect(computeLoad({ equipment: narrow, trailer: flatbed }).overallWidthIn).toBe(102);
  });

  it("defaults to the lowest deck", () => {
    const r = computeLoad({ equipment: excavator, trailer: stepDeck });
    expect(r.deckUsed).toBe("lower");
    expect(r.overallHeightIn).toBe(160);
  });

  it("honors a named deck", () => {
    const r = computeLoad({ equipment: excavator, trailer: stepDeck, placement: { deck: "upper" } });
    expect(r.overallHeightIn).toBe(180);
  });

  it("throws on an unknown deck", () => {
    expect(() =>
      computeLoad({ equipment: excavator, trailer: stepDeck, placement: { deck: "well" } }),
    ).toThrow(/no deck "well"/);
  });

  it("computes rear overhang past the trailer", () => {
    const long = { ...excavator, lengthIn: 500 };
    // lower deck starts at 132; 132 + 500 = 632; trailer is 576 → 56" overhang
    const r = computeLoad({ equipment: long, trailer: stepDeck });
    expect(r.rearOverhangIn).toBe(56);
    expect(r.frontOverhangIn).toBe(0);
    expect(r.trailerWithLoadLengthIn).toBe(632);
  });

  it("computes front overhang with a negative offset", () => {
    const r = computeLoad({ equipment: excavator, trailer: flatbed, placement: { offsetIn: -24 } });
    expect(r.frontOverhangIn).toBe(24);
  });

  it("sums tractor, trailer and equipment into gross weight", () => {
    const r = computeLoad({ equipment: excavator, trailer: flatbed });
    expect(r.grossWeightLb).toBe(TYPICAL_TRACTOR.weightLb + 10_000 + 45_000);
  });

  it("axle weights add up to gross weight", () => {
    const r = computeLoad({ equipment: excavator, trailer: flatbed });
    const total = r.axles.reduce((s, a) => s + a.weightLb, 0);
    expect(total).toBeCloseTo(r.grossWeightLb, 6);
    expect(r.axles).toHaveLength(5);
    expect(r.axles[0]?.label).toBe("Steer");
  });

  it("lays out axles in order from the steer axle", () => {
    const r = computeLoad({ equipment: excavator, trailer: flatbed });
    const positions = r.axles.map((a) => a.positionIn);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    // trailer axle center = wheelbase (230) + kingpin→axle (460) = 690
    expect(r.axles[3]!.positionIn + r.axles[4]!.positionIn).toBeCloseTo(2 * 690, 6);
  });

  it("rejects bad equipment input", () => {
    expect(() => computeLoad({ equipment: { ...excavator, weightLb: 0 }, trailer: flatbed })).toThrow(
      RangeError,
    );
  });
});

describe("spreadAxles", () => {
  it("centers a tandem on the group center", () => {
    const a = spreadAxles(100, { count: 2, spreadIn: 50 }, 1000, "T");
    expect(a.map((x) => x.positionIn)).toEqual([75, 125]);
  });

  it("handles a single axle", () => {
    expect(spreadAxles(100, { count: 1, spreadIn: 0 }, 1000, "T")).toHaveLength(1);
  });
});
