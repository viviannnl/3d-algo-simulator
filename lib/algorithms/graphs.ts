import type { AlgoInput, Built, LegendItem, NetEdge, NetworkAlgorithm, StatDef } from "@/lib/types";
import { edgeKey } from "@/lib/types";
import { generateGraph, neighbours, NetRecorder } from "@/lib/network";

const GRAPH_LEGEND: LegendItem[] = [
  { color: "var(--compare-ink)", label: "frontier" },
  { color: "var(--swap-ink)", label: "current" },
  { color: "var(--sorted-ink)", label: "visited" },
];

const TRAVERSAL_STATS: StatDef[] = [
  { key: "visited", label: "Visited", led: "var(--sorted-ink)" },
  { key: "frontier", label: "Frontier", led: "var(--compare-ink)" },
  { key: "edges", label: "Edges", led: "var(--ink-2)" },
];

/** Graphs are drawn unweighted for BFS / DFS — weights only matter to Dijkstra. */
const unweighted = (edges: NetEdge[]) => edges.map(({ a, b }) => ({ a, b }));

function finish(r: NetRecorder, note: string): Built {
  r.snap("done", note, -1);
  return { views: r.views, derived: r.derived };
}

function bfs(input: AlgoInput): Built {
  const g = generateGraph(input.nodes, input.seed);
  const edges = unweighted(g.edges);
  const queue: string[] = [];
  const r = new NetRecorder(g.nodes, edges, false, "idle", "idle", (rec) => ({
    visited: rec.count("visited"), frontier: queue.length, edges: rec.counters.edges ?? 0,
  }));
  r.strip = { label: "queue", items: queue };
  const start = g.nodes[0].id;
  r.snap("init", `Breadth-first search from ${start}.`, 0);

  queue.push(start);
  r.nodeState[start] = "frontier";
  r.snap("push", `Enqueue the start node ${start}`, 0, { detail: start });

  while (queue.length) {
    const u = queue.shift()!;
    r.nodeState[u] = "visited";
    r.snap("visit", `Dequeue ${u} and visit it`, 2, { current: u, detail: u });
    for (const { id: v } of neighbours(edges, u)) {
      r.bump("edges");
      const seen = r.nodeState[v] !== "idle";
      r.snap("edge", seen ? `${u}–${v}: ${v} already seen, skip` : `${u}–${v}: ${v} is new`, 3, { current: u, edge: [u, v], detail: `${u}→${v}` });
      if (!seen) {
        r.nodeState[v] = "frontier";
        r.edgeState[edgeKey(u, v)] = "tree";
        queue.push(v);
        r.snap("push", `Enqueue ${v} — it is one step further from ${start} than ${u}`, 4, { current: u, detail: v });
      }
    }
  }
  return finish(r, `Every node reachable from ${start} visited, level by level.`);
}

function dfs(input: AlgoInput): Built {
  const g = generateGraph(input.nodes, input.seed);
  const edges = unweighted(g.edges);
  const stack: string[] = [];
  const r = new NetRecorder(g.nodes, edges, false, "idle", "idle", (rec) => ({
    visited: rec.count("visited"), frontier: stack.length, edges: rec.counters.edges ?? 0,
  }));
  r.strip = { label: "call stack", items: stack };
  const start = g.nodes[0].id;
  r.snap("init", `Depth-first search from ${start}.`, 0);

  function visit(u: string, from?: string) {
    stack.push(u);
    r.nodeState[u] = "visited";
    r.snap("visit", from ? `Go deeper: ${from} → ${u}` : `Start at ${u}`, 1, { current: u, detail: u });
    for (const { id: v } of neighbours(edges, u)) {
      r.bump("edges");
      const seen = r.nodeState[v] !== "idle";
      r.snap("edge", seen ? `${u}–${v}: ${v} already visited, skip` : `${u}–${v}: ${v} is new — dive in`, 2, { current: u, edge: [u, v], detail: `${u}→${v}` });
      if (!seen) {
        r.edgeState[edgeKey(u, v)] = "tree";
        visit(v, u);
        r.snap("visit", `Back at ${u} — continue with its next neighbour`, 3, { current: u, detail: u, summary: `backtrack to ${u}` });
      }
    }
    stack.pop();
  }
  visit(start);
  return finish(r, `Every node reachable from ${start} visited, one branch at a time.`);
}

