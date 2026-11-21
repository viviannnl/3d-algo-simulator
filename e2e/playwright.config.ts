import { defineConfig } from "@playwright/test";

/**
 * Algorithm Visualizer UI suite (ui-testing skill layout).
 *
 * The app is fully client-side (no API), so determinism comes from the
 * fixtures: Math.random is seeded (shuffle) and the clock is controlled in any
 * test that depends on timers (playback interval, catalog hero auto-play).
 * The server is the real production build.
 */
const PORT = Number(process.env.E2E_PORT ?? 8790);

// Every client component and lib module is bundled into the per-route chunks.
process.env.APP_SCRIPT_MATCH ??= "/_next/static/chunks/app/";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  // Capped: on an 8 GB machine already deep in swap, more Chrome workers made whole
  // runs 3-4x slower and a random test timed out inside browser.newContext().
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  expect: {
    // An absolute allowance, not a ratio: 0.2% of a tall full-page phone shot is ~5k pixels,
    // which let a changed logo word ("AlgoViz" → "Algorithm Visualizer") pass unnoticed.
    toHaveScreenshot: { maxDiffPixels: 60, animations: "disabled", caret: "hide" },
  },
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    channel: "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
    {
      name: "mobile",
      grep: /@responsive/,
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
    },
  ],
  webServer: {
    // Own distDir: a developer's `next dev` (writing to .next) must not corrupt the test build.
    command: `cd .. && export NEXT_DIST_DIR=.next-e2e && npm run build >/dev/null && npx next start -p ${PORT} -H 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: false,
    stdout: "ignore",
    stderr: "pipe",
    timeout: 240_000,
  },
});
