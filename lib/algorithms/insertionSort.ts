import type { Algorithm, SortStep } from "@/lib/types";
import { frameAt } from "./engine";

function trace(input: number[]): SortStep[] {
  const steps: SortStep[] = [];
  const a = [...input];
  const n = a.length;

  for (let i = 1; i < n; i++) {
    let j = i;
    while (j > 0) {
      steps.push({ type: "compare", i: j - 1, j, line: 2, note: `Compare a[${j - 1}]=${a[j - 1]} and a[${j}]=${a[j]}` });
      if (a[j - 1] > a[j]) {
        [a[j - 1], a[j]] = [a[j], a[j - 1]];
        steps.push({ type: "swap", i: j - 1, j, line: 3, note: `Shift a[${j}] left into place` });
        j--;
      } else {
        break;
      }
    }
  }
  for (let k = 0; k < n; k++) {
    steps.push({ type: "markSorted", index: k, line: -1, note: k === n - 1 ? "Array fully sorted" : `a[${k}] in final position` });
  }
  return steps;
}

export const insertionSort: Algorithm = {
  slug: "insertion-sort",
  name: "Insertion Sort",
  category: "Sorting",
  summary: "Builds the sorted portion one element at a time, shifting each new value left until it sits in the right spot.",
  complexity: { time: "O(n²)", space: "O(1)" },
  pseudocode: [
    "for i in 1 … n-1:",
    "  j = i",
    "  while j > 0 and a[j-1] > a[j]:",
    "    swap(a[j-1], a[j]); j = j-1",
  ],
  trace,
  frameAt,
};
