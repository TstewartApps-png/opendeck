# Roadmap

## v1: Core checker (in progress)
- [x] Monorepo setup (pnpm workspaces)
- [x] Load dimension calculator (height, width, length, overhang, GVW)
- [x] Trailer library: flatbed, step deck, double drop, RGN/lowboy
- [x] Federal limits + federal bridge formula and axle checks
- [x] Unit tests for every calculation
- [x] CI: run tests on every push
- [ ] Verify the official rounding rule for axle span L (23 CFR 658.17) and update `axleSpanFt`
- [ ] State rules schema (zod) + validation test
- [ ] State rules data for first 6 states: WV, VA, PA, OH, KY, MD (every value with source URL + last verified date)
- [ ] Single-state legality check
- [ ] Web app (`apps/web`, Next.js + Tailwind): equipment + trailer form, results panel
- [ ] Side-view load diagram (SVG)
- [ ] Deploy to Vercel

## v2: Routes
- [ ] Multi-state route check (ordered list of states)
- [ ] State-by-state summary: permit needed, escort/pilot car triggers, flags/signs/lights, travel-time restrictions
- [ ] Shareable result link (state encoded in URL, no database)
- [ ] Export result as PDF

## v3: Coverage + data quality
- [ ] Expand state rules to all 48 contiguous states
- [ ] "Last verified" warnings when a rule is older than 12 months
- [ ] Script that validates every state JSON file against the schema
- [ ] Contribution guide for submitting rule corrections

## v4: Load planning
- [ ] Axle weight distribution from load position (replace the v1 estimate)
- [ ] Equipment presets (user-entered, saved in the browser)
- [ ] Drag-to-position load placement on the deck
- [ ] Multiple pieces on one trailer

## v5: Developer use
- [ ] Publish `@opendeck/core` to npm
- [ ] CLI: `opendeck check --height 11.5 --width 10 --weight 52000 --trailer rgn-3-axle --states WV,VA`
- [ ] API docs
