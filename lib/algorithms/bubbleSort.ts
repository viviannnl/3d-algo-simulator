import type { Algorithm, SortFrame, SortStep } from "@/lib/types";

/** Record every compare / swap / lock-in as the algorithm runs. */
function trace(input: number[]): SortStep[] {
  const steps: SortStep[] = [];
  const a = [...input];
  const n = a.length;

  for (let i = 0; i < n - 1; i++) {
    let swappedThisPass = false;
    for (let j = 0; j < n - i - 1; j++) {
      steps.push({
        type: "compare",
        i: j,
        j: j + 1,
        note: `Compare a[${j}]=${a[j]} and a[${j + 1}]=${a[j + 1]}`,
      });
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swappedThisPass = true;
        steps.push({
          type: "swap",
          i: j,
          j: j + 1,
          note: `Swap — ${a[j + 1]} > ${a[j]}, move it right`,
        });
      }
    }
    steps.push({
      type: "markSorted",
      index: n - i - 1,
      note: `a[${n - i - 1}] is now in its final position`,
    });
    // Early exit: a clean pass means the array is already sorted.
    if (!swappedThisPass) {
      for (let k = 0; k < n - i - 1; k++) {
        steps.push({ type: "markSorted", index: k, note: "Already in order" });
      }
      break;
    }
  }
  if (n > 0) steps.push({ type: "markSorted", index: 0, note: "a[0] is in place — done" });
  return steps;
}

/** Replay steps[0..index] into a snapshot the canvas can draw directly. */
function frameAt(input: number[], steps: SortStep[], index: number): SortFrame {
  const array = [...input];
  const sorted = new Set<number>();
  let comparing: [number, number] | null = null;
  let swapping: [number, number] | null = null;
  let caption = "Ready — press play or step forward to begin.";

  for (let k = 0; k <= index && k < steps.length; k++) {
    const step = steps[k];
    const isCurrent = k === index;
    if (step.type === "compare") {
      if (isCurrent) {
        comparing = [step.i, step.j];
        caption = step.note ?? "Compare";
      }
    } else if (step.type === "swap") {
      [array[step.i], array[step.j]] = [array[step.j], array[step.i]];
      if (isCurrent) {
        swapping = [step.i, step.j];
        caption = step.note ?? "Swap";
      }
    } else if (step.type === "markSorted") {
      sorted.add(step.index);
      if (isCurrent) caption = step.note ?? "Locked in";
    }
  }

  if (index >= steps.length - 1 && steps.length > 0) {
    caption = "Sorted. Every element is in its final position.";
  }
  return { array, comparing, swapping, sorted, caption };
}

export const bubbleSort: Algorithm = {
  slug: "bubble-sort",
  name: "Bubble Sort",
  category: "Sorting",
  summary:
    "Repeatedly step through the list, compare adjacent pairs, and swap any that are out of order. After each pass the largest remaining value has bubbled to its final place.",
  complexity: { time: "O(n²)", space: "O(1)" },
  pseudocode: [
    "for i in 0 … n-1:",
    "  for j in 0 … n-i-2:",
    "    if a[j] > a[j+1]:",
    "      swap(a[j], a[j+1])",
    "  mark a[n-i-1] sorted",
  ],
  trace,
  frameAt,
};
