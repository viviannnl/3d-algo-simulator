import type { SortStep } from "@/lib/types";
import { defineArray } from "./common";

function trace(input: number[]): SortStep[] {
  const steps: SortStep[] = [];
  const a = [...input];
  const n = a.length;

  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      steps.push({ type: "compare", i: j, j: j + 1, line: 2, note: `Compare a[${j}]=${a[j]} and a[${j + 1}]=${a[j + 1]}` });
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swapped = true;
        steps.push({ type: "swap", i: j, j: j + 1, line: 3, note: `Swap — a[${j}] > a[${j + 1}], move it right` });
      }
    }
    steps.push({ type: "markSorted", index: n - i - 1, line: 4, note: `a[${n - i - 1}] is now in its final position` });
    if (!swapped) {
      for (let k = n - i - 2; k >= 0; k--) steps.push({ type: "markSorted", index: k, line: 4, note: "Already in order" });
      break;
    }
  }
  if (n > 0) steps.push({ type: "markSorted", index: 0, line: 4, note: "a[0] is in place — array sorted" });
  return steps;
}

export const bubbleSort = defineArray({
  slug: "bubble-sort",
  name: "Bubble Sort",
  category: "Sorting",
  kind: "sort",
  summary: "Repeatedly steps through the list, compares adjacent pairs, and swaps any out of order. After each pass the largest remaining value bubbles to its final place.",
  complexity: { time: "O(n²)", space: "O(1)" },
  pseudocode: [
    "for i in 0 … n-1:",
    "  for j in 0 … n-i-2:",
    "    if a[j] > a[j+1]:",
    "      swap(a[j], a[j+1])",
    "  lock a[n-i-1] as sorted",
  ],
  trace,
});
