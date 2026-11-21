import { describe, it, expect, beforeEach } from "vitest";
import { useVisualizer } from "@/lib/store";

const get = () => useVisualizer.getState();

describe("playback store", () => {
  beforeEach(() => get().load("bubble-sort"));

  it("loads a known algorithm with a consistent view/step count", () => {
    const s = get();
    expect(s.algo.slug).toBe("bubble-sort");
    expect(s.totalSteps).toBeGreaterThan(0);
    expect(s.views.length).toBe(s.totalSteps + 1);
    expect(s.derived.length).toBe(s.views.length);
    expect(s.currentStep).toBe(0);
  });

  it("loads other implemented algorithms", () => {
    for (const slug of ["insertion-sort", "selection-sort", "quick-sort"]) {
      get().load(slug);
      expect(get().algo.slug).toBe(slug);
      expect(get().totalSteps).toBeGreaterThan(0);
    }
  });

  it("falls back to bubble sort for an unknown slug", () => {
    get().load("does-not-exist");
    expect(get().algo.slug).toBe("bubble-sort");
  });

  it("shuffle produces n distinct values and resets playback", () => {
    get().shuffle(8);
    const s = get();
    expect(s.input).toHaveLength(8);
    expect(new Set(s.input).size).toBe(8);
    expect(s.currentStep).toBe(0);
    expect(s.isPlaying).toBe(false);
  });

  it("setInput rebuilds the trace and rejects fewer than 2 values", () => {
    get().setInput([3, 1, 2]);
    expect(get().input).toEqual([3, 1, 2]);
    const before = get().input;
    get().setInput([5]);
    expect(get().input).toBe(before); // unchanged
  });

  it("step controls clamp at both ends", () => {
    get().scrub(0);
    get().stepBack();
    expect(get().currentStep).toBe(0);
    const total = get().totalSteps;
    get().scrub(total);
    get().stepForward();
    expect(get().currentStep).toBe(total);
  });

  it("play resets at the end, tick advances, pause stops", () => {
    get().scrub(get().totalSteps);
    get().play();
    expect(get().currentStep).toBe(0);
    expect(get().isPlaying).toBe(true);
    get().tick();
    expect(get().currentStep).toBe(1);
    get().pause();
    expect(get().isPlaying).toBe(false);
  });
});
