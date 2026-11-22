import type { SortStep } from "@/lib/types";
import { defineArray } from "./common";

/**
 * Top-down merge sort with a left-half buffer. Only the left half is copied out,
 * so every unconsumed right-half value is still on its own bar while merging —
 * the buffer is shown on the glass, and each write lands a value into a[k].
 */
function trace(input: number[]): SortStep[] {
  const steps: SortStep[] = [];
  const a = [...input];

  function sort(lo: number, hi: number) {
    if (lo >= hi) return;
    const mid = Math.floor((lo + hi) / 2);
    steps.push({ type: "range", lo, hi, line: 0, note: `Split a[${lo}..${hi}] at ${mid}` });
    sort(lo, mid);
    sort(mid + 1, hi);
    merge(lo, mid, hi);
  }

  function merge(lo: number, mid: number, hi: number) {
    const buf = a.slice(lo, mid + 1);
    steps.push({ type: "range", lo, hi, buffer: [...buf], line: 2, note: `Merge a[${lo}..${mid}] with a[${mid + 1}..${hi}] — copy the left half to the buffer` });
    let b = 0;
    let j = mid + 1;
    let k = lo;
    while (b < buf.length && j <= hi) {
      steps.push({ type: "probe", i: j, line: 3, note: `Compare buffer head ${buf[b]} with a[${j}]=${a[j]}` });
      if (buf[b] <= a[j]) {
        a[k] = buf[b];
        steps.push({ type: "write", i: k, value: buf[b], from: "buffer", line: 4, note: `Take ${buf[b]} from the buffer into a[${k}]` });
        b++;
      } else {
        a[k] = a[j];
        steps.push({ type: "write", i: k, value: a[j], line: 5, note: `Take ${a[j]} from the right half into a[${k}]` });
        j++;
      }
      k++;
    }
    while (b < buf.length) {
      a[k] = buf[b];
      steps.push({ type: "write", i: k, value: buf[b], from: "buffer", line: 6, note: `Right half done — copy ${buf[b]} into a[${k}]` });
      b++;
      k++;
    }
  }

  sort(0, a.length - 1);
  for (let k = 0; k < a.length; k++) {
    steps.push({ type: "markSorted", index: k, line: 6, note: k === a.length - 1 ? "Every half merged — array sorted" : `a[${k}] in final position` });
  }
  return steps;
}

export const mergeSort = defineArray({
  slug: "merge-sort",
  name: "Merge Sort",
  category: "Sorting",
  kind: "sort",
  summary: "Divide and conquer: split the array in half, sort each half, then merge them back in order.",
  complexity: { time: "O(n log n)", space: "O(n)" },
  pseudocode: [
    "sort(lo, hi): split at mid",
    "  sort(lo, mid); sort(mid+1, hi)",
    "  buf = a[lo..mid]",
    "  while buf and right remain:",
    "    a[k++] = buf head  (if ≤)",
    "    a[k++] = a[j++]",
    "  copy what is left in buf",
  ],
  stats: [
    { key: "probes", label: "Cmp", led: "var(--compare-ink)" },
    { key: "write", label: "Write", led: "var(--swap-ink)" },
    { key: "sorted", label: "Sorted", led: "var(--sorted-ink)" },
  ],
  legend: [
    { color: "var(--compare-ink)", label: "cmp" },
    { color: "var(--swap-ink)", label: "write" },
    { color: "var(--sorted-ink)", label: "lock" },
  ],
  trace,
});