function dijkstra(input: AlgoInput): Built {
  const g = generateGraph(input.nodes, input.seed);
  const dist: Record<string, number> = Object.fromEntries(g.nodes.map((n) => [n.id, Infinity]));
  const via: Record<string, string | undefined> = {};
  const r = new NetRecorder(g.nodes, g.edges, false, "idle", "idle", (rec) => ({
    settled: rec.count("visited"),
    frontier: rec.count("frontier"),
    relax: rec.counters.relax ?? 0,
  }));
  const pq = () => g.nodes
    .filter((n) => r.nodeState[n.id] === "frontier")
    .sort((a, b) => dist[a.id] - dist[b.id] || a.id.localeCompare(b.id))
    .map((n) => `${n.id}·${dist[n.id]}`);
  const start = g.nodes[0].id;
  for (const n of g.nodes) r.badges[n.id] = "∞";
  r.strip = { label: "queue by distance", items: [] };
  r.snap("init", `Shortest paths from ${start}. Every distance starts at ∞.`, 0);

  dist[start] = 0;
  r.badges[start] = "0";
  r.nodeState[start] = "frontier";
  r.strip.items = pq();
  r.snap("push", `dist[${start}] = 0`, 0, { detail: start });

  for (;;) {
    const next = g.nodes.filter((n) => r.nodeState[n.id] === "frontier").sort((a, b) => dist[a.id] - dist[b.id] || a.id.localeCompare(b.id))[0];
    if (!next) break;
    const u = next.id;
    r.nodeState[u] = "visited";
    r.strip.items = pq();
    r.snap("visit", `Settle ${u}: no shorter way to it exists (dist ${dist[u]})`, 2, { current: u, detail: u });
    for (const { id: v, w } of neighbours(g.edges, u)) {
      if (r.nodeState[v] === "visited") continue;
      const alt = dist[u] + w;
      const better = alt < dist[v];
      r.snap("edge", `${u}–${v} weighs ${w}: ${dist[u]} + ${w} = ${alt} ${better ? "<" : "≥"} ${dist[v] === Infinity ? "∞" : dist[v]}`, 3, {
        current: u, edge: [u, v], detail: `${u}→${v}`,
      });
      if (better) {
        if (via[v]) r.edgeState[edgeKey(via[v]!, v)] = "idle";
        via[v] = u;
        dist[v] = alt;
        r.badges[v] = String(alt);
        r.nodeState[v] = "frontier";
        r.edgeState[edgeKey(u, v)] = "tree";
        r.bump("relax");
        r.strip.items = pq();
        r.snap("relax", `Relax: dist[${v}] = ${alt}, reached via ${u}`, 4, { current: u, detail: v, summary: `${v} ← ${alt}` });
      }
    }
  }
  return finish(r, `Shortest distances from ${start} found — the lit edges form the shortest-path tree.`);
}

const base = {
  category: "Graphs",
  kind: "graph" as const,
  legend: GRAPH_LEGEND,
};

export const breadthFirstSearch: NetworkAlgorithm = {
  ...base,
  slug: "bfs",
  name: "Breadth-First Search",
  summary: "Explore the graph in rings: every neighbour first, then their neighbours. Finds fewest-hop paths.",
  complexity: { time: "O(V + E)", space: "O(V)" },
  pseudocode: [
    "queue = [start]; mark start",
    "while queue:",
    "  u = queue.pop_front(); visit u",
    "  for v in neighbours(u):",
    "    if v unseen: mark v; queue.push(v)",
  ],
  stats: TRAVERSAL_STATS,
  build: bfs,
};

export const depthFirstSearch: NetworkAlgorithm = {
  ...base,
  slug: "dfs",
  name: "Depth-First Search",
  summary: "Follow one branch as deep as it goes, then backtrack and try the next. Uses the call stack.",
  complexity: { time: "O(V + E)", space: "O(V)" },
  pseudocode: [
    "dfs(u):",
    "  mark u visited",
    "  for v in neighbours(u):",
    "    if v unvisited: dfs(v)",
  ],
  stats: TRAVERSAL_STATS,
  build: dfs,
};

export const dijkstraShortestPath: NetworkAlgorithm = {
  ...base,
  slug: "dijkstra",
  name: "Dijkstra",
  summary: "Shortest paths on a weighted graph: always settle the closest unsettled node, then relax its edges.",
  complexity: { time: "O(E log V)", space: "O(V)" },
  pseudocode: [
    "dist[*] = ∞; dist[start] = 0",
    "while a reachable node is unsettled:",
    "  u = closest unsettled; settle u",
    "  for (v, w) in edges(u):",
    "    dist[v] = min(dist[v], dist[u]+w)",
  ],
  stats: [
    { key: "settled", label: "Settled", led: "var(--sorted-ink)" },
    { key: "frontier", label: "Frontier", led: "var(--compare-ink)" },
    { key: "relax", label: "Relax", led: "var(--swap-ink)" },
  ],
  build: dijkstra,
};
