import { describe, it, expect } from "vitest";
import { algorithms } from "@/lib/algorithms";
import { buildSteps, deriveTrace } from "@/lib/viewModel";

const INPUT = [5, 3, 8, 4, 2, 7, 1];

describe.each(algorithms.map((a) => [a.name, a] as const))("viewModel · %s", (_name, algo) => {
  const views = buildSteps(algo, INPUT);
  const derived = deriveTrace(views);

  it("has one derived row per view, starting INIT and ending DONE", () => {
    expect(derived.length).toBe(views.length);
    expect(derived[0].action).toBe("init");
    expect(derived.at(-1)!.action).toBe("done");
  });

  it("initial frame is the raw input, final frame is fully locked", () => {
    expect(views[0].dataNodes).toEqual(INPUT);
    expect(derived.at(-1)!.sortedCount).toBe(INPUT.length);
  });

  it("counters are monotonic and match the classified step totals", () => {
    for (let k = 1; k < derived.length; k++) {
      expect(derived[k].comparisons).toBeGreaterThanOrEqual(derived[k - 1].comparisons);
      expect(derived[k].swaps).toBeGreaterThanOrEqual(derived[k - 1].swaps);
    }
    expect(derived.at(-1)!.comparisons).toBe(derived.filter((d) => d.action === "compare").length);
    expect(derived.at(-1)!.swaps).toBe(derived.filter((d) => d.action === "swap").length);
  });

  it("every compare/swap row carries the pair it acted on", () => {
    for (const d of derived) {
      if (d.action === "compare" || d.action === "swap") {
        expect(d.i).toBeDefined();
        expect(d.j).toBeDefined();
        expect(d.values).toHaveLength(2);
      }
    }
  });

  it("bar identities follow their values through every swap (duplicates stay distinct)", () => {
    for (const input of [INPUT, [3, 3, 1], [2, 2, 2, 1]]) {
      for (const v of buildSteps(algo, input)) {
        expect(new Set(v.ids).size).toBe(input.length);
        expect(v.ids.map((id) => input[id])).toEqual(v.dataNodes);
      }
    }
  });

  it("highlights a pseudocode line within range for active rows", () => {
    for (const d of derived) {
      if (d.action === "compare" || d.action === "swap") {
        expect(d.line).toBeGreaterThanOrEqual(0);
        expect(d.line).toBeLessThan(algo.pseudocode.length);
      }
    }
  });
});
