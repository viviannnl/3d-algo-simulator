# Algorithm Visualizer · 3d-algo-simulator

An interactive **algorithm visualizer** — watch sorting (and soon graph/tree)
algorithms execute step by step, scrub the timeline, shuffle the input, and read a
live execution trace. Styled as a piece of **"creamy CRT" hardware** (Model AV-1):
a warm putty chassis, machined keys, and recessed CRT glass lit by amber and sage
phosphor, with editorial serif type and mono spec labels.

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

- **Next.js 15** (App Router) + **TypeScript** — no landing page: `/` opens the first lesson; `/algorithms/[slug]` is a lesson
- **Tailwind v4** on a creamy-CRT token contract (`app/tokens.css`, every text pair ≥ 4.5:1)
- **Zustand** playback store · **Framer Motion** FLIP swap animation
- **Instrument Serif** (display) · **Inter** (UI) · **IBM Plex Mono** (labels, data)

## Features

- **A course, not a catalog** — a sidebar of chapters (Sorting / Graphs / Trees) and lessons; watching
  a lesson to the end marks it complete (kept in this browser), and a *Next* key lights up to move on.

- **Dense telemetry rail** — live comparisons / swaps / sorted counters, pseudocode with
  the current line lit, and a scrollable **step-trace table** (click any row to jump).
- **Dimensional stage** — bars scale to value on a dot-grid with a value axis, a pulsing
  **compare/swap bracket**, and real sliding **FLIP** animation on swaps.
- **Shuffle & custom input** — reshuffle, pick array size (6/8/10/12), or type your own.
- **Keyboard** — `space` play/pause · `←/→` step · `s` shuffle.

## Motion

- **First visit** — the screen settles in as one loose cascade (~1.5s): top bar and
  course, then the lesson header, the CRT bezel and telemetry module, the transport.
  Meanwhile the tube boots ("AV-1 · warming up"), the picture opens, and the bars
  rise from the baseline left to right (graph/tree nodes pop in, edges follow).
- **Changing lesson** — no replay of the cascade; the CRT changes channel
  ("CH 03.3 · DIJKSTRA") and the new picture fills in.
- **New input** (shuffle, custom, target, new graph) — a burst of static, then the
  picture rises again. Stepping and scrubbing never replay an entrance.
- Transform + opacity only, every piece ≤ 400ms; `prefers-reduced-motion` turns all
  of it off (content is simply there). Timeline lives in `lib/motion.ts`.

## Project layout

```
app/              / → first lesson, lesson route, theme + layout
components/        TopBar, course/CourseSidebar, visualizer/* (stage, rail, transport, input)
lib/
  types.ts        Step / Frame / Algorithm contracts
  algorithms/     sorts, searches, graphs, trees + the course catalog
  network.ts      seeded graph generator + recorder for node/edge algorithms
  viewModel.ts    trace → drawable frames + derived telemetry
  store.ts        Zustand playback store
  course.ts       catalog read as a course (location, prev/next lesson)
  progress.ts     completed lessons (localStorage, failure-tolerant)
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

Current: **1,022 tests** (adds searches, graph generator + BFS/DFS/Dijkstra — checked against Bellman-Ford — and trees), ~99% statement coverage on `lib/` (all sort generators 100%).

### Browser (UI) suite — `e2e/`

Playwright against the real production build (built into `.next-e2e`, so it never
collides with a running `npm run dev`). Seven layers: deterministic fixtures
(seeded `Math.random`, controlled clock), behavior, a full state matrix
(`e2e/state-matrix.md`), visual regression (desktop + 390px phone), axe
WCAG 2.1 AA + a Tab walk, measured JS coverage, and a strict console.

```bash
cd e2e && npm install            # once (uses your installed Google Chrome)
npx playwright test              # 148 tests (147 run + 1 phone-only skip on desktop), ~3 min
npx playwright test --update-snapshots   # ONLY after an intended design change — inspect the diff first
rm -rf .coverage && npx playwright test && node coverage-report.mjs   # coverage of the app's own JS
npx playwright show-report       # HTML report, traces for failures
```

Current: **147 passing**, 100% of app functions executed. On a machine deep in swap a
single test can stall or fail during browser setup; it passes on rerun (see the `workers` note in the config).
Baselines are per-OS (`*-darwin.png`); generate Linux ones in CI's image before gating on them.

## Algorithms

| Chapter | Lessons | Stage |
|---|---|---|
| 01 Sorting | Bubble, Insertion, Selection, Quick, **Merge** (buffer + writes), **Heap**, **Shell** | bars |
| 02 Searching | **Linear**, **Binary** (live window + target line) | bars |
| 03 Graphs | **BFS** (queue), **DFS** (call stack), **Dijkstra** (distances, shortest-path tree) | nodes + edges |
| 04 Trees | **BST Insert**, **In-order Traversal** | nodes + edges |

Graphs are generated from a seed (connected, no crossing edges), so *New graph* is
reproducible and tests are deterministic. Every algorithm implements one contract —
`build(input) → { views, derived }` — so the store, transport and telemetry rail are shared.

## Roadmap

- [ ] Topological Sort, AVL rotations (listed as "soon" in the course)
- [ ] Pick the start node by clicking it; weighted-edge editing

## Design provenance

The visual design was explored as a prototype in **OJO** (ojo.art), then hand-ported
into this Next.js app with the trace-driven architecture above.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
