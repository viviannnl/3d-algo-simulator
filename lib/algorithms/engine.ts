import type { SortStep, SortFrame } from "@/lib/types";

/**
 * Shared frame reconstruction for every array algorithm. Replays steps[0..index]
 * onto a copy of the input, so each algorithm only has to supply its `trace`.
 * Highlights (compare / swap / focus) belong to the current step only; the live
 * range, found index and sorted set persist until something replaces them.
 */
export function frameAt(input: number[], steps: SortStep[], index: number): SortFrame {
  const array = [...input];
  const sorted = new Set<number>();
  let comparing: [number, number] | null = null;
  let swapping: [number, number] | null = null;
  let focus: number | null = null;
  let range: [number, number] | null = null;
  let found: number | null = null;
  let buffer: number[] | null = null;
  let caption = "Initial unsorted array.";

  for (let k = 0; k <= index && k < steps.length; k++) {
    const step = steps[k];
    const isCurrent = k === index;
    switch (step.type) {
      case "compare":
        if (isCurrent) { comparing = [step.i, step.j]; caption = step.note ?? "Compare"; }
        break;
      case "swap": {
        const tmp = array[step.i];
        array[step.i] = array[step.j];
        array[step.j] = tmp;
        if (isCurrent) { swapping = [step.i, step.j]; caption = step.note ?? "Swap"; }
        break;
      }
      case "write":
        array[step.i] = step.value;
        if (step.from === "buffer" && buffer) buffer = buffer.slice(1);
        if (isCurrent) { focus = step.i; caption = step.note ?? "Write"; }
        break;
      case "probe":
        if (isCurrent) { focus = step.i; caption = step.note ?? "Probe"; }
        break;
      case "range":
        range = [step.lo, step.hi];
        buffer = step.buffer ? [...step.buffer] : null;
        if (isCurrent) caption = step.note ?? "Narrow the range";
        break;
      case "found":
        found = step.i;
        range = null;
        if (isCurrent) { focus = step.i; caption = step.note ?? "Found"; }
        break;
      case "miss":
        range = null;
        if (isCurrent) caption = step.note ?? "Not found";
        break;
      case "markSorted":
        sorted.add(step.index);
        range = null;
        buffer = null;
        if (isCurrent) caption = step.note ?? "Locked in";
        break;
    }
  }
  return { array, comparing, swapping, sorted, caption, focus, range, found, buffer };
}
