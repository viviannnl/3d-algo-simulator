import type { AlgoInput, Built, LegendItem, NetEdge, NetNode, NetworkAlgorithm } from "@/lib/types";
import { edgeKey } from "@/lib/types";
import { NetRecorder } from "@/lib/network";

interface TreeNode { key: number; left?: TreeNode; right?: TreeNode; depth: number }

/** Insert keys in order into a BST (duplicates are skipped), then lay it out. */
export function buildBst(keys: number[]) {
  let root: TreeNode | undefined;
  const order: number[] = [];
  for (const key of keys) {
    if (!root) { root = { key, depth: 0 }; order.push(key); continue; }
    let cur = root;
    for (;;) {
      if (key === cur.key) break;
      const side = key < cur.key ? "left" : "right";
      if (!cur[side]) { cur[side] = { key, depth: cur.depth + 1 }; order.push(key); break; }
      cur = cur[side]!;
    }
  }
  // layout: x by in-order rank, y by depth — no overlaps, and left/right reads naturally
  const inorder: TreeNode[] = [];
  const walk = (n?: TreeNode) => { if (n) { walk(n.left); inorder.push(n); walk(n.right); } };
  walk(root);
  const height = Math.max(0, ...inorder.map((n) => n.depth));
  const nodes: NetNode[] = inorder.map((n, i) => ({
    id: String(n.key), label: String(n.key),
    x: (i + 1) / (inorder.length + 1),
    y: 0.1 + (height ? n.depth / height : 0) * 0.78,
  }));
  const edges: NetEdge[] = [];
  for (const n of inorder) {
    if (n.left) edges.push({ a: String(n.key), b: String(n.left.key) });
    if (n.right) edges.push({ a: String(n.key), b: String(n.right.key) });
  }
  return { root, nodes, edges, inserted: order, height };
}

const TREE_LEGEND: LegendItem[] = [
  { color: "var(--swap-ink)", label: "current" },
  { color: "var(--compare-ink)", label: "on stack" },
  { color: "var(--sorted-ink)", label: "done" },
];

function bstInsert(input: AlgoInput): Built {
  const t = buildBst(input.values);
  let compares = 0;
  const r = new NetRecorder(t.nodes, t.edges, true, "hidden", "hidden", (rec) => ({
    inserted: Object.values(rec.nodeState).filter((s) => s !== "hidden").length,
    cmp: compares,
    height: Math.max(0, ...t.nodes.filter((n) => rec.nodeState[n.id] !== "hidden").map((n) => depthOf(n.id))),
  }));
  const depth: Record<string, number> = {};
  const depthOf = (id: string) => depth[id] ?? 0;
  const pending = [...input.values];
  r.strip = { label: "to insert", items: pending.map(String) };
  r.snap("init", `Insert ${input.values.length} keys into an empty binary search tree.`, 0);

  let root: TreeNode | undefined;
  for (const key of input.values) {
    pending.shift();
    r.strip.items = pending.map(String);
    const id = String(key);
    if (!root) {
      root = { key, depth: 0 };
      depth[id] = 0;
      r.nodeState[id] = "visited";
      r.snap("insert", `${key} becomes the root`, 0, { current: id, detail: id });
      continue;
    }
    let cur = root;
    for (;;) {
      compares++;
      if (key === cur.key) {
        r.snap("compare", `${key} = ${cur.key}: already in the tree, skip it`, 1, { current: String(cur.key), detail: String(cur.key), summary: `${key} = ${cur.key}` });
        break;
      }
      const side = key < cur.key ? "left" : "right";
      r.snap("compare", `${key} ${side === "left" ? "<" : ">"} ${cur.key}: go ${side}`, side === "left" ? 2 : 3, {
        current: String(cur.key), detail: String(cur.key), summary: `${key} ${side === "left" ? "<" : ">"} ${cur.key}`,
      });
      if (!cur[side]) {
        cur[side] = { key, depth: cur.depth + 1 };
        depth[id] = cur.depth + 1;
        r.nodeState[id] = "visited";
        r.edgeState[edgeKey(String(cur.key), id)] = "tree";
        r.snap("insert", `Empty ${side} slot under ${cur.key} — insert ${key} at depth ${cur.depth + 1}`, 4, { current: id, edge: [String(cur.key), id], detail: id });
        break;
      }
      cur = cur[side]!;
    }
  }
  r.snap("done", `Tree built: ${t.nodes.length} nodes, height ${t.height}. Every left subtree holds smaller keys.`, -1);
  return { views: r.views, derived: r.derived };
}

function inorderTraversal(input: AlgoInput): Built {
  const t = buildBst(input.values);
  const stack: TreeNode[] = [];
  const out: number[] = [];
  const r = new NetRecorder(t.nodes, t.edges, true, "idle", "tree", (rec) => ({
    visited: rec.count("visited"), stack: stack.length, height: t.height,
  }));
  r.strip = { label: "output", items: [] };
  r.snap("init", `In-order traversal of a BST built from ${input.values.join(", ")}.`, 0);

  let cur = t.root;
  while (cur || stack.length) {
    while (cur) {
      stack.push(cur);
      r.nodeState[String(cur.key)] = "frontier";
      r.snap("push", `Push ${cur.key} and go left`, 1, { current: String(cur.key), detail: String(cur.key) });
      cur = cur.left;
    }
    const n = stack.pop()!;
    out.push(n.key);
    r.nodeState[String(n.key)] = "visited";
    r.strip.items = out.map(String);
    r.snap("visit", `Nothing further left — visit ${n.key}, then try its right subtree`, 2, { current: String(n.key), detail: String(n.key), summary: `output ${n.key}` });
    cur = n.right;
  }
  r.snap("done", `Visited in order: ${out.join(" ")} — sorted, because it is a BST.`, -1);
  return { views: r.views, derived: r.derived };
}

export const bstInsertAlgo: NetworkAlgorithm = {
  slug: "bst-insert",
  name: "BST Insert",
  category: "Trees",
  kind: "tree",
  summary: "Insert keys one by one: smaller goes left, larger goes right, until an empty slot appears.",
  complexity: { time: "O(log n)", space: "O(1)" },
  pseudocode: [
    "insert(key): empty tree → root",
    "  cur = root; key == cur → skip",
    "  if key < cur: go left",
    "  else: go right",
    "  at an empty slot: attach key there",
  ],
  stats: [
    { key: "inserted", label: "Nodes", led: "var(--sorted-ink)" },
    { key: "cmp", label: "Cmp", led: "var(--compare-ink)" },
    { key: "height", label: "Height", led: "var(--ink-2)" },
  ],
  legend: TREE_LEGEND,
  build: bstInsert,
};

export const treeTraversal: NetworkAlgorithm = {
  slug: "tree-traversal",
  name: "Tree Traversal",
  category: "Trees",
  kind: "tree",
  summary: "In-order traversal visits left subtree, node, right subtree — on a BST that reads out the keys sorted.",
  complexity: { time: "O(n)", space: "O(h)" },
  pseudocode: [
    "cur = root; stack = []",
    "while cur: push cur; cur = cur.left",
    "n = pop(); visit n; cur = n.right",
    "repeat until cur and stack are empty",
  ],
  stats: [
    { key: "visited", label: "Visited", led: "var(--sorted-ink)" },
    { key: "stack", label: "Stack", led: "var(--compare-ink)" },
    { key: "height", label: "Height", led: "var(--ink-2)" },
  ],
  legend: TREE_LEGEND,
  build: inorderTraversal,
};
