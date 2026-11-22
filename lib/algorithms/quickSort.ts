import type { SortStep } from "@/lib/types";
import { defineArray } from "./common";

function trace(input: number[]): SortStep[] {
  const steps: SortStep[] = [];
  const a = [...input];

  function quick(lo: number, hi: number) {
    if (lo > hi) return;
    if (lo === hi) {
      steps.push({ type: "markSorted", index: lo, line: -1, note: `a[${lo}] in final position` });
      return;
    }
    const pivot = a[hi];
    let i = lo;
    for (let j = lo; j < hi; j++) {
      steps.push({ type: "compare", i: j, j: hi, line: 3, note: `Compare a[${j}]=${a[j]} with pivot ${pivot}` });
      if (a[j] < pivot) {
        if (i !== j) {
          [a[i], a[j]] = [a[j], a[i]];
          steps.push({ type: "swap", i, j, line: 3, note: `Move ${a[i]} to the left of the pivot` });
        }
        i++;
      }
    }
    if (i !== hi) {
      [a[i], a[hi]] = [a[hi], a[i]];
      steps.push({ type: "swap", i, j: hi, line: 4, note: `Place pivot ${pivot} at index ${i}` });
    }
    steps.push({ type: "markSorted", index: i, line: 4, note: `Pivot ${pivot} locked at index ${i}` });
    quick(lo, i - 1);
    quick(i + 1, hi);
  }

  quick(0, a.length - 1);
  return steps;
}

export const quickSort = defineArray({
  slug: "quick-sort",
  name: "Quick Sort",
  category: "Sorting",
  kind: "sort",
  summary: "Picks a pivot, partitions values smaller than it to the left, then recursively sorts each partition.",
  complexity: { time: "O(n log n)", space: "O(log n)" },
  pseudocode: [
    "partition(lo, hi):",
    "  pivot = a[hi]; i = lo",
    "  for j in lo … hi-1:",
    "    if a[j] < pivot: swap(a[i++], a[j])",
    "  swap(a[i], a[hi])  ← place pivot",
  ],
  trace,
});
