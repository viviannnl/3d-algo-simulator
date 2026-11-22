import type { DerivedStep, EdgeState, NetEdge, NetNode, NetworkView, NodeState, StepAction } from "./types";
import { edgeKey } from "./types";

/** Small, fast, seedable PRNG — the same seed always draws the same graph. */
export function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export const nodeLabel = (i: number) => String.fromCharCode(65 + i);

function crosses(p: NetNode, q: NetNode, r: NetNode, s: NetNode) {
  if (p === r || p === s || q === r || q === s) return false; // sharing an endpoint is fine
  const o = (a: NetNode, b: NetNode, c: NetNode) => Math.sign((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
  return o(p, q, r) !== o(p, q, s) && o(r, s, p) !== o(r, s, q);
}

/**
 * A connected, planar-looking weighted graph: nodes scattered with a minimum
 * spacing, a shortest-edge spanning tree for connectivity, then extra short
 * edges that cross nothing. Deterministic for (n, seed).
 */
export function generateGraph(n: number, seed: number): { nodes: NetNode[]; edges: NetEdge[] } {
  const rand = mulberry32(seed);
  const nodes: NetNode[] = [];
  const minGap = 0.62 / Math.sqrt(n);
  for (let i = 0; i < n; i++) {
    let best: NetNode | undefined;
    let bestGap = -1;
    // best-of-many candidates: keeps nodes apart without risking an endless loop
    for (let tries = 0; tries < 40; tries++) {
      const c = { id: nodeLabel(i), label: nodeLabel(i), x: 0.08 + rand() * 0.84, y: 0.1 + rand() * 0.8 };
      const gap = Math.min(1, ...nodes.map((m) => Math.hypot(m.x - c.x, (m.y - c.y) * 0.8)));
      if (gap > bestGap) { best = c; bestGap = gap; }
      if (gap >= minGap) break;
    }
    nodes.push(best!);
  }

  const pairs: [number, number, number][] = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    pairs.push([i, j, Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y)]);
  }
  pairs.sort((a, b) => a[2] - b[2]);

  const parent = nodes.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const chosen: [number, number][] = [];
  const ok = (i: number, j: number) => chosen.every(([a, b]) => !crosses(nodes[i], nodes[j], nodes[a], nodes[b]));

  for (const [i, j] of pairs) {
    if (find(i) !== find(j)) { parent[find(i)] = find(j); chosen.push([i, j]); }
  }
  const extra = Math.floor(n / 2);
  for (const [i, j] of pairs) {
    if (chosen.length >= n - 1 + extra) break;
    if (!chosen.some(([a, b]) => (a === i && b === j)) && ok(i, j)) chosen.push([i, j]);
  }

  const edges = chosen.map(([i, j]) => {
    const [a, b] = nodes[i].id < nodes[j].id ? [i, j] : [j, i];
    return { a: nodes[a].id, b: nodes[b].id, w: 1 + Math.floor(rand() * 9) };
  });
  edges.sort((e, f) => (e.a + e.b).localeCompare(f.a + f.b));
  return { nodes, edges };
}

/** Neighbours of `id`, alphabetical — so traversals are predictable and explainable. */
export function neighbours(edges: NetEdge[], id: string): { id: string; w: number }[] {
  return edges
    .filter((e) => e.a === id || e.b === id)
    .map((e) => ({ id: e.a === id ? e.b : e.a, w: e.w ?? 1 }))
    .sort((p, q) => p.id.localeCompare(q.id));
}

interface SnapOpts {
  /** transient highlights for this frame only */
  current?: string;
  edge?: [string, string];
  detail?: string;
  summary?: string;
}

/**
 * Records a network algorithm as it runs: mutate the persistent node/edge state,
 * then `snap()` a frame. Counters are computed by the caller-supplied `stats`
 * function from the state at each snap, so they can never drift from the picture.
 */
export class NetRecorder {
  views: NetworkView[] = [];
  derived: DerivedStep[] = [];
  nodeState: Record<string, NodeState>;
  edgeState: Record<string, EdgeState>;
  badges: Record<string, string> = {};
  strip?: { label: string; items: string[] };
  counters: Record<string, number> = {};

  constructor(
    public nodes: NetNode[],
    public edges: NetEdge[],
    public directed: boolean,
    initialNode: NodeState,
    initialEdge: EdgeState,
    private stats: (r: NetRecorder) => Record<string, number>,
  ) {
    this.nodeState = Object.fromEntries(nodes.map((n) => [n.id, initialNode]));
    this.edgeState = Object.fromEntries(edges.map((e) => [edgeKey(e.a, e.b), initialEdge]));
  }

  bump(key: string) {
    this.counters[key] = (this.counters[key] ?? 0) + 1;
  }

  count(state: NodeState) {
    return Object.values(this.nodeState).filter((s) => s === state).length;
  }

  snap(action: StepAction, note: string, line: number, opts: SnapOpts = {}) {
    const nodeState = { ...this.nodeState };
    const edgeState = { ...this.edgeState };
    if (opts.current) nodeState[opts.current] = "current";
    if (opts.edge) {
      const k = edgeKey(...opts.edge);
      if (edgeState[k] !== "tree" || action === "edge") edgeState[k] = "active";
    }
    const index = this.views.length;
    this.views.push({
      kind: "network", nodes: this.nodes, edges: this.edges, directed: this.directed,
      nodeState, edgeState, badges: { ...this.badges },
      strip: this.strip ? { label: this.strip.label, items: [...this.strip.items] } : undefined,
      explanation: note, line, action,
    });
    this.derived.push({
      index, action, note, line, pass: 1,
      detail: opts.detail, summary: opts.summary,
      stats: this.stats(this),
      comparisons: 0, swaps: 0, sortedCount: 0,
    });
  }
}
