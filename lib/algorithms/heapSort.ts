import type { SortStep } from "@/lib/types";
import { defineArray } from "./common";

function trace(input: number[]): SortStep[] {
  const steps: SortStep[] = [];
  const a = [...input];
  const n = a.length;

  // push a[i] down until both children are smaller (heap occupies a[0..size-1])
  function siftDown(i: number, size: number) {
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let big = i;
      if (l < size) {
        steps.push({ type: "compare", i: big, j: l, line: 3, note: `Compare a[${big}]=${a[big]} with left child a[${l}]=${a[l]}` });
        if (a[l] > a[big]) big = l;
      }
      if (r < size) {
        steps.push({ type: "compare", i: big, j: r, line: 3, note: `Compare a[${big}]=${a[big]} with right child a[${r}]=${a[r]}` });
        if (a[r] > a[big]) big = r;
      }
      if (big === i) return;
      [a[i], a[big]] = [a[big], a[i]];
      steps.push({ type: "swap", i, j: big, line: 4, note: `Sift ${a[big]} down below ${a[i]}` });
      i = big;
    }
  }

  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) siftDown(i, n);
  for (let end = n - 1; end > 0; end--) {
    [a[0], a[end]] = [a[end], a[0]];
    steps.push({ type: "swap", i: 0, j: end, line: 1, note: `Move the max ${a[end]} to the end — next pass` });
    steps.push({ type: "markSorted", index: end, line: 1, note: `a[${end}] is now in its final position` });
    siftDown(0, end);
  }
  if (n > 0) steps.push({ type: "markSorted", index: 0, line: 1, note: "a[0] is in place — array sorted" });
  return steps;
}

export const heapSort = defineArray({
  slug: "heap-sort",
  name: "Heap Sort",
  category: "Sorting",
  kind: "sort",
  summary: "Arrange the array as a max-heap, then repeatedly move the largest value to the end and repair the heap.",
  complexity: { time: "O(n log n)", space: "O(1)" },
  pseudocode: [
    "build a max-heap from a",
    "for end in n-1 … 1: swap(a[0], a[end]); lock a[end]",
    "  sift_down(0, end):",
    "    big = larger of a[i] and its children",
    "    if big ≠ i: swap(a[i], a[big]); i = big",
  ],
  trace,
});
