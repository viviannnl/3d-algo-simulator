import { test, expect, open, bars, barValues, scrubber, traceRows, stepForward, currentStep } from "./fixtures";
import type { Page } from "@playwright/test";

const INPUT = [5, 3, 8, 4, 2, 7, 1];
const URL = "/algorithms/bubble-sort";

/**
 * Freeze the fake clock so only runFor() advances timers (playback interval).
 * The installed clock keeps flowing until paused, so pause comfortably ahead of
 * the time we read (a +1 ms target is already in the past by the time it lands).
 */
async function freezeClock(page: Page) {
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 1000);
}

const stepBack = (page: Page) => page.getByRole("button", { name: /Step back/ });
const stepFwd = (page: Page) => page.getByRole("button", { name: /Step forward/ });

test.describe("transport", () => {
  test("step buttons move one frame each way", async ({ page }) => {
    await open(page, URL);
    await stepFwd(page).click();
    await stepFwd(page).click();
    await expect(scrubber(page)).toHaveValue("2");
    await stepBack(page).click();
    await expect(scrubber(page)).toHaveValue("1");
  });

  test("step buttons are disabled at the ends", async ({ page }) => {
    await open(page, URL);
    await expect(stepBack(page)).toBeDisabled();
    await expect(stepFwd(page)).toBeEnabled();
    const max = (await scrubber(page).getAttribute("max"))!;
    await scrubber(page).fill(max);
    await expect(stepFwd(page)).toBeDisabled();
    await expect(stepBack(page)).toBeEnabled();
  });

  test("play advances one frame per tick at 1×, pause stops it", async ({ page }) => {
    await page.clock.install();
    await open(page, URL);
    await freezeClock(page);
    await page.getByRole("button", { name: "Play (space)" }).click();
    await expect(page.getByRole("button", { name: "Pause (space)" })).toBeVisible();
    await page.clock.runFor(700 * 3);
    await expect(scrubber(page)).toHaveValue("3");
    await page.getByRole("button", { name: "Pause (space)" }).click();
    await page.clock.runFor(700 * 3);
    await expect(scrubber(page)).toHaveValue("3");
  });

  test("4× speed ticks four times as often", async ({ page }) => {
    await page.clock.install();
    await open(page, URL);
    await freezeClock(page);
    await page.getByRole("combobox", { name: "Playback speed" }).selectOption({ label: "4×" });
    await page.getByRole("button", { name: "Play (space)" }).click();
    await page.clock.runFor(180 * 5);
    await expect(scrubber(page)).toHaveValue("5");
  });

  test("playback stops at the end and Replay restarts from 0", async ({ page }) => {
    await page.clock.install();
    await open(page, URL);
    await freezeClock(page);
    const max = Number(await scrubber(page).getAttribute("max"));
    await scrubber(page).fill(String(max - 1));
    await page.getByRole("button", { name: "Play (space)" }).click();
    await page.clock.runFor(700 * 3);
    await expect(scrubber(page)).toHaveValue(String(max));
    await expect(page.getByRole("button", { name: "Replay" })).toBeVisible();
    await page.getByRole("button", { name: "Replay" }).click();
    await expect(scrubber(page)).toHaveValue("0");
    await expect(page.getByRole("button", { name: "Pause (space)" })).toBeVisible();
  });

  test("scrubber jumps straight to a frame", async ({ page }) => {
    await open(page, URL);
    await scrubber(page).fill("10");
    await expect(scrubber(page)).toHaveValue("10");
    await expect(page.locator('[data-testid="trace-row"][aria-current="step"]')).toHaveAccessibleName(/Jump to step 10:/);
  });
});

test.describe("step trace", () => {
  test("clicking a row jumps to that step", async ({ page }) => {
    await open(page, URL);
    await page.getByRole("button", { name: /^Jump to step 6:/ }).click();
    await expect(scrubber(page)).toHaveValue("6");
    await expect(traceRows(page).nth(6)).toHaveAttribute("aria-current", "step");
    await expect(page.locator('[data-testid="trace-row"][aria-current="step"]')).toHaveCount(1);
  });

  test("the current row scrolls into view as playback moves past the fold", async ({ page }) => {
    await open(page, URL);
    const max = (await scrubber(page).getAttribute("max"))!;
    await scrubber(page).fill(max);
    await expect(page.locator('[data-testid="trace-row"][aria-current="step"]')).toBeInViewport();
  });
});

