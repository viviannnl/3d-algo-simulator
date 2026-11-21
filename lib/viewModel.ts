import type { Algorithm } from "./types";

/**
 * A materialized frame the renderer draws — derived from the programmatic trace.
 * Our `Algorithm.trace()` stays the source of truth ("instrument, don't animate");
 * this adapter flattens each step into a drawable view. Regenerating from a new
 * input is what makes shuffle / custom input work.
 */
export interface StepView {
  dataNodes: number[];
  activeNodes: number[];
  sortedNodes: number[];
  explanation: string;
  /** pseudocode line this step maps to (undefined on the initial frame) */
  line?: number;
  /**
   * Stable identity of each bar: ids[k] is the original input index of the
   * value now at position k. Swaps move ids with their values, so equal values
   * stay distinct bars (React keys + FLIP animation track the bar, not the value).
   */
  ids: number[];
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
  // secondary, not muted: this badge sits on the highlighted (cyan-tinted) row at step 0
  // printed on the cream rail, so these are the darker "ink" variants (all ≥ 4.5:1)
  init: { label: "INIT", color: "var(--ink-2)", glyph: "•" },
  compare: { label: "CMP", color: "var(--compare-ink)", glyph: "◇" },
  swap: { label: "SWAP", color: "var(--swap-ink)", glyph: "⇄" },
  mark: { label: "LOCK", color: "var(--sorted-ink)", glyph: "▪" },
  done: { label: "DONE", color: "var(--signal-ink)", glyph: "✓" },
};

/** Run the algorithm's trace and flatten each step (plus an initial frame) into views. */
export function buildSteps(algo: Algorithm, input: number[]): StepView[] {
  const steps = algo.trace(input);
  const views: StepView[] = [];

  const ids = input.map((_, i) => i);

  const first = algo.frameAt(input, steps, -1);
  views.push({ dataNodes: first.array, activeNodes: [], sortedNodes: [...first.sorted], explanation: "Initial unsorted array.", line: 0, ids: [...ids] });

  for (let k = 0; k < steps.length; k++) {
    const step = steps[k];
    if (step.type === "swap") [ids[step.i], ids[step.j]] = [ids[step.j], ids[step.i]];
    const f = algo.frameAt(input, steps, k);
    const active = f.swapping ?? f.comparing ?? [];
    views.push({
      dataNodes: f.array,
      activeNodes: active ? [...active] : [],
      sortedNodes: [...f.sorted],
      explanation: f.caption,
      line: step.line,
      ids: [...ids],
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

    if (k === 0) {
      action = "init";
    } else if (k === views.length - 1 && s.activeNodes.length === 0) {
      action = "done";
    } else if (changed && pair) {
      action = "swap";
      swaps++;
      [i, j] = pair;
      values = [s.dataNodes[i], s.dataNodes[j]];
    } else if (pair) {
      action = "compare";
      comparisons++;
      [i, j] = pair;
      values = [s.dataNodes[i], s.dataNodes[j]];
    } else if (newlySorted.length) {
      action = "mark";
    }

    // Prefer the explicit pseudocode line the algorithm tagged; fall back by action.
    const fallback = action === "compare" ? 2 : action === "swap" ? 3 : action === "mark" ? 4 : action === "done" ? -1 : 0;
    const line = s.line !== undefined ? s.line : fallback;

    out.push({ index: k, action, i, j, values, note: s.explanation, line, comparisons, swaps, pass, sortedCount: s.sortedNodes.length });
  }
  return out;
}
