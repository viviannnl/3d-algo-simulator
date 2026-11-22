import {
  test, expect, open, bars, barValues, barStates, barHeights, stat, scrubber,
  traceRows, stepForward, sidebar, reload, expectNoHorizontalOverflow,
} from "./fixtures";
import type { Page } from "@playwright/test";

const INPUT = [5, 3, 8, 4, 2, 7, 1];

/** Per algorithm: which pair the very first compare looks at, and the pseudocode line it lights. */
const ALGOS = [
  { slug: "bubble-sort", name: "Bubble Sort", firstPair: [0, 1], compareLine: "if a[j] > a[j+1]:" },
  { slug: "insertion-sort", name: "Insertion Sort", firstPair: [0, 1], compareLine: "while j > 0 and a[j-1] > a[j]:" },
  { slug: "selection-sort", name: "Selection Sort", firstPair: [0, 1], compareLine: "if a[j] < a[min]: min = j" },
  { slug: "quick-sort", name: "Quick Sort", firstPair: [0, 6], compareLine: "if a[j] < pivot: swap(a[i++], a[j])" },
];

async function setCustom(page: Page, text: string) {
  await page.getByRole("button", { name: "Edit custom array" }).click();
  const box = page.getByRole("textbox", { name: "Custom array (comma separated)" });
  await box.fill(text);
  await box.press("Enter");
}

async function goToEnd(page: Page) {
  const max = await scrubber(page).getAttribute("max");
  await scrubber(page).fill(max!);
  await expect(scrubber(page)).toHaveValue(max!);
}

// ---------------------------------------------------------------- course (no landing page)

const COURSE = [
  "bubble-sort", "insertion-sort", "selection-sort", "quick-sort", "merge-sort", "heap-sort", "shell-sort",
  "linear-search", "binary-search", "bfs", "dfs", "dijkstra", "bst-insert", "tree-traversal",
];

const progress = (page: Page) => page.getByTestId("course-progress");

test.describe("course", () => {
  test("opening the app lands in the first lesson, at the top of the page @responsive", async ({ page }) => {
    await open(page, "/");
    await expect(page).toHaveURL(/\/algorithms\/bubble-sort$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bubble Sort");
    await expect(page.getByTestId("lesson-crumb")).toHaveText(/01\. Sorting\s*\/\s*Lesson 1 of 7/);
    // regression: the trace list used scrollIntoView, which scrolled the whole page down on phones
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await expectNoHorizontalOverflow(page);
  });

  test("sidebar lists every chapter; only implemented lessons are links, in course order", async ({ page }) => {
    await open(page, "/");
    for (const ch of ["Searching", "Graphs", "Trees"]) await sidebar(page).getByRole("button", { name: new RegExp(ch) }).click();
    const links = sidebar(page).locator('a[href^="/algorithms/"]');
    expect(await links.evaluateAll((as) => as.map((a) => a.getAttribute("href")))).toEqual(COURSE.map((slug) => `/algorithms/${slug}`));
    const soon = sidebar(page).locator('[aria-disabled="true"]');
    await expect(soon).toHaveCount(2);
    for (const item of await soon.all()) {
      await expect(item).toContainText("soon");
      expect(await item.locator("a").count()).toBe(0);
    }
  });

  test("the current lesson is marked and only its chapter starts open", async ({ page }) => {
    await open(page, "/algorithms/selection-sort");
    await expect(sidebar(page).locator('[aria-current="page"]')).toHaveText("Selection Sort");
    await expect(sidebar(page).getByRole("button", { name: /Sorting/ })).toHaveAttribute("aria-expanded", "true");
    await expect(sidebar(page).getByRole("button", { name: /Graphs/ })).toHaveAttribute("aria-expanded", "false");
    await sidebar(page).getByRole("button", { name: /Sorting/ }).click();
    await expect(sidebar(page).locator('a[href^="/algorithms/"]')).toHaveCount(0);
  });

  test("watching a lesson to the end completes it, and progress survives a reload", async ({ page }) => {
    await open(page, "/algorithms/bubble-sort");
    await expect(progress(page)).toContainText("0 / 14");
    await goToEnd(page);
    await expect(progress(page)).toContainText("1 / 14");
    await expect(sidebar(page).getByRole("button", { name: /Sorting/ })).toContainText("1/7");
    await reload(page);
    await expect(progress(page)).toContainText("1 / 14");
    await sidebar(page).getByRole("link", { name: /Insertion Sort/ }).click();
    await expect(sidebar(page).getByRole("link", { name: /Bubble Sort/ })).toContainText("(completed)");
  });

  test("corrupt or blocked storage never breaks the lesson", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("algoviz.av1.completed", "{not json"));
    await open(page, "/algorithms/bubble-sort");
    await expect(progress(page)).toContainText("0 / 14");
    await goToEnd(page); // writing must also be harmless
    await expect(page.getByRole("button", { name: "Replay" })).toBeVisible();
  });

  test("storage that throws is ignored", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); } });
    });
    await open(page, "/algorithms/bubble-sort");
    await expect(progress(page)).toContainText("0 / 14");
    await goToEnd(page);
    await expect(progress(page)).toContainText("0 / 14");
  });
});

