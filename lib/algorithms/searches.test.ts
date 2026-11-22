import { describe, it, expect } from "vitest";
import { linearSearch, binarySearch } from "./searches";
import type { AlgoInput } from "@/lib/types";

const input = (values: number[], target: number): AlgoInput => ({ values, target, nodes: 0, seed: 0 });

describe.each([
  ["Linear Search", linearSearch],
  ["Binary Search", binarySearch],
] as const)("%s", (_name, algo) => {
  const arrays = [[5, 3, 8, 4, 2, 7, 1], [1, 2], [42], [10, -4, 0, 7, 2], Array.from({ length: 16 }, (_, k) => (k * 37) % 101)];

  it.each(arrays.map((a) => [JSON.stringify(a), a] as const))("finds every value present in %s", (_l, values) => {
    for (const target of values) {
      const { views, derived } = algo.build(input(values, target));
      const last = views.at(-1)!;
      expect(derived.at(-1)!.action).toBe("found");
      expect(last.kind === "array" && last.dataNodes[last.found!]).toBe(target);
    }
  });

  it.each(arrays.map((a) => [JSON.stringify(a), a] as const))("reports a miss for absent values in %s", (_l, values) => {
    for (const target of [Math.min(...values) - 1, Math.max(...values) + 1, 1000]) {
      const { derived } = algo.build(input(values, target));
      expect(derived.at(-1)!.action).toBe("miss");
    }
  });

  it("starts with an INIT row and counts probes monotonically", () => {
    const { derived } = algo.build(input([5, 3, 8, 4, 2, 7, 1], 4));
    expect(derived[0].action).toBe("init");
    for (let k = 1; k < derived.length; k++) expect(derived[k].stats.probes).toBeGreaterThanOrEqual(derived[k - 1].stats.probes);
    expect(derived.at(-1)!.stats.probes).toBe(derived.filter((d) => d.action === "probe").length);
  });
});

describe("Binary Search", () => {
  it("searches a sorted copy of the input", () => {
    const { views } = binarySearch.build(input([5, 3, 8, 4, 2, 7, 1], 7));
    const first = views[0];
    expect(first.kind === "array" && first.dataNodes).toEqual([1, 2, 3, 4, 5, 7, 8]);
  });

  it("probes at most ⌊log2 n⌋ + 1 times", () => {
    const values = Array.from({ length: 16 }, (_, k) => k * 3);
    for (const target of [...values, -1, 100]) {
      const { derived } = binarySearch.build(input(values, target));
      expect(derived.at(-1)!.stats.probes).toBeLessThanOrEqual(5);
    }
  });

  it("each narrowing halves the window and keeps the target inside it", () => {
    const values = Array.from({ length: 12 }, (_, k) => k * 2);
    const { derived, views } = binarySearch.build(input(values, 16));
    let prev = values.length;
    derived.forEach((d, k) => {
      if (d.action !== "range" || k === 1) return;
      const v = views[k];
      expect(d.stats.window).toBeLessThanOrEqual(Math.ceil(prev / 2));
      expect(v.kind === "array" && v.range && v.dataNodes[v.range[0]] <= 16 && 16 <= v.dataNodes[v.range[1]]).toBe(true);
      prev = d.stats.window;
    });
  });
});

describe("Linear Search", () => {
  it("probes left to right and stops at the first match", () => {
    const { derived } = linearSearch.build(input([4, 9, 4, 1], 4));
    expect(derived.filter((d) => d.action === "probe").map((d) => d.detail)).toEqual(["[0]"]);
  });
});
