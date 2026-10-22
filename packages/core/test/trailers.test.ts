import { describe, expect, it } from "vitest";
import { checkFederal } from "../src/federal.js";
import { computeLoad } from "../src/load.js";
import { customizeTrailer, getTrailer, TRAILERS, TRAILER_LIBRARY_NOTE, validateTrailer } from "../src/trailers.js";

describe("trailer library", () => {
  it("ships the four open-deck types", () => {
    const types = new Set(TRAILERS.map((t) => t.type));
    expect(types).toEqual(new Set(["flatbed", "step-deck", "double-drop", "rgn"]));
  });

  it("has unique ids", () => {
    const ids = TRAILERS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("labels presets as typical values", () => {
    expect(TRAILER_LIBRARY_NOTE).toMatch(/typical/i);
  });

  it("returns a copy so callers can't mutate the library", () => {
    const t = getTrailer("flatbed-48");
    t.tareWeightLb = 1;
    expect(getTrailer("flatbed-48").tareWeightLb).not.toBe(1);
  });

  it("throws on an unknown id", () => {
    expect(() => getTrailer("nope")).toThrow(/Unknown trailer/);
  });

  it("lets you override preset values", () => {
    expect(customizeTrailer("rgn-3-axle", { tareWeightLb: 21_000 }).tareWeightLb).toBe(21_000);
  });

  it("rejects a deck that runs past the trailer", () => {
    const bad = { ...getTrailer("flatbed-48"), decks: [{ name: "main", heightIn: 60, lengthIn: 600, startIn: 0 }] };
    expect(() => validateTrailer(bad)).toThrow(/runs past/);
  });

  it("puts lowboy wells lower than flatbed decks", () => {
    const well = getTrailer("rgn-3-axle").decks.find((d) => d.name === "well")!;
    const flat = getTrailer("flatbed-48").decks[0]!;
    expect(well.heightIn).toBeLessThan(flat.heightIn);
  });
});

describe("end to end: excavator on presets", () => {
  // Made-up mid-size excavator, not a real model's spec.
  const excavator = { lengthIn: 372, widthIn: 114, heightIn: 126, weightLb: 48_000 };

  it("is lower on an RGN well than on a flatbed", () => {
    const rgn = computeLoad({ equipment: excavator, trailer: getTrailer("rgn-3-axle") });
    const flat = computeLoad({ equipment: excavator, trailer: getTrailer("flatbed-48") });
    expect(rgn.overallHeightIn).toBe(148);
    expect(flat.overallHeightIn).toBe(186);
  });

  it("is flagged oversize-width and overweight on an RGN", () => {
    const r = computeLoad({ equipment: excavator, trailer: getTrailer("rgn-3-axle") });
    const codes = checkFederal(r).map((f) => f.code);
    expect(codes).toContain("width.oversize");
    expect(r.grossWeightLb).toBe(19_000 + 19_000 + 48_000);
    expect(codes).toContain("weight.gross");
  });
});
