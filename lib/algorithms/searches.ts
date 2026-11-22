import type { LegendItem, SortStep, StatDef } from "@/lib/types";
import { defineArray } from "./common";

const SEARCH_STATS: StatDef[] = [
  { key: "probes", label: "Probes", led: "var(--compare-ink)" },
  { key: "window", label: "Window", led: "var(--signal)" },
];
const SEARCH_LEGEND: LegendItem[] = [
  { color: "var(--compare-ink)", label: "probe" },
  { color: "var(--sorted-ink)", label: "found" },
  { color: "var(--swap-ink)", label: "miss" },
];

function linear(input: number[], target = 0): SortStep[] {
  const steps: SortStep[] = [];
  for (let i = 0; i < input.length; i++) {
    const hit = input[i] === target;
    steps.push({ type: "probe", i, line: 1, note: `a[${i}]=${input[i]} ${hit ? "=" : "≠"} ${target}` });
    if (hit) {
      steps.push({ type: "found", i, line: 2, note: `Found ${target} at index ${i} after ${i + 1} probe${i ? "s" : ""}` });
      return steps;
    }
  }
  steps.push({ type: "miss", line: 3, note: `${target} is not in the array — checked all ${input.length}` });
  return steps;
}

function binary(input: number[], target = 0): SortStep[] {
  const steps: SortStep[] = [];
  let lo = 0;
  let hi = input.length - 1;
  steps.push({ type: "range", lo, hi, line: 0, note: `Search the whole sorted array a[${lo}..${hi}]` });
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    steps.push({ type: "probe", i: mid, line: 2, note: `Middle of [${lo}..${hi}] is a[${mid}]=${input[mid]}` });
    if (input[mid] === target) {
      steps.push({ type: "found", i: mid, line: 3, note: `a[${mid}] = ${target} — found` });
      return steps;
    }
    if (input[mid] < target) {
      lo = mid + 1;
      if (lo <= hi) steps.push({ type: "range", lo, hi, line: 4, note: `${input[mid]} < ${target}: drop the left half, keep a[${lo}..${hi}]` });
    } else {
      hi = mid - 1;
      if (lo <= hi) steps.push({ type: "range", lo, hi, line: 5, note: `${input[mid]} > ${target}: drop the right half, keep a[${lo}..${hi}]` });
    }
  }
  steps.push({ type: "miss", line: 6, note: `The range is empty — ${target} is not in the array` });
  return steps;
}

export const linearSearch = defineArray({
  slug: "linear-search",
  name: "Linear Search",
  category: "Searching",
  kind: "search",
  summary: "Check every element in turn until the target turns up — works on any array, sorted or not.",
  complexity: { time: "O(n)", space: "O(1)" },
  pseudocode: [
    "for i in 0 … n-1:",
    "  if a[i] == target:",
    "    return i",
    "return not found",
  ],
  stats: SEARCH_STATS,
  legend: SEARCH_LEGEND,
  trace: linear,
});

export const binarySearch = defineArray({
  slug: "binary-search",
  name: "Binary Search",
  category: "Searching",
  kind: "search",
  summary: "On a sorted array, look at the middle and throw away the half that cannot hold the target.",
  complexity: { time: "O(log n)", space: "O(1)" },
  pseudocode: [
    "lo, hi = 0, n-1",
    "while lo ≤ hi:",
    "  mid = (lo + hi) / 2",
    "  if a[mid] == target: return mid",
    "  if a[mid] < target: lo = mid + 1",
    "  else: hi = mid - 1",
    "return not found",
  ],
  stats: SEARCH_STATS,
  legend: SEARCH_LEGEND,
  prepare: (values) => [...values].sort((x, y) => x - y),
  trace: binary,
});
