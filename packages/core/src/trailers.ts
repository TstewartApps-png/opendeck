import library from "./data/trailers.json" with { type: "json" };
import type { Trailer } from "./types.js";

const TYPES = new Set<Trailer["type"]>(["flatbed", "step-deck", "double-drop", "rgn"]);

/** Disclaimer that ships with the trailer library. Show it wherever presets are offered. */
export const TRAILER_LIBRARY_NOTE: string = library.note;

/** Typical trailer presets. Treat them as starting points, not specs. */
export const TRAILERS: readonly Trailer[] = library.trailers.map(validateTrailer);

export function getTrailer(id: string): Trailer {
  const t = TRAILERS.find((x) => x.id === id);
  if (!t) {
    const ids = TRAILERS.map((x) => x.id).join(", ");
    throw new Error(`Unknown trailer "${id}" (known: ${ids})`);
  }
  return structuredClone(t);
}

/** Copy a preset and override any fields, e.g. a carrier's real tare weight. */
export function customizeTrailer(id: string, overrides: Partial<Trailer>): Trailer {
  return validateTrailer({ ...getTrailer(id), ...overrides });
}

export function validateTrailer(raw: unknown): Trailer {
  const t = raw as Trailer;
  const fail = (msg: string): never => {
    throw new Error(`Invalid trailer "${t?.id ?? "?"}": ${msg}`);
  };
  if (!t || typeof t.id !== "string" || t.id === "") fail("missing id");
  if (!TYPES.has(t.type)) fail(`unknown type "${t.type}"`);
  for (const k of ["lengthIn", "widthIn", "tareWeightLb", "kingpinSetbackIn", "kingpinToAxleCenterIn"] as const) {
    if (!Number.isFinite(t[k]) || t[k] < 0) fail(`${k} must be a non-negative number`);
  }
  if (!Array.isArray(t.decks) || t.decks.length === 0) fail("needs at least one deck");
  for (const d of t.decks) {
    if (!(d.heightIn > 0) || !(d.lengthIn > 0) || !(d.startIn >= 0)) fail(`bad deck "${d.name}"`);
    if (d.startIn + d.lengthIn > t.lengthIn) fail(`deck "${d.name}" runs past the end of the trailer`);
  }
  if (!Number.isInteger(t.axles?.count) || t.axles.count < 1) fail("axles.count must be 1+");
  if (!(t.axles.spreadIn >= 0)) fail("axles.spreadIn must be non-negative");
  if (t.kingpinToAxleCenterIn + t.kingpinSetbackIn > t.lengthIn) fail("axle center is behind the trailer");
  return t;
}
