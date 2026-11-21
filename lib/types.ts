/**
 * The whole simulator rests on one idea: instrument, don't animate.
 *
 * An algorithm runs once and emits a flat list of `Step`s (a *trace*). The UI is
 * then a pure function of (initial input, steps[0..currentStep]) — which is what
 * makes play / pause / rewind / scrub fall out for free. No per-frame hacks.
 */

/** One recorded event in an algorithm's execution. */
export type SortStep =
  | { type: "compare"; i: number; j: number; note?: string }
  | { type: "swap"; i: number; j: number; note?: string }
  | { type: "markSorted"; index: number; note?: string };

/** A derived snapshot of the array at a given step — what the renderer draws. */
export interface SortFrame {
  /** Current order of values. */
  array: number[];
  /** Indices currently being compared, if any. */
  comparing: [number, number] | null;
  /** Indices currently being swapped, if any. */
  swapping: [number, number] | null;
  /** Indices locked into their final sorted position. */
  sorted: Set<number>;
  /** Human-readable description of what this step does. */
  caption: string;
}

export interface Algorithm {
  slug: string;
  name: string;
  category: string;
  /** One-line description for the detail panel. */
  summary: string;
  complexity: { time: string; space: string };
  /** Source lines, for the future code-sync panel. */
  pseudocode: string[];
  /** Produce the full trace for a given input. */
  trace: (input: number[]) => SortStep[];
  /** Replay steps[0..index] into a drawable frame. */
  frameAt: (input: number[], steps: SortStep[], index: number) => SortFrame;
}
