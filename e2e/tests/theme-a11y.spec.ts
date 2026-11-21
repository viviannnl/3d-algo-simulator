import AxeBuilder from "@axe-core/playwright";
import { test, expect, open, scrubber, stepForward, sidebar, expectNoHorizontalOverflow } from "./fixtures";
import type { Page } from "@playwright/test";

const scan = async (page: Page) => {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(r.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length}× ${v.nodes[0].target}`)).toEqual([]);
};

// ---------------------------------------------------------------- theme

test("cream chassis theme regardless of the OS colour scheme", async ({ browser }) => {
  const bgs: string[] = [];
  for (const colorScheme of ["light", "dark"] as const) {
    const ctx = await browser.newContext({ colorScheme });
    const page = await ctx.newPage();
    for (const url of ["/", "/algorithms/bubble-sort"]) {
      await page.goto(url);
      bgs.push(await page.evaluate(() => getComputedStyle(document.body).backgroundColor));
    }
    await ctx.close();
  }
  expect(new Set(bgs)).toEqual(new Set(["rgb(242, 237, 226)"])); // --chassis
});

// ---------------------------------------------------------------- axe

test("axe: course sidebar with every chapter expanded @responsive", async ({ page }, testInfo) => {
  await open(page, "/");
  if (testInfo.project.name === "mobile") await page.getByRole("button", { name: "Course" }).click();
  for (const ch of ["Graphs", "Trees"]) await sidebar(page).getByRole("button", { name: new RegExp(ch) }).click();
  await scan(page);
});

test("axe: visualizer at rest @responsive", async ({ page }) => {
  await open(page, "/algorithms/bubble-sort");
  await scan(page);
});

test("axe: visualizer mid-compare and with custom input open", async ({ page }) => {
  await open(page, "/algorithms/quick-sort");
  await stepForward(page, 1);
  await scan(page);
  await page.getByRole("button", { name: "Edit custom array" }).click();
  await scan(page);
});

test("axe: visualizer finished", async ({ page }) => {
  await open(page, "/algorithms/selection-sort");
  await scrubber(page).fill((await scrubber(page).getAttribute("max"))!);
  await scan(page);
});

// ---------------------------------------------------------------- keyboard

/**
 * Tab through every focusable control; each one must look different when
 * focused than at rest (outline or box-shadow). Comparing against the
 * element's own rest style catches inline glows that mask the focus ring.
 * The range input is visually hidden by design — it has its own test below.
 */
async function tabWalk(page: Page) {
  const expected = await page.evaluate(() => {
    const els = [...document.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input, select, textarea")]
      .filter((e) => e.offsetParent !== null);
    const style = (e: HTMLElement) => { const c = getComputedStyle(e); return `${c.outlineStyle}|${c.outlineWidth}|${c.boxShadow}`; };
    (window as any).__rest = new Map(els.map((e) => [e, style(e)]));
    return els.length;
  });
  const seen = new Set<string>();
  const noRing: string[] = [];
  for (let i = 0; i < expected + 3; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      if (!el || el === document.body) return null;
      const c = getComputedStyle(el);
      const now = `${c.outlineStyle}|${c.outlineWidth}|${c.boxShadow}`;
      const label = `${el.tagName}|${(el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 40)}`;
      const ring = el.matches('input[type="range"]') || now !== (window as any).__rest.get(el);
      return { label, ring };
    });
    if (info) { seen.add(info.label); if (!info.ring) noRing.push(info.label); }
  }
  expect(noRing, "focused controls with no visible change").toEqual([]);
  expect(seen.size).toBeGreaterThanOrEqual(expected);
}

test("tab walk: lesson (sidebar + visualizer) — every control reachable with a visible focus ring", async ({ page }) => {
  await open(page, "/algorithms/bubble-sort");
  await tabWalk(page);
});

test("scrubber shows a visible focus indicator", async ({ page }) => {
  await open(page, "/algorithms/bubble-sort");
  const thumb = page.getByTestId("scrubber-thumb");
  const look = () => thumb.evaluate((e) => { const c = getComputedStyle(e); return `${c.outlineStyle}|${c.outlineWidth}|${c.boxShadow}`; });
  const rest = await look();
  // The scrubber is the next tab stop after the Custom button (the stage has none).
  await page.getByRole("button", { name: "Edit custom array" }).focus();
  await page.keyboard.press("Tab");
  await expect(scrubber(page)).toBeFocused();
  await expect.poll(look).not.toBe(rest);
});

// ---------------------------------------------------------------- interaction states

test("transport buttons: hover differs from rest, disabled is dimmed with not-allowed cursor", async ({ page }) => {
  await open(page, "/algorithms/bubble-sort");
  const fwd = page.getByRole("button", { name: /Step forward/ });
  const look = () => fwd.evaluate((e) => { const c = getComputedStyle(e); return `${c.borderColor}|${c.color}`; });
  const rest = await look();
  await fwd.hover();
  await expect.poll(look).not.toBe(rest);

  const back = page.getByRole("button", { name: /Step back/ });
  await expect(back).toBeDisabled();
  const s = await back.evaluate((e) => ({ cursor: getComputedStyle(e).cursor, opacity: Number(getComputedStyle(e).opacity) }));
  expect(s.cursor).toBe("not-allowed");
  expect(s.opacity).toBeLessThan(1);
});

test("reduced motion: transitions, pulses and the CRT power-on are switched off", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto("/algorithms/bubble-sort");
  await expect(page.getByRole("slider", { name: "Execution step scrubber" })).toBeVisible();
  const r = await page.evaluate(() => ({
    pulse: getComputedStyle(document.querySelector(".led-pulse")!).animationName,
    powerOn: getComputedStyle(document.querySelector(".crt-on")!).animationName,
    transition: parseFloat(getComputedStyle(document.querySelector("button")!).transitionDuration),
  }));
  expect(r.pulse).toBe("none");
  expect(r.powerOn).toBe("none");
  expect(r.transition).toBeLessThan(0.01);
  await ctx.close();
});

// ---------------------------------------------------------------- small screens

test("phone layout: stage is usable and telemetry is reachable @responsive", async ({ page }) => {
  await open(page, "/algorithms/bubble-sort");
  await expectNoHorizontalOverflow(page);
  const stageH = await page.getByTestId("bar").first().evaluate((e) => e.getBoundingClientRect().height);
  expect(stageH, "bar column height").toBeGreaterThan(180);
  await expect(page.getByRole("button", { name: "Play (space)" })).toBeInViewport();
  const rail = page.getByText("step trace", { exact: true });
  await rail.scrollIntoViewIfNeeded();
  await expect(rail).toBeInViewport();
});
