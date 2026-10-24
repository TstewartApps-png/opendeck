# Roadmap

The goal: a broker or dispatcher enters a piece of equipment and a route, and OpenDeck tells them which trailer to use, whether the load needs permits in each state, what escorts and restrictions apply, and roughly what the permits will cost.

## v1: Core calculations (done)
- [x] Monorepo setup (pnpm workspaces)
- [x] Load dimension calculator (height, width, length, overhang, GVW)
- [x] Starter trailer library: flatbed, step deck, double drop, RGN
- [x] Federal limits + federal bridge formula and axle checks
- [x] Unit tests for every calculation, CI on every push
- [ ] Verify the official rounding rule for axle span L (23 CFR 658.17) (#1)

## v2: Full trailer catalog + trailer recommendation
- [ ] Expand the catalog to every common open-deck and heavy-haul type, with typical deck heights, lengths, widths, tare weights, axle layouts and rated capacity:
  - Flatbed (48', 53'), extendable flatbed
  - Step deck (48', 53'), extendable step deck
  - Double drop / lowboy (fixed neck, removable gooseneck)
  - RGN: 2-axle, 3-axle, 4-axle, stretch RGN
  - Multi-axle RGN with jeeps / boosters / flip axles (heavy haul)
  - Beam and perimeter trailers, specialized (schnabel) for superloads
  - Conestoga, hotshot gooseneck, tilt / landoll
- [ ] Trailer recommendation engine: given equipment dimensions and weight, rank trailers by the fewest permits needed (legal first, then oversize only, then overweight), and explain why each one fits or doesn't
- [ ] Show which trailer keeps the load under legal height so it avoids a height permit

## v3: Permits by state
- [ ] State rules schema + validation test (#2)
- [ ] State rules data, starting with WV, VA, PA, OH, KY, MD, expanding to all 48 contiguous states (#3, #4). Every value cites an official source with a last-verified date
- [ ] Single-state legality check (#5)
- [ ] Multi-state route check: an ordered list of states, with a permit summary for each
- [ ] Escort / pilot car triggers, flags, signs, lights, and travel-time restrictions (night, weekend, holiday)
- [ ] Superload thresholds and a clear "route survey / engineering review likely" warning

## v4: Permit cost estimates
- [ ] Fee schedule data model per state: flat oversize fees, overweight fees (per ton-mile, per axle, or tiered), annual vs single-trip, superload fees
- [ ] Permit cost estimator: estimated fee range per state and a route total, every number linked to the state's published fee schedule
- [ ] Escort cost estimate ranges (front / rear / police escort) as rough planning numbers, clearly labeled as estimates
- [ ] "Last verified" warnings when a fee is older than 12 months

## v5: Enterprise web app
- [ ] Web app: equipment + trailer form and results panel (#6)
- [ ] Clean, professional design system: consistent typography, spacing, dark mode, mobile-friendly, accessible
- [ ] Side-view load diagram (SVG) with labeled dimensions (#7)
- [ ] Load summary / quote sheet a broker can send to a customer or carrier, exportable to PDF
- [ ] Shareable result link (load encoded in the URL, no database)
- [ ] Saved equipment presets (in the browser)
- [ ] Deploy to Vercel (#8)
- [ ] Docs site for the library and the rules data

## v6: Accuracy + developer use
- [ ] Axle weights from load position instead of an even split (#9)
- [ ] Multiple pieces on one trailer
- [ ] CLI: `opendeck check ...` (#10)
- [ ] Publish `@opendeck/core` to npm
- [ ] Contribution guide for submitting rule and fee corrections
