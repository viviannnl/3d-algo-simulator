import type { Algorithm, ArrayAlgorithm } from "@/lib/types";
import { bubbleSort } from "./bubbleSort";
import { insertionSort } from "./insertionSort";
import { selectionSort } from "./selectionSort";
import { quickSort } from "./quickSort";
import { mergeSort } from "./mergeSort";
import { heapSort } from "./heapSort";
import { shellSort } from "./shellSort";
import { linearSearch, binarySearch } from "./searches";
import { breadthFirstSearch, depthFirstSearch, dijkstraShortestPath } from "./graphs";
import { bstInsertAlgo, treeTraversal } from "./trees";

export const sorts: ArrayAlgorithm[] = [bubbleSort, insertionSort, selectionSort, quickSort, mergeSort, heapSort, shellSort];
export const searches: ArrayAlgorithm[] = [linearSearch, binarySearch];

/** Registry of implemented (trace-generating) algorithms, in course order. */
export const algorithms: Algorithm[] = [
  ...sorts,
  ...searches,
  breadthFirstSearch, depthFirstSearch, dijkstraShortestPath,
  bstInsertAlgo, treeTraversal,
];

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

const lesson = (a: Algorithm, categoryId: string): CatalogAlgo => ({
  slug: a.slug, name: a.name, description: a.summary,
  time: a.complexity.time, space: a.complexity.space, categoryId, ready: true,
});

const roadmap = (slug: string, name: string, description: string, time: string, space: string, categoryId: string): CatalogAlgo =>
  ({ slug, name, description, time, space, categoryId, ready: false });

/** The course: implemented algorithms are lessons; roadmap entries are listed as "soon". */
export const catalog: CatalogCategory[] = [
  { id: "sorting", name: "Sorting", algos: sorts.map((a) => lesson(a, "sorting")) },
  { id: "searching", name: "Searching", algos: searches.map((a) => lesson(a, "searching")) },
  {
    id: "graphs", name: "Graphs", algos: [
      ...[breadthFirstSearch, depthFirstSearch, dijkstraShortestPath].map((a) => lesson(a, "graphs")),
      roadmap("topological-sort", "Topological Sort", "Order the nodes of a DAG so every edge points forward.", "O(V + E)", "O(V)", "graphs"),
    ],
  },
  {
    id: "trees", name: "Trees", algos: [
      ...[bstInsertAlgo, treeTraversal].map((a) => lesson(a, "trees")),
      roadmap("avl-rotations", "AVL Rotations", "Keep a BST balanced by rotating nodes after each insert.", "O(log n)", "O(1)", "trees"),
    ],
  },
];
