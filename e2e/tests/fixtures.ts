/**
 * Shared fixtures for the Algorithm Visualizer UI suite.
 *
 * Every test gets:
 *  - a seeded Math.random (shuffle is reproducible run to run),
 *  - strict console: any pageerror / console.error fails the test unless it
 *    calls allowConsoleErrors(testInfo),
 *  - JS coverage of the app's own chunks, written to .coverage/.
 *
 * There is no API to mock: all state is client-side and derived from the
 * algorithm trace, so fixed input + seeded randomness + a controlled clock
 * make every state reachable deterministically.
 */
import { test as base, expect, type Page, type TestInfo, type Locator } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const COVERAGE_DIR = path.join(here, "../.coverage");
const APP_SCRIPT = new RegExp(process.env.APP_SCRIPT_MATCH ?? "/_next/static/chunks/app/");

const earlier = new WeakMap<Page, any[]>();

/** Reload without losing the coverage collected so far. Use instead of page.reload(). */
export async function reload(page: Page) {
  earlier.get(page)?.push(...(await page.coverage.stopJSCoverage()));
  await page.coverage.startJSCoverage({ resetOnNavigation: false });
  await page.reload();
}

export function allowConsoleErrors(info: TestInfo) {
  info.annotations.push({ type: "allow-console-errors" });
}

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    // Seeded PRNG (mulberry32) so Shuffle produces the same arrays every run.
    await page.addInitScript(() => {
      let s = 0x2f6b9a1d;
      Math.random = () => {
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });
    await page.coverage.startJSCoverage({ resetOnNavigation: false });
    earlier.set(page, []);
    await use(page);
    const cov = [...(earlier.get(page) ?? []), ...(await page.coverage.stopJSCoverage())]
      .filter((e) => APP_SCRIPT.test(e.url) && !e.url.includes("node_modules"));
    if (cov.length) {
      fs.mkdirSync(COVERAGE_DIR, { recursive: true });
      const id = `${testInfo.project.name}-${testInfo.testId}`.replace(/[^a-z0-9-]/gi, "_");
      fs.writeFileSync(path.join(COVERAGE_DIR, `${id}.json`), JSON.stringify(cov));
    }
    if (!testInfo.annotations.some((a) => a.type === "allow-console-errors")) {
      expect(errors, "unexpected console errors").toEqual([]);
    }
  },
});

export { expect };

/** Load a page and wait until it is interactive (hydrated). */
export async function open(page: Page, url = "/") {
  await page.goto(url);
  if (new URL(page.url()).pathname.startsWith("/algorithms/")) { // "/" redirects into the first lesson
    await expect(scrubber(page)).toBeVisible();
    // hydrated once the keyboard hint's handlers are live: the scrubber is a React-controlled input
    await page.waitForFunction(() => {
      const el = document.querySelector('input[aria-label="Execution step scrubber"]') as any;
      return !!el && Object.keys(el).some((k) => k.startsWith("__react"));
    });
  } else {
    await page.locator("main").waitFor();
  }
  // Settle the CRT power-on (a one-shot CSS animation) so axe and screenshots see the final glass.
  // Looping animations (status LEDs) never finish, so only finite ones are awaited.
  await page.waitForFunction(() => document.getAnimations().every((a) =>
    a.playState !== "running" || a.effect?.getTiming().iterations === Infinity));
}

/** No element may make the page scroll sideways. */
export async function expectNoHorizontalOverflow(page: Page) {
  const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  expect(sw, "page scrolls horizontally").toBeLessThanOrEqual(iw);
}

// ---- App locators (what a user perceives) --------------------------------

export const sidebar = (page: Page) => page.getByRole("navigation", { name: "Course" });

export const scrubber = (page: Page) => page.getByRole("slider", { name: "Execution step scrubber" });
export const bars = (page: Page) => page.getByTestId("bar");
export const traceRows = (page: Page) => page.getByTestId("trace-row");
/** A rail counter by its label (each algorithm names its own: cmp, swap, write, probes, visited…). */
export const stat = (page: Page, name: string) => page.getByTestId(`stat-${name}`);

/** Values in left→right visual order (DOM order == array order). */
export const barValues = (page: Page) => bars(page).evaluateAll((els) => els.map((e) => Number((e as HTMLElement).dataset.value)));
/** Visual state of each bar: idle | compare | swap | sorted. */
export const barStates = (page: Page) => bars(page).evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.state));

export async function currentStep(page: Page) {
  return Number(await scrubber(page).inputValue());
}

/** Step forward n times with the keyboard (the way a user would). */
export async function stepForward(page: Page, n: number) {
  const start = await currentStep(page);
  for (let i = 0; i < n; i++) await page.keyboard.press("ArrowRight");
  await expect(scrubber(page)).toHaveValue(String(start + n));
}

/** Rendered bar heights in px, in visual order. */
export const barHeights = (page: Page) =>
  page.getByTestId("bar-body").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));

export type { Locator };
