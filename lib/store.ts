import { create } from "zustand";
import type { Algorithm } from "./types";
import { bubbleSort } from "./algorithms/bubbleSort";
import { algorithmsBySlug } from "./algorithms";
import { buildSteps, deriveTrace, type StepView, type DerivedStep } from "./viewModel";

const DEFAULT_INPUT = [5, 3, 8, 4, 2, 7, 1];

function compute(algo: Algorithm, input: number[]) {
  const views = buildSteps(algo, input);
  const derived = deriveTrace(views);
  return { views, derived, totalSteps: Math.max(0, views.length - 1) };
}

/** n distinct values in [10, 99] — distinct so Framer Motion can key bars by value. */
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
  input: number[];
  views: StepView[];
  derived: DerivedStep[];
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: number;

  load: (slug: string) => void;
  shuffle: (n?: number) => void;
  setInput: (values: number[]) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  stepForward: () => void;
  stepBack: () => void;
  scrub: (step: number) => void;
  setSpeed: (speed: number) => void;
  tick: () => void;
}

const initial = compute(bubbleSort, DEFAULT_INPUT);

export const useVisualizer = create<VisualizerState>((set, get) => ({
  algo: bubbleSort,
  input: DEFAULT_INPUT,
  views: initial.views,
  derived: initial.derived,
  currentStep: 0,
  totalSteps: initial.totalSteps,
  isPlaying: false,
  speed: 700,

  load: (slug) => {
    const algo = algorithmsBySlug[slug] ?? bubbleSort;
    const input = DEFAULT_INPUT;
    set({ algo, input, ...compute(algo, input), currentStep: 0, isPlaying: false });
  },

  shuffle: (n) => {
    const { algo, input } = get();
    const size = n ?? input.length;
    const next = randomDistinct(size);
    set({ input: next, ...compute(algo, next), currentStep: 0, isPlaying: false });
  },

  setInput: (values) => {
    const { algo } = get();
    const clean = values.filter((v) => Number.isFinite(v)).slice(0, 16);
    if (clean.length < 2) return;
    set({ input: clean, ...compute(algo, clean), currentStep: 0, isPlaying: false });
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
}));
