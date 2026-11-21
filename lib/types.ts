/**
 * The whole simulator rests on one idea: instrument, don't animate.
 *
 * An algorithm runs once and emits a flat list of `Step`s (a *trace*). The UI is
 * then a pure function of (initial input, steps[0..currentStep]) — which is what
 * makes play / pause / rewind / scrub fall out for free. No per-frame hacks.
 */

/** One recorded event. `line` points at the pseudocode line it corresponds to. */
export type SortStep =
  | { type: "compare"; i: number; j: number; line?: number; note?: string }
  | { type: "swap"; i: number; j: number; line?: number; note?: string }
  | { type: "markSorted"; index: number; line?: number; note?: string };

/** A derived snapshot of the array at a given step — what the renderer draws. */
export interface SortFrame {
  array: number[];
  comparing: [number, number] | null;
  swapping: [number, number] | null;
  sorted: Set<number>;
  caption: string;
}

export interface Algorithm {
  slug: string;
  name: string;
  category: string;
  summary: string;
  complexity: { time: string; space: string };
  pseudocode: string[];
  /** Produce the full trace for a given input. */
  trace: (input: number[]) => SortStep[];
  /** Replay steps[0..index] into a drawable frame. */
  frameAt: (input: number[], steps: SortStep[], index: number) => SortFrame;
}
