import type { SortStep } from "@/lib/types";
import { defineArray } from "./common";

function trace(input: number[]): SortStep[] {
  const steps: SortStep[] = [];
  const a = [...input];
  const n = a.length;

  for (let i = 0; i < n; i++) {
    let min = i;
    for (let j = i + 1; j < n; j++) {
      steps.push({ type: "compare", i: min, j, line: 3, note: `Compare a[${j}]=${a[j]} against current min a[${min}]=${a[min]}` });
      if (a[j] < a[min]) min = j;
    }
    if (min !== i) {
      [a[i], a[min]] = [a[min], a[i]];
      steps.push({ type: "swap", i, j: min, line: 4, note: `Swap new minimum into position ${i}` });
    }
    steps.push({ type: "markSorted", index: i, line: 4, note: `a[${i}] is now in its final position` });
  }
  return steps;
}

export const selectionSort = defineArray({
  slug: "selection-sort",
  name: "Selection Sort",
  category: "Sorting",
  kind: "sort",
  summary: "Scans the unsorted region for the smallest value each pass and swaps it into the next sorted slot.",
  complexity: { time: "O(n²)", space: "O(1)" },
  pseudocode: [
    "for i in 0 … n-1:",
    "  min = i",
    "  for j in i+1 … n-1:",
    "    if a[j] < a[min]: min = j",
    "  swap(a[i], a[min]); lock a[i]",
  ],
  trace,
});
