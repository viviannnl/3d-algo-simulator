import { describe, it, expect } from "vitest";
import { generateGraph, neighbours, mulberry32 } from "@/lib/network";
import { breadthFirstSearch, depthFirstSearch, dijkstraShortestPath } from "./graphs";
import { bstInsertAlgo, treeTraversal, buildBst } from "./trees";
import { edgeKey, type AlgoInput, type NetworkView } from "@/lib/types";

const g = (nodes: number, seed: number): AlgoInput => ({ values: [], target: 0, nodes, seed });
const t = (values: number[]): AlgoInput => ({ values, target: 0, nodes: 0, seed: 0 });
const net = (v: unknown) => v as NetworkView;
const SEEDS = Array.from({ length: 30 }, (_, k) => k * 7919 + 1);
const SIZES = [2, 3, 6, 8, 10];

describe("graph generator", () => {
  it("is deterministic for a seed", () => {
    expect(generateGraph(8, 42)).toEqual(generateGraph(8, 42));
    expect(mulberry32(1)()).toBe(mulberry32(1)());
  });

  it.each(SIZES)("always yields a connected, simple graph on the glass (n=%i)", (n) => {
    for (const seed of SEEDS) {
      const { nodes, edges } = generateGraph(n, seed);
      expect(nodes).toHaveLength(n);
      for (const p of nodes) { expect(p.x).toBeGreaterThan(0); expect(p.x).toBeLessThan(1); expect(p.y).toBeGreaterThan(0); expect(p.y).toBeLessThan(1); }
      expect(new Set(edges.map((e) => edgeKey(e.a, e.b))).size).toBe(edges.length);
      expect(edges.every((e) => e.a !== e.b && e.w! >= 1 && e.w! <= 9)).toBe(true);
      // connected: a flood fill from A reaches everything
      const seen = new Set(["A"]);
      const todo = ["A"];
      while (todo.length) for (const { id } of neighbours(edges, todo.pop()!)) if (!seen.has(id)) { seen.add(id); todo.push(id); }
      expect(seen.size).toBe(n);
    }
  });
});

describe.each([
  ["BFS", breadthFirstSearch],
  ["DFS", depthFirstSearch],
  ["Dijkstra", dijkstraShortestPath],
] as const)("%s", (_name, algo) => {
  it.each(SIZES)("visits every node exactly once and ends DONE (n=%i)", (n) => {
    for (const seed of SEEDS.slice(0, 10)) {
      const { views, derived } = algo.build(g(n, seed));
      expect(derived[0].action).toBe("init");
      expect(derived.at(-1)!.action).toBe("done");
      const last = net(views.at(-1));
      expect(Object.values(last.nodeState).every((s) => s === "visited")).toBe(true);
      // the lit edges form a spanning tree: n-1 of them
      expect(Object.values(last.edgeState).filter((s) => s === "tree")).toHaveLength(n - 1);
      expect(views).toHaveLength(derived.length);
      derived.forEach((d, k) => { expect(d.index).toBe(k); expect(d.line).toBeLessThan(algo.pseudocode.length); });
    }
  });

  it("never re-visits a node", () => {
    const { derived } = algo.build(g(8, 99));
    const visits = derived.filter((d) => d.action === "visit" && !d.summary?.startsWith("backtrack")).map((d) => d.detail);
    expect(new Set(visits).size).toBe(visits.length);
  });
});

describe("BFS", () => {
  it("visits nodes in non-decreasing hop distance from A", () => {
    const { nodes, edges } = generateGraph(10, 5);
    const hops: Record<string, number> = { A: 0 };
    const q = ["A"];
    while (q.length) { const u = q.shift()!; for (const { id } of neighbours(edges, u)) if (hops[id] === undefined) { hops[id] = hops[u] + 1; q.push(id); } }
    const order = breadthFirstSearch.build(g(10, 5)).derived.filter((d) => d.action === "visit").map((d) => hops[d.detail!]);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(order).toHaveLength(nodes.length);
  });
});

describe("Dijkstra", () => {
  it("final distances match a brute-force Bellman-Ford", () => {
    for (const seed of SEEDS) {
      const { edges, nodes } = generateGraph(8, seed);
      const dist: Record<string, number> = Object.fromEntries(nodes.map((n) => [n.id, Infinity]));
      dist.A = 0;
      for (let k = 0; k < nodes.length; k++) for (const e of edges) {
        if (dist[e.a] + e.w! < dist[e.b]) dist[e.b] = dist[e.a] + e.w!;
        if (dist[e.b] + e.w! < dist[e.a]) dist[e.a] = dist[e.b] + e.w!;
      }
      const last = net(dijkstraShortestPath.build(g(8, seed)).views.at(-1));
      for (const n of nodes) expect(last.badges[n.id]).toBe(String(dist[n.id]));
    }
  });

  it("settles nodes in non-decreasing distance", () => {
    const { derived, views } = dijkstraShortestPath.build(g(10, 3));
    const settled = derived.filter((d) => d.action === "visit").map((d) => Number(net(views[d.index]).badges[d.detail!]));
    expect(settled).toEqual([...settled].sort((a, b) => a - b));
  });
});

describe("trees", () => {
  const inputs = [[5, 3, 8, 4, 2, 7, 1], [1, 2, 3, 4, 5], [50, 30, 70, 30, 20], [9, 8], Array.from({ length: 12 }, (_, k) => (k * 37) % 89)];

  it.each(inputs.map((a) => [JSON.stringify(a), a] as const))("buildBst keeps the BST property and lays nodes out left-to-right in key order: %s", (_l, keys) => {
    const { nodes, inserted } = buildBst(keys);
    expect(inserted).toEqual([...new Set(keys)]);
    const byX = [...nodes].sort((a, b) => a.x - b.x).map((n) => Number(n.id));
    expect(byX).toEqual([...new Set(keys)].sort((a, b) => a - b));
  });

  it.each(inputs.map((a) => [JSON.stringify(a), a] as const))("BST insert reveals every distinct key, ending DONE: %s", (_l, keys) => {
    const { views, derived } = bstInsertAlgo.build(t(keys));
    expect(Object.values(net(views[0]).nodeState).every((s) => s === "hidden")).toBe(true);
    const last = net(views.at(-1));
    expect(Object.values(last.nodeState).filter((s) => s !== "hidden")).toHaveLength(new Set(keys).size);
    expect(derived.filter((d) => d.action === "insert")).toHaveLength(new Set(keys).size);
    expect(derived.at(-1)!.action).toBe("done");
  });

  it.each(inputs.map((a) => [JSON.stringify(a), a] as const))("in-order traversal outputs the keys sorted: %s", (_l, keys) => {
    const { views } = treeTraversal.build(t(keys));
    expect(net(views.at(-1)).strip!.items.map(Number)).toEqual([...new Set(keys)].sort((a, b) => a - b));
  });
});
