import type { Axle, LoadedDimensions } from "./types.js";

/**
 * Federal size and weight limits for the Interstate System.
 *
 * Source: FHWA, "Bridge Formula Weights" (FHWA-HOP-19-028)
 *   https://ops.fhwa.dot.gov/freight/publications/brdg_frm_wghts/
 * Width: 23 CFR 658.15 (102 inches).
 *
 * States may allow more on their own roads and set their own height limits.
 * There is no federal height limit.
 */
export const FEDERAL_LIMITS = {
  widthIn: 102,
  grossWeightLb: 80_000,
  singleAxleLb: 20_000,
  tandemAxleLb: 34_000,
  /** Axles whose centers are ≤ 40" apart count as one single axle. */
  singleAxleMaxSpreadIn: 40,
  /** A tandem is two axles more than 40" but not more than 96" apart. */
  tandemMaxSpreadIn: 96,
  /** Two consecutive tandems may carry 34,000 lb each if first-to-last is ≥ 36 ft. */
  tandemPairExceptionMinFt: 36,
  sources: [
    "https://ops.fhwa.dot.gov/freight/publications/brdg_frm_wghts/",
    "https://www.ecfr.gov/current/title-23/chapter-I/subchapter-G/part-658",
  ],
} as const;

/**
 * Federal Bridge Formula: W = 500 × (LN/(N−1) + 12N + 36)
 *   L = distance in feet between the outer axles of the group
 *   N = number of axles in the group
 * Result is rounded to the nearest 500 lb. Exact halfway values round down,
 * which matches FHWA's published table (N=3, L=9 → 42,500 lb).
 */
export function bridgeFormulaWeight(lengthFt: number, axleCount: number): number {
  if (!Number.isInteger(axleCount) || axleCount < 2) {
    throw new RangeError(`Bridge formula needs 2+ axles, got ${axleCount}`);
  }
  if (!Number.isFinite(lengthFt) || lengthFt <= 0) {
    throw new RangeError(`Bridge formula needs a positive length, got ${lengthFt}`);
  }
  const n = axleCount;
  const raw = 500 * ((lengthFt * n) / (n - 1) + 12 * n + 36);
  return roundToNearest500HalfDown(raw);
}

function roundToNearest500HalfDown(value: number): number {
  const units = value / 500;
  const floor = Math.floor(units);
  // Treat tiny float noise as exact.
  const frac = units - floor;
  return (frac > 0.5 + 1e-9 ? floor + 1 : floor) * 500;
}

/**
 * Bridge-table L is in whole feet. This rounds a measured inch distance to the
 * nearest foot (6" rounds up).
 * TODO(verify): confirm the official rounding rule for L against 23 CFR 658.17.
 */
export function axleSpanFt(spanIn: number): number {
  return Math.floor(spanIn / 12 + 0.5);
}

export type Severity = "violation" | "warning" | "info";

export interface Flag {
  code: string;
  severity: Severity;
  message: string;
  /** Measured or computed value (inches or pounds, see code). */
  actual?: number;
  limit?: number;
  source?: string;
}

export interface GroupCheck {
  firstAxle: number;
  lastAxle: number;
  axleCount: number;
  spanIn: number;
  spanFt: number;
  weightLb: number;
  allowedLb: number;
  rule: "single" | "tandem" | "bridge-formula" | "tandem-pair-exception";
  ok: boolean;
}

/**
 * Check every run of consecutive axles against the federal axle and bridge limits.
 * Axles must be sorted front to rear.
 */
export function checkBridgeFormula(axles: readonly Axle[]): GroupCheck[] {
  const results: GroupCheck[] = [];
  const sorted = [...axles].sort((a, b) => a.positionIn - b.positionIn);

  // Single axles.
  sorted.forEach((axle, i) => {
    results.push({
      firstAxle: i,
      lastAxle: i,
      axleCount: 1,
      spanIn: 0,
      spanFt: 0,
      weightLb: axle.weightLb,
      allowedLb: FEDERAL_LIMITS.singleAxleLb,
      rule: "single",
      ok: axle.weightLb <= FEDERAL_LIMITS.singleAxleLb,
    });
  });

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const group = sorted.slice(i, j + 1);
      const spanIn = sorted[j]!.positionIn - sorted[i]!.positionIn;
      const spanFt = axleSpanFt(spanIn);
      const weightLb = group.reduce((s, a) => s + a.weightLb, 0);
      const n = group.length;

      let allowedLb: number;
      let rule: GroupCheck["rule"];

      if (n === 2 && spanIn <= FEDERAL_LIMITS.tandemMaxSpreadIn) {
        allowedLb = FEDERAL_LIMITS.tandemAxleLb;
        rule = "tandem";
      } else {
        allowedLb = Math.min(
          spanFt > 0 ? bridgeFormulaWeight(spanFt, n) : FEDERAL_LIMITS.tandemAxleLb,
          FEDERAL_LIMITS.grossWeightLb,
        );
        rule = "bridge-formula";
        if (isTandemPair(group) && spanFt >= FEDERAL_LIMITS.tandemPairExceptionMinFt) {
          const exception = 2 * FEDERAL_LIMITS.tandemAxleLb;
          if (exception > allowedLb) {
            allowedLb = exception;
            rule = "tandem-pair-exception";
          }
        }
      }

      results.push({
        firstAxle: i,
        lastAxle: j,
        axleCount: n,
        spanIn,
        spanFt,
        weightLb,
        allowedLb,
        rule,
        ok: weightLb <= allowedLb,
      });
    }
  }
  return results;
}

