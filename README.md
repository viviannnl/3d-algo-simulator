# 3d-algo-simulator

An interactive **3D algorithm simulator** — watch sorting, graph, and tree algorithms
execute step by step in a real 3D scene you can rotate, zoom, and scrub through.

Inspired by [Designed to Scale](https://designedtoscale.app) (which uses 2D animated
diagrams for *system design*) — this project applies the same "replayable, step-based"
teaching model to **algorithms**, in genuine 3D.

## Concept

The whole thing rests on one idea: **instrument, don't animate.**

Instead of hand-authoring animations, we run the real algorithm and record every
meaningful event into a list of steps (a *trace*). The 3D scene is then a pure function
of `(initial input, steps[0..currentStep])`. Scrubbing the timeline just replays steps
up to an index — which gives play / pause / rewind / scrub **for free**.

```
Algorithm  ──instrument──▶  Step[]  ──render──▶  3D scene
                               ▲
                          timeline / scrubber
```

## Planned architecture

| Layer | Choice |
|-------|--------|
| App shell & routing | **Next.js + TypeScript** (`/algorithms/[slug]`) |
| 3D rendering | **React Three Fiber** (`@react-three/fiber`) + **drei** |
| Playback state | **Zustand** (current step index, play/pause, speed) |
| Interpolation | drei `useSpring` / Framer Motion for smooth transitions between states |
| Camera | drei `<OrbitControls>` — rotate/zoom the structure (where 3D earns its keep) |

### Trace format (example — bubble sort)

```ts
type Step =
  | { type: 'compare'; i: number; j: number }
  | { type: 'swap'; i: number; j: number }
  | { type: 'markSorted'; i: number };
```

The renderer walks `steps[0..currentStep]` to derive positions and colors
(comparing = yellow, swapping = red, sorted = green).

## Roadmap

- [ ] **Step 1** — Bubble sort as animated cubes + OrbitControls + working scrub bar
      (proves the trace → render → scrub loop end to end)
- [ ] **Step 2** — Transport controls: Zustand store, speed slider, step ◀ ▶
- [ ] **Step 3** — A graph algorithm (BFS) — forces the trace format to generalize
      beyond arrays
- [ ] **Step 4** — Lesson shell: sidebar grouped by category, routing, per-algorithm
      markdown explanation panel
- [ ] **Step 5** — Polish: code-sync panel (highlight current line), materials/lighting,
      custom input (shuffle / enter your own array)

## UI layout (target)

```
┌────────────┬──────────────────────────────┬───────────┐
│  Sidebar   │                              │  Code     │
│  Sorting   │        3D <Canvas>           │  panel    │
│  Graphs    │   (OrbitControls scene)      │  (current │
│  Trees     │                              │  line hl) │
│  DP        │                              │           │
├────────────┴──────────────────────────────┴───────────┤
│  ◀  ▶   ⏯   [======scrubber======]   speed ▾          │
└────────────────────────────────────────────────────────┘
```

## Status

🌱 Just getting started — repo scaffolding + plan. Code lands with Step 1.

## License

TBD