// ---------------------------------------------------------------- visualizer frames

for (const algo of ALGOS) {
  test.describe(`visualizer · ${algo.name}`, () => {
    test("initial frame: raw input, nothing active, counters at zero", async ({ page }) => {
      await open(page, `/algorithms/${algo.slug}`);
      expect(await barValues(page)).toEqual(INPUT);
      expect(await barStates(page)).toEqual(INPUT.map(() => "idle"));
      await expect(scrubber(page)).toHaveValue("0");
      for (const s of ["cmp", "swap", "sorted"] as const) await expect(stat(page, s)).toContainText("0");
      await expect(page.getByRole("button", { name: /Step back/ })).toBeDisabled();
      await expect(page.getByText("Initial unsorted array.").first()).toBeVisible();
      await expect(page.locator('[data-testid="trace-row"][aria-current="step"]')).toContainText("INIT");
      await expect(page.getByTestId("pseudo-line").first()).toHaveAttribute("aria-current", "true");
    });

    test("compare frame: exactly the compared pair is highlighted and the right pseudocode line is lit", async ({ page }) => {
      await open(page, `/algorithms/${algo.slug}`);
      await stepForward(page, 1);
      const states = await barStates(page);
      const marked = states.flatMap((s, i) => (s === "compare" ? [i] : []));
      expect(marked).toEqual(algo.firstPair);
      expect(states.filter((s) => s !== "compare" && s !== "idle")).toEqual([]);
      const [a, b] = algo.firstPair.map((i) => INPUT[i]);
      await expect(page.getByText(`CMP ${a} ◇ ${b}`, { exact: true })).toBeVisible();
      await expect(stat(page, "cmp")).toContainText("1");
      await expect(page.locator('[data-testid="trace-row"][aria-current="step"]')).toContainText("CMP");
      await expect(page.locator('[data-testid="pseudo-line"][aria-current="true"]')).toContainText(algo.compareLine);
    });

    test("swap frame: two bars marked swap and the array actually changed", async ({ page }) => {
      await open(page, `/algorithms/${algo.slug}`);
      for (let i = 0; i < 40 && !(await barStates(page)).includes("swap"); i++) await page.keyboard.press("ArrowRight");
      expect((await barStates(page)).filter((s) => s === "swap")).toHaveLength(2);
      expect(await barValues(page)).not.toEqual(INPUT);
      await expect(stat(page, "swap")).toContainText("1");
      await expect(page.locator('[data-testid="trace-row"][aria-current="step"]')).toContainText("SWAP");
    });

    test("done frame: sorted ascending, every bar locked, replay offered @responsive", async ({ page }) => {
      await open(page, `/algorithms/${algo.slug}`);
      await goToEnd(page);
      expect(await barValues(page)).toEqual([...INPUT].sort((x, y) => x - y));
      expect(await barStates(page)).toEqual(INPUT.map(() => "sorted"));
      await expect(stat(page, "sorted")).toContainText(String(INPUT.length));
      await expect(page.getByRole("button", { name: "Replay" })).toBeVisible();
      await expect(page.getByRole("button", { name: /Step forward/ })).toBeDisabled();
      await expect(page.locator('[data-testid="trace-row"][aria-current="step"]')).toContainText("DONE");
    });
  });
}

// ---------------------------------------------------------------- edge cases

