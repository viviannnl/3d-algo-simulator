# AlgoViz · 3d-algo-simulator

An interactive **algorithm visualizer** — watch sorting (and soon graph/tree)
algorithms execute step by step, scrub the timeline, shuffle the input, and read a
live execution trace. Built in a dense, cohesive **"blueprint" aesthetic** — deep
navy, cyan accent, monospace, dot-grid — inspired by
[Protocol Explorer](https://protocol-explorer-alpha.vercel.app/) and
[Designed to Scale](https://designedtoscale.app).

> Note: started as a 3D idea (hence the repo name); settled on **2D**, which reads
> far more clearly for algorithms. The core model is identical either way.

## The core idea — *instrument, don't animate*

The algorithm runs once and emits a flat list of steps (a **trace**). The UI is then
a pure function of `(input, steps[0…currentStep])` — which is what makes play / pause /
rewind / **scrub** fall out for free, and what lets you **shuffle or enter a custom
array** and instantly get a new, correct visualization (the trace just regenerates).

```
input ──▶ Algorithm.trace() ──▶ Step[] ──▶ buildSteps() ──▶ frames ──▶ blueprint UI
                                               ▲
                                        scrubber / keyboard
```

## Stack

- **Next.js 15** (App Router) + **TypeScript** — `/` catalog, `/algorithms/[slug]` visualizer
- **Tailwind v4** on a cyan-blueprint token contract (`app/tokens.css`)
- **Zustand** playback store · **Framer Motion** FLIP swap animation
- **Fira Code** — monospace throughout for blueprint precision

## Features

- **Dense telemetry rail** — live comparisons / swaps / sorted counters, pseudocode with
  the current line lit, and a scrollable **step-trace table** (click any row to jump).
- **Dimensional stage** — bars scale to value on a dot-grid with a value axis, a pulsing
  **compare/swap bracket**, and real sliding **FLIP** animation on swaps.
- **Shuffle & custom input** — reshuffle, pick array size (6/8/10/12), or type your own.
- **Keyboard** — `space` play/pause · `←/→` step · `s` shuffle.

## Project layout

```
app/              catalog page, visualizer route, theme + layout
components/        TopBar, catalog/*, visualizer/* (stage, rail, transport, input)
lib/
  types.ts        Step / Frame / Algorithm contracts
  algorithms/     trace generators (bubbleSort) + catalog metadata
  viewModel.ts    trace → drawable frames + derived telemetry
  store.ts        Zustand playback store
```

## Develop

```bash
npm install
npm run dev     # http://localhost:3000
```

## Tests

Pure-logic unit tests (Vitest) cover the correctness-critical layer — every
algorithm sorts correctly across edge cases + 24 deterministic random inputs, every
intermediate frame stays a permutation of the input, and the view-model counters /
pseudocode mapping stay consistent.

```bash
npm test          # run the suite
npm run test:cov  # with coverage
```

Current: **539 tests**, ~99% statement coverage on `lib/` (all sort generators 100%).
UI-layer (browser) coverage is a separate pass — see the `ui-testing` skill.

## Roadmap

- [x] Bubble / Insertion / Selection / Quick sort — full traces, 100% covered
- [ ] Merge sort — needs a write/overwrite step op (not swap-based)
- [ ] Graph algorithms (BFS/DFS/Dijkstra) — generalize the trace model beyond arrays
- [ ] Tree algorithms (BST insert, traversal)
- [ ] Code-sync panel polish, per-algorithm theming

## Design provenance

The visual design was explored as a prototype in **OJO** (ojo.art), then hand-ported
into this Next.js app with the trace-driven architecture above.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
