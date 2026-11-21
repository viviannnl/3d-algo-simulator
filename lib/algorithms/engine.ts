import type { SortStep, SortFrame } from "@/lib/types";

/**
 * Shared frame reconstruction for all swap-based sorts. Replays steps[0..index]
 * onto a copy of the input, so every algorithm only has to supply its `trace`.
 */
export function frameAt(input: number[], steps: SortStep[], index: number): SortFrame {
  const array = [...input];
  const sorted = new Set<number>();
  let comparing: [number, number] | null = null;
  let swapping: [number, number] | null = null;
  let caption = "Initial unsorted array.";

  for (let k = 0; k <= index && k < steps.length; k++) {
    const step = steps[k];
    const isCurrent = k === index;
    if (step.type === "compare") {
      if (isCurrent) {
        comparing = [step.i, step.j];
        caption = step.note ?? "Compare";
      }
    } else if (step.type === "swap") {
      const tmp = array[step.i];
      array[step.i] = array[step.j];
      array[step.j] = tmp;
      if (isCurrent) {
        swapping = [step.i, step.j];
        caption = step.note ?? "Swap";
      }
    } else {
      sorted.add(step.index);
      if (isCurrent) caption = step.note ?? "Locked in";
    }
  }
  return { array, comparing, swapping, sorted, caption };
}
