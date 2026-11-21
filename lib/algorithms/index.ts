import type { Algorithm } from "@/lib/types";
import { bubbleSort } from "./bubbleSort";

/** Registry of implemented (trace-generating) algorithms. */
export const algorithms: Algorithm[] = [bubbleSort];

export const algorithmsBySlug = Object.fromEntries(
  algorithms.map((a) => [a.slug, a]),
) as Record<string, Algorithm>;

export interface CatalogAlgo {
  slug: string;
  name: string;
  description: string;
  time: string;
  space: string;
  categoryId: string;
  ready: boolean;
}

export interface CatalogCategory {
  id: string;
  name: string;
  algos: CatalogAlgo[];
}

const impl = (slug: string) => Boolean(algorithmsBySlug[slug]);

/** Catalog inventory — implemented algorithms are `ready`, the rest are a roadmap. */
export const catalog: CatalogCategory[] = [
  {
    id: "sorting",
    name: "Sorting",
    algos: [
      { slug: "bubble-sort", name: "Bubble Sort", description: "Repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order.", time: "O(n²)", space: "O(1)", categoryId: "sorting", ready: impl("bubble-sort") },
      { slug: "insertion-sort", name: "Insertion Sort", description: "Builds the sorted array one item at a time by inserting each element into its correct position.", time: "O(n²)", space: "O(1)", categoryId: "sorting", ready: impl("insertion-sort") },
      { slug: "quick-sort", name: "Quick Sort", description: "Picks a pivot and partitions the array around it, then recursively sorts the partitions.", time: "O(n log n)", space: "O(log n)", categoryId: "sorting", ready: impl("quick-sort") },
      { slug: "merge-sort", name: "Merge Sort", description: "Divide and conquer: splits the list into halves, sorts each, and merges them back together.", time: "O(n log n)", space: "O(n)", categoryId: "sorting", ready: impl("merge-sort") },
    ],
  },
  {
    id: "graphs",
    name: "Graphs",
    algos: [
      { slug: "bfs", name: "Breadth-First Search", description: "Traverses the graph level by level, visiting all neighbors before going deeper.", time: "O(V + E)", space: "O(V)", categoryId: "graphs", ready: impl("bfs") },
      { slug: "dfs", name: "Depth-First Search", description: "Goes as deep as possible along each branch before backtracking.", time: "O(V + E)", space: "O(V)", categoryId: "graphs", ready: impl("dfs") },
      { slug: "dijkstra", name: "Dijkstra", description: "Finds the shortest paths between nodes in a weighted graph.", time: "O(E log V)", space: "O(V)", categoryId: "graphs", ready: impl("dijkstra") },
    ],
  },
  {
    id: "trees",
    name: "Trees",
    algos: [
      { slug: "bst-insert", name: "BST Insert", description: "Inserts a node into a Binary Search Tree while preserving its ordering property.", time: "O(log n)", space: "O(1)", categoryId: "trees", ready: impl("bst-insert") },
      { slug: "tree-traversal", name: "Tree Traversal", description: "Visits every node in order (left child, root, right child).", time: "O(n)", space: "O(h)", categoryId: "trees", ready: impl("tree-traversal") },
    ],
  },
];
