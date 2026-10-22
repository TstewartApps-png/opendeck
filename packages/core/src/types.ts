/** All lengths in inches, all weights in pounds. */

export interface Equipment {
  name?: string;
  lengthIn: number;
  widthIn: number;
  heightIn: number;
  weightLb: number;
}

export interface Deck {
  /** e.g. "main", "upper", "lower", "well" */
  name: string;
  /** Height of the deck surface above the road. */
  heightIn: number;
  /** Usable length of this deck section. */
  lengthIn: number;
  /** Distance from the front of the trailer to the start of this deck section. */
  startIn: number;
}

export interface AxleGroup {
  /** Number of axles in the group. */
  count: number;
  /** Distance between the first and last axle centers in the group (0 for a single axle). */
  spreadIn: number;
}

export interface Trailer {
  id: string;
  name: string;
  type: "flatbed" | "step-deck" | "double-drop" | "rgn";
  /** Overall trailer length, front to rear. */
  lengthIn: number;
  widthIn: number;
  tareWeightLb: number;
  decks: Deck[];
  /** Distance from the front of the trailer to the kingpin. */
  kingpinSetbackIn: number;
  /** Distance from the kingpin to the center of the trailer axle group. */
  kingpinToAxleCenterIn: number;
  axles: AxleGroup;
}

export interface Tractor {
  weightLb: number;
  /** Weight carried on the steer axle (estimate). */
  steerAxleWeightLb: number;
  /** Steer axle to center of the drive axle group. */
  wheelbaseIn: number;
  driveAxles: AxleGroup;
  /** Front bumper to the steer axle. */
  bumperToSteerIn: number;
  /** Fifth wheel position relative to the drive group center (+ = behind). */
  fifthWheelOffsetIn: number;
}

export interface Placement {
  /** Which deck the equipment sits on (matches Deck.name). Defaults to the lowest deck. */
  deck?: string;
  /** Distance from the start of the chosen deck to the front of the equipment. Default 0. */
  offsetIn?: number;
}

export interface Axle {
  /** Distance from the steer axle. */
  positionIn: number;
  weightLb: number;
  label: string;
}

export interface LoadedDimensions {
  overallHeightIn: number;
  overallWidthIn: number;
  /** Bumper to the rearmost point (trailer or load). */
  overallLengthIn: number;
  /** Trailer length plus any load overhang. */
  trailerWithLoadLengthIn: number;
  frontOverhangIn: number;
  rearOverhangIn: number;
  grossWeightLb: number;
  deckUsed: string;
  axles: Axle[];
  /** Axle weights are a rough estimate in v1; see estimateAxleWeights. */
  axleWeightsAreEstimates: true;
}
