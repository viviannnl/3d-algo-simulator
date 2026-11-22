import type { SortStep } from "@/lib/types";
import { defineArray } from "./common";

function trace(input: number[]): SortStep[] {
  const steps: SortStep[] = [];
  const a = [...input];
  const n = a.length;

  for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
    let first = true;
    for (let i = gap; i < n; i++) {
      for (let j = i; j >= gap; j -= gap) {
        const note = `${first ? `Next pass: gap = ${gap}. ` : ""}Compare a[${j - gap}]=${a[j - gap]} and a[${j}]=${a[j]}`;
        steps.push({ type: "compare", i: j - gap, j, line: 2, note });
        first = false;
        if (a[j - gap] <= a[j]) break;
        [a[j - gap], a[j]] = [a[j], a[j - gap]];
        steps.push({ type: "swap", i: j - gap, j, line: 3, note: `Swap across the gap of ${gap}` });
      }
    }
  }
  for (let k = 0; k < n; k++) {
    steps.push({ type: "markSorted", index: k, line: 0, note: k === n - 1 ? "Gap 1 pass done — array sorted" : `a[${k}] in final position` });
  }
  return steps;
}

export const shellSort = defineArray({
  slug: "shell-sort",
  name: "Shell Sort",
  category: "Sorting",
  kind: "sort",
  summary: "Insertion sort over shrinking gaps: far-apart values move early, so the final gap-1 pass has little to do.",
  complexity: { time: "O(n^1.5)", space: "O(1)" },
  pseudocode: [
    "for gap in n/2, n/4 … 1:",
    "  for i in gap … n-1:",
    "    while j ≥ gap and a[j-gap] > a[j]:",
    "      swap(a[j-gap], a[j]); j = j-gap",
  ],
  trace,
});
