import { create } from "zustand";
import type { Algorithm, AlgoInput, DerivedStep, StageView } from "./types";
import { bubbleSort } from "./algorithms/bubbleSort";
import { algorithmsBySlug } from "./algorithms";

const DEFAULT_VALUES = [5, 3, 8, 4, 2, 7, 1];
const DEFAULT_TARGET = 7;
const DEFAULT_NODES = 7;
const DEFAULT_SEED = 7;

/** Largest input each kind can draw legibly. */
export const MAX_ITEMS: Record<Algorithm["kind"], number> = { sort: 16, search: 16, tree: 12, graph: 10 };

function compute(algo: Algorithm, input: AlgoInput) {
  const { views, derived } = algo.build(input);
  return { views, derived, totalSteps: Math.max(0, views.length - 1) };
}

/** n distinct values in [10, 99] — distinct so every bar / tree key is its own node. */
function randomDistinct(n: number): number[] {
  const pool = Array.from({ length: 90 }, (_, i) => i + 10);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

interface VisualizerState {
  algo: Algorithm;
  /** array values (sort / search) or keys to insert (tree) */
  input: number[];
  target: number;
  graphNodes: number;
  graphSeed: number;
  views: StageView[];
  derived: DerivedStep[];
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: number;

  load: (slug: string) => void;
  shuffle: (n?: number) => void;
  setInput: (values: number[]) => void;
  setTarget: (target: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  stepForward: () => void;
  stepBack: () => void;
  scrub: (step: number) => void;
  setSpeed: (speed: number) => void;
  tick: () => void;
}

const inputOf = (s: Pick<VisualizerState, "input" | "target" | "graphNodes" | "graphSeed">): AlgoInput =>
  ({ values: s.input, target: s.target, nodes: s.graphNodes, seed: s.graphSeed });

const initialInput = { input: DEFAULT_VALUES, target: DEFAULT_TARGET, graphNodes: DEFAULT_NODES, graphSeed: DEFAULT_SEED };
const initial = compute(bubbleSort, inputOf(initialInput));

/**
 * A lesson's starting state, computed without touching the store. The page renders
 * this until the store has loaded the slug, so the server HTML and the first paint
 * show the right lesson (not whatever the store held — previously always Bubble Sort).
 */
export function initialFor(slug: string) {
  const algo = algorithmsBySlug[slug] ?? bubbleSort;
  return { algo, ...initialInput, ...compute(algo, inputOf(initialInput)), currentStep: 0, isPlaying: false };
}

export const useVisualizer = create<VisualizerState>((set, get) => {
  /** Rebuild the trace from a (partial) new input and rewind. */
  const rebuild = (patch: Partial<Pick<VisualizerState, "input" | "target" | "graphNodes" | "graphSeed">>, algo = get().algo) => {
    const s = get();
    const merged = { input: s.input, target: s.target, graphNodes: s.graphNodes, graphSeed: s.graphSeed, ...patch };
    set({ algo, ...merged, ...compute(algo, inputOf(merged)), currentStep: 0, isPlaying: false });
  };

  return {
    algo: bubbleSort,
    ...initialInput,
    views: initial.views,
    derived: initial.derived,
    currentStep: 0,
    totalSteps: initial.totalSteps,
    isPlaying: false,
    speed: 700,

    load: (slug) => {
      const algo = algorithmsBySlug[slug] ?? bubbleSort;
      rebuild({ ...initialInput }, algo);
    },

    shuffle: (n) => {
      const { algo, input, graphNodes } = get();
      if (algo.kind === "graph") {
        rebuild({ graphNodes: n ?? graphNodes, graphSeed: 1 + Math.floor(Math.random() * 1_000_000) });
        return;
      }
      const values = randomDistinct(Math.min(n ?? input.length, MAX_ITEMS[algo.kind]));
      // searches get a target that is in the array, so the walk ends in a find by default
      const target = algo.kind === "search" ? values[Math.floor(Math.random() * values.length)] : get().target;
      rebuild({ input: values, target });
    },

    setInput: (values) => {
      const { algo } = get();
      const clean = values.filter((v) => Number.isFinite(v)).slice(0, MAX_ITEMS[algo.kind]);
      if (clean.length < 2) return;
      rebuild({ input: clean });
    },

    setTarget: (target) => {
      if (!Number.isFinite(target)) return;
      rebuild({ target });
    },

    play: () => {
      if (get().currentStep >= get().totalSteps) set({ currentStep: 0, isPlaying: true });
      else set({ isPlaying: true });
    },
    pause: () => set({ isPlaying: false }),
    togglePlay: () => (get().isPlaying ? get().pause() : get().play()),

    stepForward: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, s.totalSteps), isPlaying: false })),
    stepBack: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 0), isPlaying: false })),
    scrub: (step) => set({ currentStep: step, isPlaying: false }),
    setSpeed: (speed) => set({ speed }),

    tick: () => {
      const { currentStep, totalSteps, isPlaying } = get();
      if (isPlaying && currentStep < totalSteps) set({ currentStep: currentStep + 1 });
      else if (isPlaying && currentStep >= totalSteps) set({ isPlaying: false });
    },
  };
});
