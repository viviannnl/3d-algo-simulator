import AxeBuilder from "@axe-core/playwright";
import { test, expect, open, scrubber, bars, barValues, barStates, traceRows, stat, stepForward, expectNoHorizontalOverflow } from "./fixtures";
import type { Page } from "@playwright/test";

const goToEnd = async (page: Page) => {
  const max = (await scrubber(page).getAttribute("max"))!;
  await scrubber(page).fill(max);
  await expect(scrubber(page)).toHaveValue(max);
};
const lastRow = (page: Page) => page.locator('[data-testid="trace-row"][aria-current="step"]');
const nodes = (page: Page) => page.getByTestId("node");
const nodeStates = (page: Page) => nodes(page).evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.state));
const strip = (page: Page) => page.getByTestId("glass-strip");
const scan = async (page: Page) => {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.length}× ${v.nodes[0].target}`)).toEqual([]);
};

// ---------------------------------------------------------------- new sorts

for (const slug of ["merge-sort", "heap-sort", "shell-sort"]) {
  test(`${slug}: ends sorted with every bar locked`, async ({ page }) => {
    await open(page, `/algorithms/${slug}`);
    expect(await barValues(page)).toEqual([5, 3, 8, 4, 2, 7, 1]);
    await goToEnd(page);
    expect(await barValues(page)).toEqual([1, 2, 3, 4, 5, 7, 8]);
    expect(await barStates(page)).toEqual(Array(7).fill("sorted"));
    await expect(lastRow(page)).toContainText("DONE");
  });
}

test("merge sort shows its buffer and writes values back into place", async ({ page }) => {
  await open(page, "/algorithms/merge-sort");
  await expect(page.getByTestId("merge-buffer")).toHaveCount(0);
  // walk to the first merge, where the left half is copied into the buffer
  for (let i = 0; i < 20 && !(await page.getByTestId("merge-buffer").count()); i++) await page.keyboard.press("ArrowRight");
  const buffer = page.getByTestId("merge-buffer");
  await expect(buffer).toContainText("buffer");
  for (let i = 0; i < 6 && !(await barStates(page)).includes("write"); i++) await page.keyboard.press("ArrowRight");
  expect((await barStates(page)).filter((s) => s === "write")).toHaveLength(1);
  await expect(lastRow(page)).toContainText("WRITE");
  // the rail labels its counters for merge sort: Cmp / Write / Sorted
  await expect(page.getByTestId("stat-write")).toBeVisible();
  await expect(page.getByTestId("stat-swap")).toHaveCount(0);
});

test("heap sort moves the max to the end after building the heap", async ({ page }) => {
  await open(page, "/algorithms/heap-sort");
  for (let i = 0; i < 40 && !(await barStates(page)).includes("sorted"); i++) await page.keyboard.press("ArrowRight");
  const values = await barValues(page);
  const states = await barStates(page);
  expect(states.at(-1)).toBe("sorted");
  expect(values.at(-1)).toBe(8);
});

// ---------------------------------------------------------------- searching

test("linear search walks left to right and finds the default target", async ({ page }) => {
  await open(page, "/algorithms/linear-search");
  await expect(page.getByTestId("target-line")).toContainText("target 7");
  await stepForward(page, 1);
  expect((await barStates(page))[0]).toBe("probe");
  await goToEnd(page);
  const states = await barStates(page);
  const at = states.indexOf("found");
  expect((await barValues(page))[at]).toBe(7);
  await expect(lastRow(page)).toContainText("FOUND");
  await expect(stat(page, "probes")).toContainText(String(at + 1));
});

test("a target that is not there ends in MISS", async ({ page }) => {
  await open(page, "/algorithms/linear-search");
  const box = page.getByRole("textbox", { name: "Search target" });
  await box.fill("99");
  await box.press("Enter");
  await expect(page.getByTestId("target-line")).toContainText("target 99");
  await goToEnd(page);
  await expect(lastRow(page)).toContainText("MISS");
  expect(await barStates(page)).not.toContain("found");
});

test("an invalid target is rejected and the old one restored", async ({ page }) => {
  await open(page, "/algorithms/binary-search");
  const box = page.getByRole("textbox", { name: "Search target" });
  await box.fill("abc");
  await box.blur();
  await expect(box).toHaveValue("7");
});

test("binary search sorts its input, then halves the window each step", async ({ page }) => {
  await open(page, "/algorithms/binary-search");
  expect(await barValues(page)).toEqual([1, 2, 3, 4, 5, 7, 8]);
  await stepForward(page, 3); // range, probe mid, narrow
  const states = await barStates(page);
  expect(states.filter((s) => s === "out").length).toBeGreaterThanOrEqual(3);
  await expect(page.getByTestId("stat-window")).toContainText("3");
  await goToEnd(page);
  await expect(lastRow(page)).toContainText("FOUND");
});

test("binary search goes left for a small target, and misses cleanly when it is absent", async ({ page }) => {
  await open(page, "/algorithms/binary-search");
  const box = page.getByRole("textbox", { name: "Search target" });
  await box.fill("2");
  await box.press("Enter");
  await box.blur(); // shortcuts are (rightly) ignored while the target field has focus
  await stepForward(page, 3); // range, probe a[3]=4, keep the left half
  await expect(lastRow(page)).toContainText("[0..2]");
  await box.fill("6");
  await box.press("Enter");
  await goToEnd(page);
  await expect(lastRow(page)).toContainText("MISS");
  expect(await barStates(page)).not.toContain("found");
});

test("shuffling a search picks a target that is in the new array", async ({ page }) => {
  await open(page, "/algorithms/binary-search");
  await page.getByRole("button", { name: "Shuffle input" }).click();
  const target = Number(await page.getByRole("textbox", { name: "Search target" }).inputValue());
  expect(await barValues(page)).toContain(target);
  await goToEnd(page);
  await expect(lastRow(page)).toContainText("FOUND");
});

// ---------------------------------------------------------------- graphs

test("BFS visits every node, with the queue on the glass", async ({ page }) => {
  await open(page, "/algorithms/bfs");
  await expect(nodes(page)).toHaveCount(7);
  expect(await nodeStates(page)).toEqual(Array(7).fill("idle"));
  await stepForward(page, 2); // enqueue A, visit A
  await expect(strip(page)).toContainText("queue");
  await goToEnd(page);
  expect(await nodeStates(page)).toEqual(Array(7).fill("visited"));
  await expect(page.getByTestId("edge").and(page.locator('[data-state="tree"]'))).toHaveCount(6);
  await expect(page.getByTestId("stat-visited")).toContainText("7");
});

test("DFS shows its call stack", async ({ page }) => {
  await open(page, "/algorithms/dfs");
  await stepForward(page, 3);
  await expect(strip(page)).toContainText("call stack");
  await expect(strip(page)).toContainText("A");
});

test("Dijkstra starts at ∞ and finishes with every distance known", async ({ page }) => {
  await open(page, "/algorithms/dijkstra");
  const badges = page.getByTestId("node-badge");
  expect(await badges.allTextContents()).toEqual(Array(7).fill("∞"));
  await stepForward(page, 1);
  await expect(nodes(page).filter({ hasText: "A" }).getByTestId("node-badge")).toHaveText("0");
  await goToEnd(page);
  expect(await badges.allTextContents()).not.toContain("∞");
  await expect(lastRow(page)).toContainText("DONE");
});

test("New graph redraws the graph; node-count keys change its size", async ({ page }) => {
  await open(page, "/algorithms/bfs");
  const layout = () => nodes(page).evaluateAll((els) => els.map((e) => (e as HTMLElement).style.left).join());
  const before = await layout();
  await page.getByRole("button", { name: "New graph" }).click();
  await expect.poll(layout).not.toBe(before);
  await expect(scrubber(page)).toHaveValue("0");
  await page.getByRole("button", { name: "10 nodes" }).click();
  await expect(nodes(page)).toHaveCount(10);
  await expect(page.getByRole("button", { name: "10 nodes" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Edit custom array" })).toHaveCount(0); // graphs have no custom array
});

// ---------------------------------------------------------------- trees

test("BST insert grows the tree from nothing", async ({ page }) => {
  await open(page, "/algorithms/bst-insert");
  await expect(nodes(page)).toHaveCount(0);
  await stepForward(page, 1);
  await expect(nodes(page)).toHaveCount(1);
  await goToEnd(page);
  await expect(nodes(page)).toHaveCount(7);
  await expect(page.getByTestId("stat-height")).toContainText("3");
});

test("custom keys rebuild the tree", async ({ page }) => {
  await open(page, "/algorithms/bst-insert");
  await page.getByRole("button", { name: "Edit keys to insert" }).click();
  const box = page.getByRole("textbox", { name: "Keys to insert (comma separated)" });
  await box.fill("50, 30, 70, 30");
  await box.press("Enter");
  await goToEnd(page);
  await expect(nodes(page)).toHaveCount(3); // the duplicate 30 is skipped
  await expect(traceRows(page).filter({ hasText: "30 = 30" })).toHaveCount(1);
});

test("in-order traversal reads the keys out sorted", async ({ page }) => {
  await open(page, "/algorithms/tree-traversal");
  await expect(nodes(page)).toHaveCount(7);
  await goToEnd(page);
  await expect(strip(page)).toContainText("output");
  expect((await strip(page).locator("span span").allTextContents()).map(Number)).toEqual([1, 2, 3, 4, 5, 7, 8]);
});

// ---------------------------------------------------------------- a11y + layout per stage kind

for (const [slug, steps] of [["merge-sort", 30], ["binary-search", 3], ["dijkstra", 14], ["bst-insert", 12]] as const) {
  test(`axe: ${slug} mid-run`, async ({ page }) => {
    await open(page, `/algorithms/${slug}`);
    await stepForward(page, steps);
    await scan(page);
  });
}

test("graph and tree stages fit a phone without sideways scroll @responsive", async ({ page }) => {
  for (const slug of ["dijkstra", "bst-insert", "binary-search"]) {
    await open(page, `/algorithms/${slug}`);
    await page.getByRole("button", { name: /Step forward/ }).click();
    await expectNoHorizontalOverflow(page);
  }
});

test("bars stay one per value on the search stage", async ({ page }) => {
  await open(page, "/algorithms/linear-search");
  await expect(bars(page)).toHaveCount(7);
});