test.describe("visualizer edge cases", () => {
  test("bar height is proportional to value (81 vs 86 regression)", async ({ page }) => {
    await open(page, "/algorithms/bubble-sort");
    await setCustom(page, "81, 86, 40");
    expect(await barValues(page)).toEqual([81, 86, 40]);
    const [h81, h86, h40] = await barHeights(page);
    expect(h86 - h81, "86 must be visibly taller than 81").toBeGreaterThan(4);
    expect(h81 / h86).toBeCloseTo(81 / 86, 2);
    expect(h40 / h86).toBeCloseTo(40 / 86, 2);
  });

  test("value labels are never clipped above the stage", async ({ page }) => {
    await open(page, "/algorithms/bubble-sort");
    await setCustom(page, "99, 98, 97, 1");
    const clipped = await bars(page).evaluateAll((cols) =>
      cols.filter((c) => c.querySelector("span")!.getBoundingClientRect().top < c.getBoundingClientRect().top).length);
    expect(clipped).toBe(0);
  });

  test("the compare/swap chip never covers a bar's value label @responsive", async ({ page }) => {
    await open(page, "/algorithms/quick-sort"); // first compare spans the tallest bar (8)
    await stepForward(page, 1);
    const chip = await page.getByTestId("bracket-lane").locator("div.uppercase").boundingBox();
    const overlaps = await bars(page).evaluateAll((cols, c) => cols.filter((col) => {
      const r = col.querySelector("span")!.getBoundingClientRect();
      return r.left < c!.x + c!.width && r.right > c!.x && r.top < c!.y + c!.height && r.bottom > c!.y;
    }).length, chip);
    expect(overlaps).toBe(0);
  });

  test("two items sort", async ({ page }) => {
    await open(page, "/algorithms/bubble-sort");
    await setCustom(page, "2,1");
    await goToEnd(page);
    expect(await barValues(page)).toEqual([1, 2]);
  });

  test("16 three-digit values fit without sideways scroll or overlapping labels @responsive", async ({ page }) => {
    await open(page, "/algorithms/bubble-sort");
    const values = Array.from({ length: 16 }, (_, i) => 100 + ((i * 37) % 900));
    await setCustom(page, values.join(","));
    await expect(bars(page)).toHaveCount(16);
    await expectNoHorizontalOverflow(page);
    const overflowing = await bars(page).evaluateAll((cols) =>
      cols.filter((c) => { const s = c.querySelector("span")!; return s.scrollWidth > s.clientWidth + 1; }).length);
    expect(overflowing).toBe(0);
  });

  test("more than 16 values are capped at 16", async ({ page }) => {
    await open(page, "/algorithms/bubble-sort");
    await setCustom(page, Array.from({ length: 20 }, (_, i) => i + 1).join(","));
    await expect(bars(page)).toHaveCount(16);
  });

  test("duplicate values keep one bar each and sort correctly", async ({ page }) => {
    await open(page, "/algorithms/bubble-sort");
    await setCustom(page, "3,3,1");
    await expect(bars(page)).toHaveCount(3);
    expect(await barValues(page)).toEqual([3, 3, 1]);
    await goToEnd(page);
    await expect(bars(page)).toHaveCount(3);
    expect(await barValues(page)).toEqual([1, 3, 3]);
  });

  test("negative values sort and still render visible bars", async ({ page }) => {
    await open(page, "/algorithms/quick-sort");
    await setCustom(page, "-5, 3, -1, 0");
    await goToEnd(page);
    expect(await barValues(page)).toEqual([-5, -1, 0, 3]);
    for (const h of await barHeights(page)) expect(h).toBeGreaterThan(0);
  });

  test("huge numbers stay readable without sideways scroll", async ({ page }) => {
    await open(page, "/algorithms/bubble-sort");
    await setCustom(page, "1000000, 999999, 5");
    expect(await barValues(page)).toEqual([1000000, 999999, 5]);
    await expectNoHorizontalOverflow(page);
  });

  test("hostile text is never executed and leaves the array unchanged", async ({ page }) => {
    await open(page, "/algorithms/bubble-sort");
    await setCustom(page, `<img src=x onerror="window.__xss=1"><script>window.__xss=2</script>`);
    expect(await page.evaluate(() => (window as any).__xss)).toBeUndefined();
    expect(await barValues(page)).toEqual(INPUT);
    expect(await traceRows(page).count()).toBeGreaterThan(1);
  });
});
