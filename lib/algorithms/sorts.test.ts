import { describe, it, expect } from "vitest";
import { algorithms } from "@/lib/algorithms";
import type { Algorithm } from "@/lib/types";

const asc = (a: number[]) => [...a].sort((x, y) => x - y);
const isPermutation = (a: number[], b: number[]) => asc(a).join(",") === asc(b).join(",");

const cases: number[][] = [
  [5, 3, 8, 4, 2, 7, 1],
  [1],
  [2, 1],
  [1, 2, 3, 4, 5], // already sorted (exercises early-exit / no-swap paths)
  [5, 4, 3, 2, 1], // reverse (worst case)
  [3, 3, 3, 3], // all equal
  [10, -4, 0, 7, -4, 2], // negatives + duplicates
  [42, 17, 89, 34, 61, 9, 53, 28], // the default-ish set
];
// deterministic pseudo-random inputs (no Math.random — reproducible)
for (let s = 0; s < 24; s++) {
  const n = 2 + (s % 10);
  cases.push(Array.from({ length: n }, (_, k) => ((s * 31 + k * 17) % 60) - 20));
}

const labelled = cases.map((c) => [JSON.stringify(c), c] as const);

describe.each(algorithms.map((a) => [a.name, a] as const))("%s", (_name, algo: Algorithm) => {
  it.each(labelled)("sorts %s correctly", (_l, input) => {
    const steps = algo.trace(input);
    const final = algo.frameAt(input, steps, steps.length - 1);
    expect(final.array).toEqual(asc(input));
  });

  it.each(labelled)("locks every index by the end: %s", (_l, input) => {
    const steps = algo.trace(input);
    const final = algo.frameAt(input, steps, steps.length - 1);
    expect(final.sorted.size).toBe(input.length);
  });

  it.each(labelled)("every intermediate frame is a permutation of the input: %s", (_l, input) => {
    const steps = algo.trace(input);
    for (let k = -1; k < steps.length; k++) {
      expect(isPermutation(algo.frameAt(input, steps, k).array, input)).toBe(true);
    }
  });

  it.each(labelled)("emits only in-bounds, non-degenerate steps: %s", (_l, input) => {
    const steps = algo.trace(input);
    const n = input.length;
    for (const step of steps) {
      if (step.type === "markSorted") {
        expect(step.index).toBeGreaterThanOrEqual(0);
        expect(step.index).toBeLessThan(n);
      } else {
        expect(step.i).toBeGreaterThanOrEqual(0);
        expect(step.j).toBeLessThan(n);
        expect(step.i).not.toBe(step.j);
      }
    }
  });
});
