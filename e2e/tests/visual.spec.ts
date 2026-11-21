import { test, expect, open, scrubber, stepForward } from "./fixtures";

test("course sidebar, every chapter expanded, one lesson completed", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("algoviz.av1.completed", JSON.stringify(["bubble-sort"])));
  await open(page, "/algorithms/insertion-sort");
  for (const ch of ["Graphs", "Trees"]) await page.getByRole("navigation", { name: "Course" }).getByRole("button", { name: new RegExp(ch) }).click();
  await page.mouse.move(0, 0);
  await expect(page.getByTestId("course-sidebar")).toHaveScreenshot("sidebar.png");
});

test("visualizer — initial frame @responsive", async ({ page }) => {
  await open(page, "/algorithms/bubble-sort");
  await page.mouse.move(0, 0);
  await expect(page).toHaveScreenshot("viz-initial.png", { fullPage: true });
});

test("visualizer — compare frame (quick sort, long bracket) @responsive", async ({ page }) => {
  await open(page, "/algorithms/quick-sort");
  await stepForward(page, 1);
  await page.mouse.move(0, 0);
  await expect(page).toHaveScreenshot("viz-compare.png", { fullPage: true });
});

test("visualizer — finished @responsive", async ({ page }) => {
  await open(page, "/algorithms/bubble-sort");
  await scrubber(page).fill((await scrubber(page).getAttribute("max"))!);
  await page.mouse.move(0, 0);
  await expect(page).toHaveScreenshot("viz-done.png", { fullPage: true });
});

test("telemetry rail panel at a swap frame", async ({ page }) => {
  await open(page, "/algorithms/bubble-sort");
  await stepForward(page, 2); // compare (0,1) → swap (0,1)
  await page.mouse.move(0, 0);
  await expect(page.getByTestId("telemetry-rail")).toHaveScreenshot("rail-swap.png");
});
