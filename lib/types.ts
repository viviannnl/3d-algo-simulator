/**
 * The whole simulator rests on one idea: instrument, don't animate.
 *
 * An algorithm runs once and emits a flat list of steps (a *trace*). The UI is
 * then a pure function of (initial input, steps[0..currentStep]) — which is what
 * makes play / pause / rewind / scrub fall out for free. No per-frame hacks.
 *
 * Two families share that contract:
 *  - array algorithms (sorting, searching) draw bars on the CRT;
 *  - network algorithms (graphs, trees) draw nodes and edges on the CRT.
 * Each algorithm's `build()` turns an input into frames + telemetry rows, so the
 * store, transport and rail never need to know which family they are playing.
 */

// ---------------------------------------------------------------- array steps

/** One recorded event on an array. `line` points at the pseudocode line it corresponds to. */
export type SortStep =
  | { type: "compare"; i: number; j: number; line?: number; note?: string }
  | { type: "swap"; i: number; j: number; line?: number; note?: string }
  | { type: "markSorted"; index: number; line?: number; note?: string }
  /** overwrite a[i] (merge sort copies values back from its buffer) */
  | { type: "write"; i: number; value: number; from?: "buffer"; line?: number; note?: string }
  /** look at a[i] against the search target */
  | { type: "probe"; i: number; line?: number; note?: string }
  /** the live window narrows to [lo, hi] (binary search bounds, merge segment) */
  | { type: "range"; lo: number; hi: number; buffer?: number[]; line?: number; note?: string }
  /** the search target is at a[i] */
  | { type: "found"; i: number; line?: number; note?: string }
  /** the search target is not in the array */
  | { type: "miss"; line?: number; note?: string };

/** A derived snapshot of the array at a given step — what the renderer draws. */
export interface SortFrame {
  array: number[];
  comparing: [number, number] | null;
  swapping: [number, number] | null;
  sorted: Set<number>;
  caption: string;
  /** single highlighted index (probe / write) */
  focus: number | null;
  /** live window, inclusive */
  range: [number, number] | null;
  found: number | null;
  /** merge sort's side buffer (values not yet written back) */
  buffer: number[] | null;
}

// ---------------------------------------------------------------- network model

export interface NetNode {
  id: string;
  label: string;
  /** position on the glass, 0..1 in both axes */
  x: number;
  y: number;
}

export interface NetEdge {
  a: string;
  b: string;
  w?: number;
}

export type NodeState = "hidden" | "idle" | "frontier" | "current" | "visited" | "found";
export type EdgeState = "hidden" | "idle" | "active" | "tree";

export const edgeKey = (a: string, b: string) => (a < b ? `${a}-${b}` : `${b}-${a}`);

// ---------------------------------------------------------------- shared telemetry

export type StepAction =
  | "init" | "done"
  | "compare" | "swap" | "mark" | "write"
  | "probe" | "range" | "found" | "miss"
  | "visit" | "push" | "edge" | "relax" | "insert";

/** One row of the step trace and the counters at that moment. */
export interface DerivedStep {
  index: number;
  action: StepAction;
  /** array pair this step acted on */
  i?: number;
  j?: number;
  values?: [number, number];
  /** short locator for non-pair steps, e.g. "[3]", "A→C", "lo..hi" */
  detail?: string;
  /** what to print in the trace row instead of the note */
  summary?: string;
  note: string;
  line: number;
  pass: number;
  /** counters shown in the rail, keyed by StatDef.key */
  stats: Record<string, number>;
  // legacy array counters (kept for the sort tests)
  comparisons: number;
  swaps: number;
  sortedCount: number;
}

export interface StatDef {
  key: string;
  label: string;
  led: string;
}

export interface LegendItem {
  color: string;
  label: string;
}

// ---------------------------------------------------------------- frames

export interface ArrayView {
  kind: "array";
  dataNodes: number[];
  activeNodes: number[];
  sortedNodes: number[];
  explanation: string;
  line?: number;
  /**
   * Stable identity of each bar: ids[k] is the original input index of the
   * value now at position k. Swaps move ids with their values, so equal values
   * stay distinct bars (React keys + FLIP animation track the bar, not the value).
   */
  ids: number[];
  action: StepAction;
  /** single highlighted bar (probe / write) */
  focus?: number;
  range?: [number, number];
  found?: number;
  /** horizontal target line (searching) */
  target?: number;
  /** merge sort's side buffer, drawn as a strip on the glass */
  buffer?: number[];
}

export interface NetworkView {
  kind: "network";
  nodes: NetNode[];
  edges: NetEdge[];
  /** edges drawn with arrows from a → b (trees point down) */
  directed: boolean;
  nodeState: Record<string, NodeState>;
  edgeState: Record<string, EdgeState>;
  /** small readout under a node (Dijkstra distance) */
  badges: Record<string, string>;
  /** a strip at the bottom of the glass: queue, stack, output… */
  strip?: { label: string; items: string[] };
  explanation: string;
  line?: number;
  action: StepAction;
}

export type StageView = ArrayView | NetworkView;

// ---------------------------------------------------------------- algorithms

export type AlgoKind = "sort" | "search" | "graph" | "tree";

/** Everything an algorithm needs to build its frames. */
export interface AlgoInput {
  /** array values (sorts, searches) or keys to insert (trees) */
  values: number[];
  /** search target */
  target: number;
  /** graph: node count + layout/weights seed */
  nodes: number;
  seed: number;
}

export interface Built {
  views: StageView[];
  derived: DerivedStep[];
}

export interface AlgorithmBase {
  slug: string;
  name: string;
  category: string;
  summary: string;
  kind: AlgoKind;
  complexity: { time: string; space: string };
  pseudocode: string[];
  stats: StatDef[];
  legend: LegendItem[];
  build: (input: AlgoInput) => Built;
}

export interface ArrayAlgorithm extends AlgorithmBase {
  kind: "sort" | "search";
  /** Produce the full trace for a given input. */
  trace: (input: number[], target?: number) => SortStep[];
  /** Replay steps[0..index] into a drawable frame. */
  frameAt: (input: number[], steps: SortStep[], index: number) => SortFrame;
  /** Searches that need sorted input (binary search) normalize it here. */
  prepare?: (values: number[]) => number[];
}

export interface NetworkAlgorithm extends AlgorithmBase {
  kind: "graph" | "tree";
}

export type Algorithm = ArrayAlgorithm | NetworkAlgorithm;
