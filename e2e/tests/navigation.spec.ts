import { test, expect, open, scrubber, sidebar } from "./fixtures";

const ALGOS = [
  { slug: "bubble-sort", name: "Bubble Sort", firstLine: "for i in 0 … n-1:" },
  { slug: "insertion-sort", name: "Insertion Sort", firstLine: "for i in 1 … n-1:" },
  { slug: "selection-sort", name: "Selection Sort", firstLine: "for i in 0 … n-1:" },
  { slug: "quick-sort", name: "Quick Sort", firstLine: "partition(lo, hi):" },
];

const title = (page: import("@playwright/test").Page) => page.getByRole("heading", { level: 1 });

for (const a of ALGOS) {
  test(`sidebar opens ${a.name} with its own pseudocode`, async ({ page }) => {
    await open(page, a.slug === "quick-sort" ? "/algorithms/bubble-sort" : "/algorithms/quick-sort");
    await sidebar(page).getByRole("link", { name: a.name }).click();
    await expect(page).toHaveURL(new RegExp(`/algorithms/${a.slug}$`));
    await expect(scrubber(page)).toHaveValue("0");
    await expect(title(page)).toHaveText(a.name);
    await expect(page.getByTestId("pseudo-line").first()).toContainText(a.firstLine);
    await expect(sidebar(page).locator('[aria-current="page"]')).toHaveText(a.name);
  });
}

test("deep link loads the right lesson directly", async ({ page }) => {
  await open(page, "/algorithms/quick-sort");
  await expect(title(page)).toHaveText("Quick Sort");
  await expect(page.getByTestId("lesson-crumb")).toContainText("Lesson 4 of 7");
  await expect(page.getByTestId("pseudo-line").first()).toContainText("partition(lo, hi):");
});

test("logo returns to the first lesson", async ({ page }) => {
  await open(page, "/algorithms/selection-sort");
  await page.getByRole("link", { name: /Algorithm Visualizer/ }).click();
  await expect(page).toHaveURL(/\/algorithms\/bubble-sort$/);
  await expect(title(page)).toHaveText("Bubble Sort");
});

test("browser back returns to the previous lesson", async ({ page }) => {
  await open(page, "/algorithms/bubble-sort");
  await sidebar(page).getByRole("link", { name: "Insertion Sort" }).click();
  await expect(page).toHaveURL(/insertion-sort$/);
  await page.goBack();
  await expect(title(page)).toHaveText("Bubble Sort");
});

test("next-lesson key moves through the course and lights up when the lesson is finished", async ({ page }) => {
  await open(page, "/algorithms/bubble-sort");
  const next = page.getByTestId("next-lesson");
  await expect(next).toContainText("Insertion Sort");
  const look = () => next.evaluate((e) => getComputedStyle(e).backgroundImage);
  const resting = await look();
  await scrubber(page).fill((await scrubber(page).getAttribute("max"))!);
  await expect.poll(look).not.toBe(resting);
  await next.click();
  await expect(page).toHaveURL(/insertion-sort$/);
  await expect(scrubber(page)).toHaveValue("0");
});

test("the last playable lesson has no next key", async ({ page }) => {
  await open(page, "/algorithms/tree-traversal");
  await expect(page.getByTestId("next-lesson")).toHaveCount(0);
});

test("switching lessons resets playback to step 0", async ({ page }) => {
  await open(page, "/algorithms/bubble-sort");
  for (let i = 0; i < 5; i++) await page.keyboard.press("ArrowRight");
  await expect(scrubber(page)).toHaveValue("5");
  await sidebar(page).getByRole("link", { name: "Quick Sort" }).click();
  await expect(page).toHaveURL(/quick-sort$/);
  await expect(scrubber(page)).toHaveValue("0");
  await expect(title(page)).toHaveText("Quick Sort");
});

test("on phones the course tree folds away behind a Course button @responsive", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "the fold only exists below the lg breakpoint");
  await open(page, "/algorithms/bubble-sort");
  const toggle = page.getByRole("button", { name: "Course" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(sidebar(page).getByRole("link", { name: "Insertion Sort" })).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await sidebar(page).getByRole("link", { name: "Insertion Sort" }).click();
  await expect(page).toHaveURL(/insertion-sort$/);
});

test("next-lesson key crosses chapters (last sort → first search)", async ({ page }) => {
  await open(page, "/algorithms/shell-sort");
  await page.getByTestId("next-lesson").click();
  await expect(page).toHaveURL(/linear-search$/);
  await expect(page.getByTestId("lesson-crumb")).toContainText("02. Searching");
  await expect(sidebar(page).getByRole("button", { name: /Searching/ })).toHaveAttribute("aria-expanded", "true");
});
