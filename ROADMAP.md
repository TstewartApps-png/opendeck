# Roadmap

## v1: Core checker (in progress)
- [ ] Monorepo setup (pnpm workspaces: `packages/core`, `apps/web`)
- [ ] Load dimension calculator (height, width, length, overhang, GVW)
- [ ] Trailer library: flatbed, step deck, double drop, RGN/lowboy
- [ ] Federal limits + federal bridge formula and axle checks
- [ ] State rules data for first 6 states: WV, VA, PA, OH, KY, MD (with sources)
- [ ] Single-state legality check
- [ ] Web UI: equipment + trailer form, results panel
- [ ] Side-view load diagram (SVG)
- [ ] Unit tests for every calculation
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
- [ ] Equipment presets (user-entered, saved in the browser)
- [ ] Drag-to-position load placement on the deck
- [ ] Axle weight distribution from load position
- [ ] Multiple pieces on one trailer

## v5: Developer use
- [ ] Publish `@opendeck/core` to npm
- [ ] CLI: `opendeck check --height 11.5 --width 10 --weight 52000 --trailer rgn --states WV,VA`
- [ ] API docs
