import type {
  Axle,
  AxleGroup,
  Deck,
  Equipment,
  LoadedDimensions,
  Placement,
  Tractor,
  Trailer,
} from "./types.js";

/**
 * Typical sleeper tractor. These are planning defaults, not measurements;
 * callers should override with the real truck when they have it.
 */
export const TYPICAL_TRACTOR: Tractor = {
  weightLb: 19_000,
  steerAxleWeightLb: 12_000,
  wheelbaseIn: 230,
  driveAxles: { count: 2, spreadIn: 52 },
  bumperToSteerIn: 40,
  fifthWheelOffsetIn: 0,
};

export interface LoadInput {
  equipment: Equipment;
  trailer: Trailer;
  tractor?: Tractor;
  placement?: Placement;
}

/** Pick the deck the load sits on: the named one, or the lowest deck. */
export function pickDeck(trailer: Trailer, name?: string): Deck {
  if (trailer.decks.length === 0) {
    throw new Error(`Trailer "${trailer.id}" has no decks`);
  }
  if (name) {
    const found = trailer.decks.find((d) => d.name === name);
    if (!found) {
      const names = trailer.decks.map((d) => d.name).join(", ");
      throw new Error(`Trailer "${trailer.id}" has no deck "${name}" (has: ${names})`);
    }
    return found;
  }
  return trailer.decks.reduce((low, d) => (d.heightIn < low.heightIn ? d : low));
}

/**
 * Compute loaded height, width, length, overhang, gross weight and an axle layout.
 * Pure function: no state rules, no limits. Pair with the checks in federal.ts.
 */
export function computeLoad(input: LoadInput): LoadedDimensions {
  const { equipment, trailer } = input;
  const tractor = input.tractor ?? TYPICAL_TRACTOR;
  validateEquipment(equipment);

  const deck = pickDeck(trailer, input.placement?.deck);
  const offset = input.placement?.offsetIn ?? 0;

  // Where the equipment sits, measured from the front of the trailer.
  const loadFront = deck.startIn + offset;
  const loadRear = loadFront + equipment.lengthIn;

  const frontOverhangIn = Math.max(0, -loadFront);
  const rearOverhangIn = Math.max(0, loadRear - trailer.lengthIn);

  const overallHeightIn = deck.heightIn + equipment.heightIn;
  const overallWidthIn = Math.max(trailer.widthIn, equipment.widthIn);
  const trailerWithLoadLengthIn = trailer.lengthIn + frontOverhangIn + rearOverhangIn;

  // Longitudinal layout, measured from the steer axle.
  const driveCenter = tractor.wheelbaseIn;
  const kingpin = driveCenter + tractor.fifthWheelOffsetIn;
  const trailerFront = kingpin - trailer.kingpinSetbackIn;
  const trailerAxleCenter = kingpin + trailer.kingpinToAxleCenterIn;
  const rearmost = Math.max(trailerFront + trailer.lengthIn, trailerFront + loadRear);
  const overallLengthIn = tractor.bumperToSteerIn + rearmost;

  const grossWeightLb = tractor.weightLb + trailer.tareWeightLb + equipment.weightLb;

  const axles = estimateAxleWeights({
    grossWeightLb,
    steerWeightLb: tractor.steerAxleWeightLb,
    driveCenterIn: driveCenter,
    drive: tractor.driveAxles,
    trailerCenterIn: trailerAxleCenter,
    trailer: trailer.axles,
  });

  return {
    overallHeightIn,
    overallWidthIn,
    overallLengthIn,
    trailerWithLoadLengthIn,
    frontOverhangIn,
    rearOverhangIn,
    grossWeightLb,
    deckUsed: deck.name,
    axles,
    axleWeightsAreEstimates: true,
  };
}

interface AxleEstimateInput {
  grossWeightLb: number;
  steerWeightLb: number;
  driveCenterIn: number;
  drive: AxleGroup;
  trailerCenterIn: number;
  trailer: AxleGroup;
}

/**
 * v1 estimate: the steer axle carries the tractor's stated steer weight; the rest
 * is split across drive and trailer axles in proportion to axle count.
 * Real distribution depends on where the load sits (see ROADMAP v4).
 */
export function estimateAxleWeights(input: AxleEstimateInput): Axle[] {
  const steer = Math.min(input.steerWeightLb, input.grossWeightLb);
  const remaining = input.grossWeightLb - steer;
  const rearAxleCount = input.drive.count + input.trailer.count;
  const perAxle = rearAxleCount > 0 ? remaining / rearAxleCount : 0;

  return [
    { positionIn: 0, weightLb: steer, label: "Steer" },
    ...spreadAxles(input.driveCenterIn, input.drive, perAxle, "Drive"),
    ...spreadAxles(input.trailerCenterIn, input.trailer, perAxle, "Trailer"),
  ];
}

/** Place `count` axles evenly across `spreadIn`, centered on `centerIn`. */
export function spreadAxles(
  centerIn: number,
  group: AxleGroup,
  weightEachLb: number,
  label: string,
): Axle[] {
  if (group.count < 1) return [];
  if (group.count === 1) {
    return [{ positionIn: centerIn, weightLb: weightEachLb, label: `${label} 1` }];
  }
  const step = group.spreadIn / (group.count - 1);
  const first = centerIn - group.spreadIn / 2;
  return Array.from({ length: group.count }, (_, i) => ({
    positionIn: first + step * i,
    weightLb: weightEachLb,
    label: `${label} ${i + 1}`,
  }));
}

function validateEquipment(e: Equipment): void {
  for (const key of ["lengthIn", "widthIn", "heightIn", "weightLb"] as const) {
    const v = e[key];
    if (!Number.isFinite(v) || v <= 0) {
      throw new RangeError(`equipment.${key} must be a positive number, got ${v}`);
    }
  }
}
