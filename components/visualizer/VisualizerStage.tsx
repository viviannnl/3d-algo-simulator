"use client";

import { motion } from "framer-motion";
import type { StepView, DerivedStep } from "@/lib/viewModel";

interface Props {
  view?: StepView;
  derived?: DerivedStep;
}

const GRIDLINES = [1, 0.75, 0.5, 0.25];

export function VisualizerStage({ view, derived }: Props) {
  if (!view) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="label">warming up…</p>
      </div>
    );
  }

  const n = view.dataNodes.length;
  const maxVal = Math.max(...view.dataNodes, 1);
  const action = derived?.action;
  const hasPair = view.activeNodes.length === 2;
  const lo = hasPair ? Math.min(...view.activeNodes) : -1;
  const hi = hasPair ? Math.max(...view.activeNodes) : -1;
  const done = action === "done";

  const activeColor = action === "swap" ? "var(--swap)" : action === "compare" ? "var(--compare)" : "var(--phosphor)";
  const activeDim = action === "swap" ? "var(--swap-dim)" : action === "compare" ? "var(--compare-dim)" : "var(--idle-dim)";
  const bracketLabel = action === "swap" ? "SWAP" : action === "compare" ? "CMP" : "";

  return (
    <div className="flex-1 min-h-[380px] sm:min-h-[440px] lg:min-h-0 flex p-3 sm:p-5 lg:pr-3">
      <div className="bezel flex-1 flex min-w-0">
        <div className="glass glass-grid flex-1 min-w-0">
          {done && <div key="sweep" className="crt-sweep" aria-hidden="true" />}

          <div className="crt-on absolute inset-0 flex flex-col px-5 sm:px-8 pt-5 sm:pt-6 pb-4 z-10 font-mono">
            <div className="flex items-center justify-between mb-3 text-[10px] sm:text-[11px] tracking-[0.12em] uppercase">
              <span className="flex items-center gap-2 text-[var(--phosphor)] phosphor-text">
                <span className="led led-pulse bg-[var(--phosphor)] text-[var(--phosphor)] !shadow-[var(--glow-tight)]" />
                array[{n}] · sort trace
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

                <div className="absolute inset-0 flex items-end gap-[1.5%]">
                  {view.dataNodes.map((val, idx) => {
                    const isActive = view.activeNodes.includes(idx);
                    const isSorted = view.sortedNodes.includes(idx);
                    // Scale to 90% of the chart so the label always has headroom above
                    // the tallest bar. Height is a pure function of value — no clamping.
                    const heightPct = Math.max((val / maxVal) * 90, 5);

                    let color = "var(--idle)";
                    let dim = "var(--idle-dim)";
                    if (isActive) { color = activeColor; dim = activeDim; }
                    else if (isSorted) { color = "var(--sorted)"; dim = "var(--sorted-dim)"; }

                    return (
                      <motion.div key={view.ids[idx]} layout transition={{ type: "spring", stiffness: 520, damping: 34 }} className="relative flex-1 h-full"
                        style={{ containerType: "inline-size" }}
                        data-testid="bar" data-value={val} data-state={isActive ? (action === "swap" ? "swap" : "compare") : isSorted ? "sorted" : "idle"}>
                        {/* value label floats just above the bar top; font scales with the column (cqw) so narrow bars never overlap */}
                        <motion.span layout="position" className="absolute left-0 right-0 text-center font-medium tabular-nums whitespace-nowrap"
                          style={{ bottom: `calc(${heightPct}% + 6px)`, color, fontSize: "clamp(7px, 26cqw, 13px)", textShadow: "var(--glow-tight)" }}>{val}</motion.span>
                        {/* the beam: a slim column, not a slab */}
                        <div data-testid="bar-body" className="absolute bottom-0 left-[16%] right-[16%] rounded-t-[3px] transition-[background,box-shadow] duration-200" style={{
                          height: `${heightPct}%`,
                          background: `linear-gradient(to top, color-mix(in srgb, ${dim} 35%, transparent), ${dim})`,
                          boxShadow: `inset 1px 0 0 color-mix(in srgb, ${color} 50%, transparent), inset -1px 0 0 color-mix(in srgb, ${color} 50%, transparent)${isActive ? `, 0 0 26px -6px ${color}, 0 -6px 30px -10px ${color}` : ""}`,
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
                  const isActive = view.activeNodes.includes(idx);
                  const isSorted = view.sortedNodes.includes(idx);
                  const col = isActive ? activeColor : isSorted ? "var(--sorted)" : "var(--phosphor-dim)";
                  return (
                    <div key={idx} className="flex-1 flex justify-center">
                      <span className="text-[10px] tabular-nums px-1 rounded-[2px]" style={{ color: col, background: isActive ? activeDim : "transparent" }}>{idx}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
