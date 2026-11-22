"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { ArrayView, DerivedStep } from "@/lib/types";
import { Strip } from "./NetworkStage";
import { CrtTransition, pictureOpens } from "./CrtTransition";
import { T, at, pictureStart, pictureStep, stagger, type StageMode } from "@/lib/motion";

interface Props {
  view?: ArrayView;
  derived?: DerivedStep;
  title?: string;
  /** identity of what is on the glass; a change replays the stage transition */
  stageKey?: string;
  mode?: StageMode;
  channel?: string;
}

const GRIDLINES = [1, 0.75, 0.5, 0.25];

export function VisualizerStage({ view, derived, title = "sort trace", stageKey = "", mode = "retune", channel = "" }: Props) {
  // The rise-in classes come off once this input's entrance has finished: a swap moves a
  // bar's DOM node, and Chrome restarts CSS animations on moved nodes — the bar would regrow.
  const [risenKey, setRisenKey] = useState("");
  const rising = risenKey !== stageKey;
  if (!view) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="label">warming up…</p>
      </div>
    );
  }

  const n = view.dataNodes.length;
  const target = view.target;
  // searches scale to the target too, so its line always lands on the glass
  const maxVal = Math.max(...view.dataNodes, target ?? 1, 1);
  const action = derived?.action;
  const range = view.range;
  const targetPct = target !== undefined && target >= 0 ? (target / maxVal) * 90 : undefined;
  const hasPair = view.activeNodes.length === 2;
  const lo = hasPair ? Math.min(...view.activeNodes) : -1;
  const hi = hasPair ? Math.max(...view.activeNodes) : -1;
  const done = action === "done" || action === "found";

  const activeColor = action === "swap" ? "var(--swap)" : action === "compare" ? "var(--compare)" : "var(--phosphor)";
  const activeDim = action === "swap" ? "var(--swap-dim)" : action === "compare" ? "var(--compare-dim)" : "var(--idle-dim)";
  const bracketLabel = action === "swap" ? "SWAP" : action === "compare" ? "CMP" : "";

  return (
    <div className="flex-1 min-h-[380px] sm:min-h-[440px] lg:min-h-0 flex p-3 sm:p-5 lg:pr-3">
      <div className={`bezel flex-1 flex min-w-0 ${mode === "intro" ? "enter-module" : ""}`} style={at(T.stage)}>
        <div className="glass glass-grid flex-1 min-w-0">
          {done && <div key="sweep" className="crt-sweep" aria-hidden="true" />}
          <CrtTransition key={`t-${stageKey}`} mode={mode} channel={channel} />

          <div key={stageKey} className={`${mode === "retune" ? "" : "crt-on"} absolute inset-0 flex flex-col px-5 sm:px-8 pt-5 sm:pt-6 pb-4 z-10 font-mono`} style={at(pictureOpens(mode))}>
            <div className="flex items-center justify-between mb-3 text-[10px] sm:text-[11px] tracking-[0.12em] uppercase">
              <span className="flex items-center gap-2 text-[var(--phosphor)] phosphor-text">
                <span className="led led-pulse bg-[var(--phosphor)] text-[var(--phosphor)] !shadow-[var(--glow-tight)]" />
                array[{n}] · {title}
              </span>
              <span className="text-[var(--phosphor-dim)]">max {maxVal} · idx 0–{n - 1}</span>
            </div>

            {/* bracket lane — its own row (aligned with the bars via ml-10 = axis width),
                so the compare/swap chip never covers the tallest bar's value label */}
            <div data-testid="bracket-lane" className="relative h-8 shrink-0 ml-10">
              {hasPair && (
                <div className="absolute top-0 z-20 pointer-events-none" style={{ left: `${((lo + 0.5) / n) * 100}%`, width: `${((hi - lo) / n) * 100}%` }}>
                  <div className="relative flex flex-col items-center">
                    <div className="px-2 py-[1px] mb-1 rounded-[3px] text-[10px] font-semibold tracking-[0.12em] uppercase whitespace-nowrap"
                      style={{ color: activeColor, background: activeDim, border: `1px solid ${activeColor}`, textShadow: "var(--glow-tight)" }}>
                      {bracketLabel} {derived?.values ? `${derived.values[0]} ${action === "swap" ? "⇄" : "◇"} ${derived.values[1]}` : ""}
                    </div>
                    <div className="w-full border-t border-dashed" style={{ borderColor: activeColor }} />
                    <div className="flex justify-between w-full">
                      <span className="w-px h-2" style={{ background: activeColor }} />
                      <span className="w-px h-2" style={{ background: activeColor }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 min-h-0 flex">
              {/* value axis */}
              <div className="relative w-8 shrink-0 mr-2">
                {GRIDLINES.map((g) => (
                  <div key={g} className="absolute right-1 -translate-y-1/2 text-[10px] text-[var(--phosphor-dim)] tabular-nums" style={{ top: `${(1 - g) * 100}%` }}>
                    {Math.round(maxVal * g)}
                  </div>
                ))}
              </div>

              {/* bars + gridlines */}
              <div className="relative flex-1 min-w-0">
                {GRIDLINES.map((g) => (
                  <div key={g} className="absolute left-0 right-0 border-t border-dashed" style={{ top: `${(1 - g) * 100}%`, borderColor: "var(--phosphor-grid)" }} />
                ))}
                <div className="absolute left-0 right-0 bottom-0 h-px bg-[var(--phosphor-line)]" />
                {targetPct !== undefined && (
                  <div data-testid="target-line" className="absolute left-0 right-0 z-20 pointer-events-none border-t border-dashed border-[var(--signal)]" style={{ bottom: `${targetPct}%` }}>
                    <span className="absolute left-0 -top-[18px] px-1.5 rounded-[3px] bg-[var(--glass)] text-[10px] tracking-[0.12em] uppercase text-[var(--signal-hi)]">target {target}</span>
                  </div>
                )}

                <div className="absolute inset-0 flex items-end gap-[1.5%]">
                  {view.dataNodes.map((val, idx) => {
                    const isActive = view.activeNodes.includes(idx);
                    const isFocus = view.focus === idx;
                    const isFound = view.found === idx;
                    const isSorted = view.sortedNodes.includes(idx) || isFound;
                    const outside = range !== undefined && (idx < range[0] || idx > range[1]);
                    // Scale to 90% of the chart so the label always has headroom above
                    // the tallest bar. Height is a pure function of value — no clamping.
                    const heightPct = Math.max((val / maxVal) * 90, 5);

                    let color = "var(--idle)";
                    let dim = "var(--idle-dim)";
                    if (isActive) { color = activeColor; dim = activeDim; }
                    else if (isFocus && action === "write") { color = "var(--swap)"; dim = "var(--swap-dim)"; }
                    else if (isFocus && !isFound) { color = "var(--compare)"; dim = "var(--compare-dim)"; }
                    else if (isSorted) { color = "var(--sorted)"; dim = "var(--sorted-dim)"; }
                    const lit = isActive || isFocus;
                    const state = isActive ? (action === "swap" ? "swap" : "compare") : isFound ? "found" : isFocus ? (action === "write" ? "write" : "probe") : isSorted ? "sorted" : outside ? "out" : "idle";

                    return (
                      <motion.div key={view.ids[idx]} layout transition={{ type: "spring", stiffness: 520, damping: 34 }} className="relative flex-1 h-full transition-opacity duration-200"
                        style={{ containerType: "inline-size", opacity: outside ? 0.28 : 1 }}
                        data-testid="bar" data-value={val} data-state={state}>
                        {/* value label floats just above the bar top; font scales with the column (cqw) so narrow bars never overlap */}
                        <motion.span layout="position"
                          // the last label is the last thing to settle — then the entrance is over for this input
                          onAnimationEnd={idx === n - 1 ? (e) => { if (e.animationName === "fade-up") setRisenKey(stageKey); } : undefined}
                          className={`${rising ? "fade-up" : ""} absolute left-0 right-0 text-center font-medium tabular-nums whitespace-nowrap`}
                          style={{ ...(at(stagger(pictureStart(mode), idx, pictureStep(mode), 12) + 220) as object), bottom: `calc(${heightPct}% + 6px)`, color, fontSize: "clamp(7px, 26cqw, 13px)", textShadow: "var(--glow-tight)" }}>{val}</motion.span>
                        {/* the beam: a slim column, not a slab */}
                        <div data-testid="bar-body" className={`${rising ? "bar-rise" : ""} absolute bottom-0 left-[16%] right-[16%] rounded-t-[3px] transition-[background,box-shadow] duration-200`} style={{
                          ...at(stagger(pictureStart(mode), idx, pictureStep(mode), 12)),
                          height: `${heightPct}%`,
                          background: `linear-gradient(to top, color-mix(in srgb, ${dim} 35%, transparent), ${dim})`,
                          boxShadow: `inset 1px 0 0 color-mix(in srgb, ${color} 50%, transparent), inset -1px 0 0 color-mix(in srgb, ${color} 50%, transparent)${lit ? `, 0 0 26px -6px ${color}, 0 -6px 30px -10px ${color}` : ""}`,
                        }}>
                          {/* the lit edge of the beam — tight glow, no wide halo */}
                          <div className="absolute -top-px left-0 right-0 h-[2px] rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* static index ruler */}
            <div className="flex mt-2 pl-10">
              <div className="flex-1 flex gap-[1.5%]">
                {view.dataNodes.map((_, idx) => {
                  const isActive = view.activeNodes.includes(idx) || view.focus === idx;
                  const isSorted = view.sortedNodes.includes(idx) || view.found === idx;
                  const col = isActive ? (view.activeNodes.length ? activeColor : "var(--compare)") : isSorted ? "var(--sorted)" : "var(--phosphor-dim)";
                  return (
                    <div key={idx} className="flex-1 flex justify-center">
                      <span className="text-[10px] tabular-nums px-1 rounded-[2px]" style={{ color: col, background: isActive ? activeDim : "transparent" }}>{idx}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {view.buffer && <div className="mt-2"><Strip label="buffer" items={view.buffer.map(String)} testId="merge-buffer" /></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
