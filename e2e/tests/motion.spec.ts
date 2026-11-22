import { test, expect, open, sidebar, bars } from "./fixtures";
import type { Locator, Page } from "@playwright/test";

/** The start time (ms) an element's entrance is scheduled for. */
const delayOf = (l: Locator) => l.evaluate((e) => parseFloat(getComputedStyle(e).animationDelay) * 1000);
const animOf = (l: Locator) => l.evaluate((e) => getComputedStyle(e).animationName);

test.describe("first visit", () => {
  test("regions enter as one loose cascade: chrome, then the lesson, then the picture", async ({ page }) => {
    await page.goto("/algorithms/bubble-sort", { waitUntil: "commit" });
    await page.locator("[data-testid=bar-body]").first().waitFor({ state: "attached" });
    const order = {
      topbar: await delayOf(page.locator("header").first()),
      title: await delayOf(page.getByRole("heading", { level: 1 })),
      bezel: await delayOf(page.locator(".bezel").first()),
      rail: await delayOf(page.getByTestId("telemetry-rail")),
      transport: await delayOf(page.getByTestId("transport")),
      firstBar: await delayOf(page.getByTestId("bar-body").first()),
      lastBar: await delayOf(page.getByTestId("bar-body").last()),
    };
    expect(order.topbar).toBeLessThan(order.title);
    expect(order.title).toBeLessThan(order.bezel);
    expect(order.bezel).toBeLessThan(order.rail);
    expect(order.rail).toBeLessThan(order.transport);
    expect(order.transport).toBeLessThan(order.firstBar);
    expect(order.firstBar).toBeLessThan(order.lastBar); // bars rise left to right
    expect(order.lastBar).toBeLessThan(1600); // the whole sequence stays brisk
    await expect(page.getByTestId("crt-boot")).toBeAttached();
  });

  test("once settled, everything is fully shown and in place", async ({ page }) => {
    await open(page, "/algorithms/bubble-sort"); // open() waits for one-shot animations to finish
    for (const l of [page.locator("header").first(), page.getByRole("heading", { level: 1 }), page.locator(".bezel").first(), page.getByTestId("telemetry-rail"), page.getByTestId("bar-body").first()]) {
      // strictly none: a held end-transform (fill-mode both) keeps a compositor layer and
      // re-antialiases the text — that regression showed up as screenshot diffs
      expect(await l.evaluate((e) => [getComputedStyle(e).opacity, getComputedStyle(e).transform])).toEqual(["1", "none"]);
    }
    await expect(page.getByTestId("crt-boot")).toBeHidden();
  });

  test("the server HTML already shows the requested lesson (no flash of Bubble Sort)", async ({ request }) => {
    const html = await (await request.get("/algorithms/dijkstra")).text();
    expect(html).toMatch(/<h1[^>]*>Dijkstra<\/h1>/);
    expect(html).not.toMatch(/<h1[^>]*>Bubble Sort<\/h1>/);
  });
});

test.describe("after the first visit", () => {
  const settle = (page: Page) => page.waitForFunction(() => document.getAnimations().every((a) =>
    a.playState !== "running" || a.effect?.getTiming().iterations === Infinity));

  test("switching lessons changes channel instead of replaying the intro", async ({ page }) => {
    await open(page, "/algorithms/bubble-sort");
    await sidebar(page).getByRole("link", { name: "Insertion Sort" }).click();
    await expect(page).toHaveURL(/insertion-sort$/);
    await expect(page.getByTestId("crt-channel")).toContainText(/ch 01\.2 · Insertion Sort/i);
    await expect(page.getByTestId("crt-boot")).toHaveCount(0);
    expect(await page.locator("header").first().getAttribute("class")).not.toMatch(/\benter\b/);
    expect(await page.getByTestId("telemetry-rail").getAttribute("class")).not.toMatch(/enter-module/);
    await settle(page);
    await expect(page.getByTestId("crt-channel")).toBeHidden();
  });

  test("new input bursts static over the glass and the bars rise again", async ({ page }) => {
    await open(page, "/algorithms/bubble-sort");
    await page.getByRole("button", { name: "Shuffle input" }).click();
    await expect(page.getByTestId("crt-static")).toBeAttached();
    await expect(page.getByTestId("crt-channel")).toHaveCount(0);
    expect(await animOf(page.getByTestId("bar-body").first())).toBe("bar-rise");
    await settle(page);
    await expect(bars(page)).toHaveCount(7);
  });

  test("stepping through a lesson never replays an entrance", async ({ page }) => {
    await open(page, "/algorithms/bubble-sort");
    for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowRight");
    const running = await page.evaluate(() => document.getAnimations()
      .filter((a) => a.playState === "running" && a.effect?.getTiming().iterations !== Infinity)
      .map((a) => (a as CSSAnimation).animationName));
    expect(running.filter((n) => /enter|bar-rise|node-pop|crt-on|boot|channel|static/.test(n))).toEqual([]);
  });
});
