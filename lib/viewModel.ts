import type { Algorithm } from "./types";

/**
 * A materialized frame the renderer draws — derived from the programmatic trace.
 * This is the bridge: our `Algorithm.trace()` stays the source of truth (the
 * "instrument, don't animate" plan), and this adapter flattens each step into a
 * drawable view. Regenerating from a new input is what makes shuffle/custom work.
 */
export interface StepView {
  dataNodes: number[];
  activeNodes: number[];
  sortedNodes: number[];
  explanation: string;
}

export type StepAction = "init" | "compare" | "swap" | "mark" | "done";

export interface DerivedStep {
  index: number;
  action: StepAction;
  i?: number;
  j?: number;
  values?: [number, number];
  note: string;
  line: number;
  comparisons: number;
  swaps: number;
  pass: number;
  sortedCount: number;
}

export const ACTION_META: Record<StepAction, { label: string; color: string; glyph: string }> = {
  init: { label: "INIT", color: "var(--text-muted)", glyph: "•" },
  compare: { label: "CMP", color: "var(--compare)", glyph: "◇" },
  swap: { label: "SWAP", color: "var(--swap)", glyph: "⇄" },
  mark: { label: "LOCK", color: "var(--sorted)", glyph: "▪" },
  done: { label: "DONE", color: "var(--primary)", glyph: "✓" },
};

/** Run the algorithm's trace and flatten each step (plus an initial frame) into views. */
export function buildSteps(algo: Algorithm, input: number[]): StepView[] {
  const steps = algo.trace(input);
  const views: StepView[] = [];

  // initial frame (before any step)
  const first = algo.frameAt(input, steps, -1);
  views.push({
    dataNodes: first.array,
    activeNodes: [],
    sortedNodes: [...first.sorted],
    explanation: "Initial unsorted array.",
  });

  for (let k = 0; k < steps.length; k++) {
    const f = algo.frameAt(input, steps, k);
    const active = f.swapping ?? f.comparing ?? [];
    views.push({
      dataNodes: f.array,
      activeNodes: active ? [...active] : [],
      sortedNodes: [...f.sorted],
      explanation: f.caption,
    });
  }
  return views;
}

const sameArray = (a: number[], b: number[]) => a.length === b.length && a.every((v, k) => v === b[k]);

/** Instrument the flattened views into a rich, countable trace for the telemetry rail. */
export function deriveTrace(views: StepView[]): DerivedStep[] {
  let comparisons = 0;
  let swaps = 0;
  let pass = 1;
  const out: DerivedStep[] = [];

  for (let k = 0; k < views.length; k++) {
    const s = views[k];
    const prev = k > 0 ? views[k - 1] : undefined;
    const pair =
      s.activeNodes.length === 2
        ? ([Math.min(...s.activeNodes), Math.max(...s.activeNodes)] as [number, number])
        : undefined;
    const changed = prev ? !sameArray(prev.dataNodes, s.dataNodes) : false;
    const prevSorted = prev?.sortedNodes ?? [];
    const newlySorted = s.sortedNodes.filter((n) => !prevSorted.includes(n));

    if (/next pass|new pass/i.test(s.explanation)) pass++;

    let action: StepAction = "init";
    let i: number | undefined;
    let j: number | undefined;
    let values: [number, number] | undefined;
    let line = 0;

    if (k === 0) {
      action = "init";
      line = 0;
    } else if (k === views.length - 1 && s.activeNodes.length === 0) {
      action = "done";
      line = -1;
    } else if (changed && pair) {
      action = "swap";
      swaps++;
      [i, j] = pair;
      values = [s.dataNodes[i], s.dataNodes[j]];
      line = 3;
    } else if (pair) {
      action = "compare";
      comparisons++;
      [i, j] = pair;
      values = [s.dataNodes[i], s.dataNodes[j]];
      line = 2;
    } else if (newlySorted.length) {
      action = "mark";
      line = 4;
    }

    out.push({
      index: k,
      action,
      i,
      j,
      values,
      note: s.explanation,
      line,
      comparisons,
      swaps,
      pass,
      sortedCount: s.sortedNodes.length,
    });
  }
  return out;
}
