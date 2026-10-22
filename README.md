# OpenDeck

**Oversize/overweight load checker for open-deck and heavy-haul freight.**

You enter a piece of equipment and a trailer. OpenDeck tells you the loaded dimensions and gross weight, checks them against federal size and weight limits and the federal bridge formula, and (as state rules are added) shows what permits, escorts, and restrictions apply on your route.

Built for freight brokers, dispatchers, and owner-operators who move construction equipment, machinery, and other open-deck loads. Today they do this math by hand on every quote.

> ⚠️ **Not legal advice.** Size and weight rules change and vary by state. Always confirm with the state DOT permit office before moving a load. Every rule in OpenDeck links to its source.

---

## Status

| Part | Status |
|---|---|
| `@opendeck/core`: loaded dimensions, overhang, gross weight, axle layout | ✅ Done, tested |
| Federal limits + federal bridge formula | ✅ Done, tested against FHWA worked examples |
| Trailer library (flatbed, step deck, double drop, RGN) | ✅ Done |
| State rules (WV, VA, PA, OH, KY, MD first) | ⏳ Next |
| Web app with load diagram | ⏳ Planned |

See [ROADMAP.md](ROADMAP.md) for everything planned.

## Quick example

```ts
import { computeLoad, checkFederal, getTrailer, formatFtIn } from "@opendeck/core";

const load = computeLoad({
  equipment: { lengthIn: 372, widthIn: 114, heightIn: 126, weightLb: 48_000 },
  trailer: getTrailer("step-deck-48"), // sits on the lower deck by default
});

formatFtIn(load.overallHeightIn); // 13' 10"
load.grossWeightLb;               // 79000

checkFederal(load);
// [ { severity: "violation", code: "width.oversize", ... },
//   { severity: "info",      code: "height.state",   ... } ]
```

All math is in inches and pounds. Unit helpers (`ftIn`, `toFtIn`, `kgToLb`, `mToIn`, ...) convert at the edges.

## What it checks today

- **Width:** 102" federal limit
- **Gross weight:** 80,000 lb
- **Axles:** 20,000 lb single, 34,000 lb tandem
- **Federal bridge formula** `W = 500 × (LN/(N−1) + 12N + 36)` over every run of consecutive axles, including the two-tandem 36 ft exception
- **Height and overhang:** flagged for state review (there is no federal height limit)

Axle weights are a rough estimate in this version (steer axle fixed, the rest split by axle count), so axle overloads are reported as warnings. Load-position-based axle weights are on the roadmap.

Trailer presets are **typical values**, not specs for any specific trailer. Override them with `customizeTrailer()` when you have the carrier's real numbers.

## Built with

- TypeScript (strict), no runtime dependencies in the core library
- pnpm workspaces
- Vitest

## Getting started

```bash
# requirements: Node 20+, pnpm
git clone https://github.com/<your-username>/opendeck.git
cd opendeck
pnpm install
pnpm test        # run the core library tests
pnpm typecheck
pnpm build
```

No API keys or accounts needed.

## Project structure

```
opendeck/
├─ packages/core/
│  ├─ src/
│  │  ├─ units.ts       # feet/inches, metric conversions
│  │  ├─ load.ts        # loaded dimensions + axle layout
│  │  ├─ federal.ts     # federal limits + bridge formula
│  │  ├─ trailers.ts    # trailer presets
│  │  └─ data/trailers.json
│  └─ test/
├─ ROADMAP.md
└─ LICENSE
```

## Sources

- FHWA, *Bridge Formula Weights* (FHWA-HOP-19-028): https://ops.fhwa.dot.gov/freight/publications/brdg_frm_wghts/
- 23 CFR Part 658, Truck Size and Weight: https://www.ecfr.gov/current/title-23/chapter-I/subchapter-G/part-658

## Contributing

Corrections to rules are the most valuable contribution. Open an issue with the rule, the correct value, and a link to the official source.

## License

MIT. See [LICENSE](LICENSE).
