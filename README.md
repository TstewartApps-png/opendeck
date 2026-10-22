# OpenDeck

**Oversize/overweight load checker for open-deck and heavy-haul freight.**

You enter a piece of equipment and a trailer. OpenDeck tells you the loaded dimensions and gross weight. It shows whether the load is legal, oversize, or overweight in each state on your route, and what permits, escorts, and restrictions apply.

Built for freight brokers, dispatchers, and owner-operators who move construction equipment, machinery, and other open-deck loads. Today they do this math by hand on every quote.

> ⚠️ **Not legal advice.** State size and weight rules change. Always confirm with the state DOT permit office before moving a load. Every rule in OpenDeck links to its source.

---

## Features (v1)

- **Load calculator.** Machine dimensions + trailer deck height/length → overall loaded height, width, length, and gross vehicle weight.
- **Trailer library.** Common open-deck trailers (flatbed, step deck, double drop, RGN/lowboy) with typical deck heights, lengths, and tare weights.
- **State legality check.** Compares the load to each state's legal limits and flags oversize/overweight dimensions.
- **Bridge formula check.** Axle-group weights checked against the federal bridge formula and axle limits.
- **Route view.** Pick the states on a route and get a state-by-state summary of permit, escort, and travel-restriction triggers.
- **Load diagram.** A side-view drawing of the load on the trailer with dimensions labeled.

## Built with

- TypeScript
- `packages/core`: pure calculation library (no UI, fully unit tested)
- `apps/web`: Next.js + Tailwind web app
- Vitest for tests
- State rules stored as versioned JSON with a source URL and a "last verified" date on every entry

## Getting started

```bash
# requirements: Node 20+, pnpm
git clone https://github.com/<your-username>/opendeck.git
cd opendeck
pnpm install
pnpm test        # run the core library tests
pnpm dev         # start the web app at http://localhost:3000
```

No API keys are needed for v1.

## Project structure

```
opendeck/
├─ packages/core/        # calculation engine + state rules data
│  ├─ src/
│  └─ data/states/       # one JSON file per state, with sources
├─ apps/web/             # Next.js UI
├─ ROADMAP.md
└─ LICENSE
```

## Contributing

Corrections to state rules are the most valuable contribution. Open an issue with the state, the rule, and a link to the official source.

## License

MIT. See [LICENSE](LICENSE).
