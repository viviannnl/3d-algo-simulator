import type { CSSProperties } from "react";

/**
 * How the stage was (re)entered:
 *  - intro:   first visit in this tab — the whole screen cascades in and the CRT boots
 *  - channel: moved to another lesson — the CRT changes channel, nothing else replays
 *  - retune:  new input (shuffle, custom, target, new graph) — a burst of static
 */
export type StageMode = "intro" | "channel" | "retune";

/**
 * First-visit timeline (ms). Loose on purpose: regions overlap, so it reads as one
 * movement settling into place rather than a queue of items appearing one by one.
 */
export const T = {
  topbar: 0,
  sidebar: 60,
  header: 140,
  stage: 220,
  rail: 320,
  boot: 380,
  transport: 440,
  picture: 820,
  bars: 920,
  trace: 760,
} as const;

/** Inline style carrying an animation delay for the `.enter*` / `.bar-rise` / … classes. */
export const at = (ms: number): CSSProperties => ({ ["--d" as string]: `${Math.round(ms)}ms` }) as CSSProperties;

/** Stagger index i from `base`, capped so long lists don't keep the user waiting. */
export const stagger = (base: number, i: number, step: number, cap = 10) => base + Math.min(i, cap) * step;

/** Bars / nodes start time for each stage mode. */
export const pictureStart = (mode: StageMode) => (mode === "intro" ? T.bars : mode === "channel" ? 200 : 60);
export const pictureStep = (mode: StageMode) => (mode === "intro" ? 40 : 22);

/** Has this tab already played the first-visit sequence? (module state: per page load) */
let entered = false;
export const hasEntered = () => entered;
export const markEntered = () => { entered = true; };