test.describe("keyboard shortcuts", () => {
  test("← / → step", async ({ page }) => {
    await open(page, URL);
    await stepForward(page, 3);
    await page.keyboard.press("ArrowLeft");
    await expect(scrubber(page)).toHaveValue("2");
  });

  test("space toggles play / pause", async ({ page }) => {
    await page.clock.install();
    await open(page, URL);
    await freezeClock(page);
    await page.keyboard.press(" ");
    await expect(page.getByRole("button", { name: "Pause (space)" })).toBeVisible();
    await page.keyboard.press(" ");
    await expect(page.getByRole("button", { name: "Play (space)" })).toBeVisible();
  });

  test("space after clicking a transport button only toggles playback once", async ({ page }) => {
    await page.clock.install();
    await open(page, URL);
    await freezeClock(page);
    await stepFwd(page).click(); // focus now sits on Step Forward
    await page.keyboard.press(" ");
    await expect(page.getByRole("button", { name: "Pause (space)" })).toBeVisible();
    await expect(scrubber(page)).toHaveValue("1"); // Step Forward was NOT also activated
  });

  test("space still plays after using the scrubber", async ({ page }) => {
    await page.clock.install();
    await open(page, URL);
    await freezeClock(page);
    await scrubber(page).focus();
    await page.keyboard.press(" ");
    await expect(page.getByRole("button", { name: "Pause (space)" })).toBeVisible();
  });

  test("arrow keys on the focused scrubber move exactly one step", async ({ page }) => {
    await open(page, URL);
    await scrubber(page).focus();
    await page.keyboard.press("ArrowRight");
    await expect(scrubber(page)).toHaveValue("1");
    await page.keyboard.press("ArrowRight");
    await expect(scrubber(page)).toHaveValue("2");
    await page.keyboard.press("ArrowLeft");
    await expect(scrubber(page)).toHaveValue("1");
  });

  test("s shuffles", async ({ page }) => {
    await open(page, URL);
    await page.keyboard.press("s");
    await expect.poll(() => barValues(page)).not.toEqual(INPUT);
    const values = await barValues(page);
    expect(values).toHaveLength(INPUT.length);
    expect(new Set(values).size).toBe(values.length);
  });

  test("shortcuts are ignored while typing a custom array", async ({ page }) => {
    await open(page, URL);
    await page.getByRole("button", { name: "Edit custom array" }).click();
    const box = page.getByRole("textbox", { name: "Custom array (comma separated)" });
    await box.press("ArrowRight");
    await box.press("s");
    await expect(scrubber(page)).toHaveValue("0");
    expect(await barValues(page)).toEqual(INPUT);
  });
});

test.describe("input controls", () => {
  test("shuffle makes a new distinct array of the same size and rewinds", async ({ page }) => {
    await open(page, URL);
    await stepForward(page, 4);
    await page.getByRole("button", { name: "Shuffle input" }).click();
    await expect(scrubber(page)).toHaveValue("0");
    const values = await barValues(page);
    expect(values).not.toEqual(INPUT);
    expect(new Set(values).size).toBe(INPUT.length);
  });

  test("size toggles set the array length and exactly one is pressed", async ({ page }) => {
    await open(page, URL);
    for (const n of [6, 8, 10, 12]) {
      const btn = page.getByRole("button", { name: `${n} elements` });
      await btn.click();
      await expect(bars(page)).toHaveCount(n);
      await expect(btn).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator('[aria-pressed="true"]')).toHaveCount(1);
    }
  });

  test("custom: Enter commits, the trace regenerates from step 0", async ({ page }) => {
    await open(page, URL);
    await stepForward(page, 2);
    await page.getByRole("button", { name: "Edit custom array" }).click();
    const box = page.getByRole("textbox", { name: "Custom array (comma separated)" });
    await expect(box).toBeFocused();
    await expect(box).toHaveValue(INPUT.join(", "));
    await box.fill("9 2 7");
    await box.press("Enter");
    expect(await barValues(page)).toEqual([9, 2, 7]);
    await expect(scrubber(page)).toHaveValue("0");
    await expect(box).toHaveCount(0);
  });

  test("custom: Escape cancels without changing the array", async ({ page }) => {
    await open(page, URL);
    await page.getByRole("button", { name: "Edit custom array" }).click();
    const box = page.getByRole("textbox", { name: "Custom array (comma separated)" });
    await box.fill("1,2,3");
    await box.press("Escape");
    await expect(box).toHaveCount(0);
    expect(await barValues(page)).toEqual(INPUT);
  });

  test("custom: clicking away commits", async ({ page }) => {
    await open(page, URL);
    await page.getByRole("button", { name: "Edit custom array" }).click();
    await page.getByRole("textbox", { name: "Custom array (comma separated)" }).fill("4,1");
    await page.locator("body").click({ position: { x: 5, y: 300 } });
    expect(await barValues(page)).toEqual([4, 1]);
  });

  test("custom: fewer than two numbers is rejected, previous array kept", async ({ page }) => {
    await open(page, URL);
    await page.getByRole("button", { name: "Edit custom array" }).click();
    const box = page.getByRole("textbox", { name: "Custom array (comma separated)" });
    await box.fill("42");
    await box.press("Enter");
    expect(await barValues(page)).toEqual(INPUT);
    expect(await currentStep(page)).toBe(0);
  });
});
