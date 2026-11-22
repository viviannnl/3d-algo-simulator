import { test, expect } from "./fixtures";

/**
 * Real round-trips against the production server (no mocks anywhere in this
 * app, so these prove routing and status codes rather than mock fidelity).
 */
test.describe.configure({ mode: "serial" });

test("/ redirects into the first lesson (no landing page)", async ({ request }) => {
  const r = await request.get("/", { maxRedirects: 0 });
  expect([307, 308]).toContain(r.status());
  expect(r.headers()["location"]).toMatch(/\/algorithms\/bubble-sort$/);
  const followed = await request.get("/");
  expect(followed.status()).toBe(200);
  expect(followed.url()).toMatch(/\/algorithms\/bubble-sort$/);
});

for (const slug of [
  "bubble-sort", "insertion-sort", "selection-sort", "quick-sort", "merge-sort", "heap-sort", "shell-sort",
  "linear-search", "binary-search", "bfs", "dfs", "dijkstra", "bst-insert", "tree-traversal",
]) {
  test(`${slug} is served`, async ({ request }) => {
    expect((await request.get(`/algorithms/${slug}`)).status()).toBe(200);
  });
}

test("unknown slug is a 404, not a silent fallback", async ({ request }) => {
  expect((await request.get("/algorithms/does-not-exist")).status()).toBe(404);
});

test("roadmap ('soon') slug is a 404 until it is implemented", async ({ request }) => {
  expect((await request.get("/algorithms/topological-sort")).status()).toBe(404);
});
