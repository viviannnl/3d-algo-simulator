import type { ArrayAlgorithm, LegendItem, SortStep, StatDef } from "@/lib/types";
import { frameAt } from "./engine";
import { buildArray } from "@/lib/viewModel";

/** Rail counters + legend shared by the swap-based sorts. */
export const SWAP_SORT_STATS: StatDef[] = [
  { key: "cmp", label: "Cmp", led: "var(--compare-ink)" },
  { key: "swap", label: "Swap", led: "var(--swap-ink)" },
  { key: "sorted", label: "Sorted", led: "var(--sorted-ink)" },
];
export const SWAP_SORT_LEGEND: LegendItem[] = [
  { color: "var(--compare-ink)", label: "cmp" },
  { color: "var(--swap-ink)", label: "swap" },
  { color: "var(--sorted-ink)", label: "lock" },
];

type ArraySpec = Omit<ArrayAlgorithm, "frameAt" | "build" | "stats" | "legend"> &
  Partial<Pick<ArrayAlgorithm, "stats" | "legend">> & { trace: (input: number[], target?: number) => SortStep[] };

/** Fill in the shared engine (frameAt + build) and the default sort rail for an array algorithm. */
export function defineArray(spec: ArraySpec): ArrayAlgorithm {
  const algo: ArrayAlgorithm = {
    stats: SWAP_SORT_STATS,
    legend: SWAP_SORT_LEGEND,
    ...spec,
    frameAt,
    build: (input) => buildArray(algo, input),
  };
  return algo;
}