/** Four axles made of two tandems: [a,b] and [c,d] each within tandem spread. */
function isTandemPair(group: readonly Axle[]): boolean {
  if (group.length !== 4) return false;
  const [a, b, c, d] = group as [Axle, Axle, Axle, Axle];
  const tandem = (x: Axle, y: Axle) => {
    const gap = y.positionIn - x.positionIn;
    return gap > FEDERAL_LIMITS.singleAxleMaxSpreadIn && gap <= FEDERAL_LIMITS.tandemMaxSpreadIn;
  };
  return tandem(a, b) && tandem(c, d);
}

/** Federal checks on a computed load. Returns flags, worst first. */
export function checkFederal(load: LoadedDimensions): Flag[] {
  const flags: Flag[] = [];
  const src = FEDERAL_LIMITS.sources[0];

  if (load.overallWidthIn > FEDERAL_LIMITS.widthIn) {
    flags.push({
      code: "width.oversize",
      severity: "violation",
      message: `Overall width exceeds the federal ${FEDERAL_LIMITS.widthIn}" limit; an oversize permit is needed.`,
      actual: load.overallWidthIn,
      limit: FEDERAL_LIMITS.widthIn,
      source: FEDERAL_LIMITS.sources[1],
    });
  }

  if (load.grossWeightLb > FEDERAL_LIMITS.grossWeightLb) {
    flags.push({
      code: "weight.gross",
      severity: "violation",
      message: `Gross weight exceeds the federal ${FEDERAL_LIMITS.grossWeightLb.toLocaleString("en-US")} lb limit; an overweight permit is needed.`,
      actual: load.grossWeightLb,
      limit: FEDERAL_LIMITS.grossWeightLb,
      source: src,
    });
  }

  for (const g of checkBridgeFormula(load.axles)) {
    if (g.ok) continue;
    const which =
      g.axleCount === 1
        ? load.axles[g.firstAxle]?.label ?? `axle ${g.firstAxle + 1}`
        : `axles ${g.firstAxle + 1}–${g.lastAxle + 1}`;
    flags.push({
      code: `axle.${g.rule}`,
      severity: load.axleWeightsAreEstimates ? "warning" : "violation",
      message: `${which}: ${Math.round(g.weightLb).toLocaleString("en-US")} lb over the ${g.allowedLb.toLocaleString("en-US")} lb ${ruleName(g.rule)} limit${load.axleWeightsAreEstimates ? " (based on estimated axle weights)" : ""}.`,
      actual: g.weightLb,
      limit: g.allowedLb,
      source: src,
    });
  }

  flags.push({
    code: "height.state",
    severity: "info",
    message: "There is no federal height limit. Each state sets its own; check every state on the route.",
    actual: load.overallHeightIn,
  });

  if (load.frontOverhangIn > 0 || load.rearOverhangIn > 0) {
    flags.push({
      code: "overhang.state",
      severity: "info",
      message: "Load overhangs the trailer. Overhang limits, flags and lights are set by each state.",
      actual: Math.max(load.frontOverhangIn, load.rearOverhangIn),
    });
  }

  const order: Record<Severity, number> = { violation: 0, warning: 1, info: 2 };
  return flags.sort((a, b) => order[a.severity] - order[b.severity]);
}

function ruleName(rule: GroupCheck["rule"]): string {
  switch (rule) {
    case "single":
      return "single-axle";
    case "tandem":
      return "tandem-axle";
    case "tandem-pair-exception":
      return "two-tandem";
    default:
      return "bridge formula";
  }
}
