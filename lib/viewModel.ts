import type { ArrayAlgorithm, ArrayView, DerivedStep, StepAction, SortStep, Built, AlgoInput } from "./types";

export type { DerivedStep, StepAction } from "./types";
/** @deprecated name kept for array code — an ArrayView is one drawable bar frame */
export type StepView = ArrayView;

/**
 * Array algorithms: the programmatic trace stays the source of truth ("instrument,
 * don't animate"); this adapter flattens each step into a drawable view and then
 * into a countable telemetry row. Regenerating from a new input is what makes
 * shuffle / custom input work.
 */
export const ACTION_META: Record<StepAction, { label: string; color: string; glyph: string }> = {
  // printed on the cream rail, so these are the darker "ink" variants (all ≥ 4.5:1)
  init: { label: "INIT", color: "var(--ink-2)", glyph: "•" },
  compare: { label: "CMP", color: "var(--compare-ink)", glyph: "◇" },
  swap: { label: "SWAP", color: "var(--swap-ink)", glyph: "⇄" },
  write: { label: "WRITE", color: "var(--swap-ink)", glyph: "↓" },
  mark: { label: "LOCK", color: "var(--sorted-ink)", glyph: "▪" },
  probe: { label: "PROBE", color: "var(--compare-ink)", glyph: "?" },
  range: { label: "RANGE", color: "var(--ink-2)", glyph: "⟷" },
  found: { label: "FOUND", color: "var(--sorted-ink)", glyph: "✓" },
  miss: { label: "MISS", color: "var(--swap-ink)", glyph: "∅" },
  visit: { label: "VISIT", color: "var(--sorted-ink)", glyph: "●" },
  push: { label: "PUSH", color: "var(--compare-ink)", glyph: "+" },
  edge: { label: "EDGE", color: "var(--compare-ink)", glyph: "—" },
  relax: { label: "RELAX", color: "var(--swap-ink)", glyph: "↘" },
  insert: { label: "INSERT", color: "var(--sorted-ink)", glyph: "+" },
  done: { label: "DONE", color: "var(--signal-ink)", glyph: "✓" },
};

const STEP_ACTION: Record<SortStep["type"], StepAction> = {
  compare: "compare", swap: "swap", markSorted: "mark", write: "write",
  probe: "probe", range: "range", found: "found", miss: "miss",
};

/** Run the algorithm's trace and flatten each step (plus an initial frame) into views. */
export function buildSteps(algo: ArrayAlgorithm, input: number[], target?: number): ArrayView[] {
  const steps = algo.trace(input, target);
  const views: ArrayView[] = [];
  const ids = input.map((_, i) => i);

  const first = algo.frameAt(input, steps, -1);
  views.push({
    kind: "array", dataNodes: first.array, activeNodes: [], sortedNodes: [...first.sorted],
    explanation: algo.kind === "search" ? `Looking for ${target}.` : "Initial unsorted array.",
    line: 0, ids: [...ids], action: "init", target,
  });

  for (let k = 0; k < steps.length; k++) {
    const step = steps[k];
    if (step.type === "swap") [ids[step.i], ids[step.j]] = [ids[step.j], ids[step.i]];
    const f = algo.frameAt(input, steps, k);
    const pair = f.swapping ?? f.comparing;
    views.push({
      kind: "array",
      dataNodes: f.array,
      activeNodes: pair ? [...pair] : [],
      sortedNodes: [...f.sorted],
      explanation: f.caption,
      line: step.line,
      ids: [...ids],
      action: STEP_ACTION[step.type],
      focus: f.focus ?? undefined,
      range: f.range ?? undefined,
      found: f.found ?? undefined,
      buffer: f.buffer ?? undefined,
      target,
    });
  }
  return views;
}

/** Instrument the flattened views into a rich, countable trace for the telemetry rail. */
export function deriveTrace(views: ArrayView[]): DerivedStep[] {
  let comparisons = 0, swaps = 0, writes = 0, probes = 0;
  let pass = 1;
  const out: DerivedStep[] = [];
  const last = views.length - 1;

  for (let k = 0; k < views.length; k++) {
    const s = views[k];
    let action: StepAction = s.action;
    if (k === last && action === "mark") action = "done";
    if (/next pass|new pass/i.test(s.explanation)) pass++;

    let i: number | undefined;
    let j: number | undefined;
    let values: [number, number] | undefined;
    let detail: string | undefined;
    let summary: string | undefined;

    if (action === "compare" || action === "swap") {
      [i, j] = [Math.min(...s.activeNodes), Math.max(...s.activeNodes)];
      values = [s.dataNodes[i], s.dataNodes[j]];
      if (action === "compare") comparisons++; else swaps++;
    } else if (action === "write" && s.focus !== undefined) {
      writes++;
      detail = `[${s.focus}]`;
      summary = `a[${s.focus}] ← ${s.dataNodes[s.focus]}`;
    } else if (action === "probe" && s.focus !== undefined) {
      probes++;
      detail = `[${s.focus}]`;
      summary = `${s.dataNodes[s.focus]} vs ${s.target}`;
    } else if (action === "range" && s.range) {
      detail = `[${s.range[0]}..${s.range[1]}]`;
    } else if (action === "found" && s.found !== undefined) {
      detail = `[${s.found}]`;
    }

    // Prefer the explicit pseudocode line the algorithm tagged; fall back by action.
    const fallback = action === "compare" ? 2 : action === "swap" ? 3 : action === "mark" ? 4 : action === "done" ? -1 : 0;
    const line = s.line !== undefined ? s.line : fallback;
    const windowSize = s.found !== undefined ? 1 : action === "miss" ? 0 : s.range ? s.range[1] - s.range[0] + 1 : s.dataNodes.length;

    out.push({
      index: k, action, i, j, values, detail, summary, note: s.explanation, line, pass,
      comparisons, swaps, sortedCount: s.sortedNodes.length,
      stats: { cmp: comparisons, swap: swaps, write: writes, sorted: s.sortedNodes.length, probes, window: windowSize },
    });
  }
  return out;
}

/** The standard `build` for every array algorithm. */
export function buildArray(algo: ArrayAlgorithm, input: AlgoInput): Built {
  const values = algo.prepare ? algo.prepare(input.values) : input.values;
  const views = buildSteps(algo, values, algo.kind === "search" ? input.target : undefined);
  return { views, derived: deriveTrace(views) };
}
