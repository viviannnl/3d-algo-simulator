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
      <div className="flex-1 flex items-center justify-center bg-transparent">
        <p className="text-[var(--text-muted)] text-[13px] tracking-widest uppercase bp-blink">▍ initializing stage</p>
      </div>
    );
  }

  const n = view.dataNodes.length;
  const maxVal = Math.max(...view.dataNodes, 1);
  const action = derived?.action;
  const hasPair = view.activeNodes.length === 2;
  const lo = hasPair ? Math.min(...view.activeNodes) : -1;
  const hi = hasPair ? Math.max(...view.activeNodes) : -1;

  const activeColor = action === "swap" ? "var(--swap)" : action === "compare" ? "var(--compare)" : "var(--primary)";
  const activeDim = action === "swap" ? "var(--swap-dim)" : action === "compare" ? "var(--compare-dim)" : "var(--primary-dim)";
  const bracketLabel = action === "swap" ? "SWAP" : action === "compare" ? "CMP" : "";

  return (
    <div className="flex-1 min-h-0 relative overflow-hidden bp-dotgrid bg-transparent">
      <div className="absolute inset-0 pointer-events-none z-0" style={{ background: "var(--ambient-bleed-stage)" }} />

      <div className="absolute inset-0 flex flex-col px-10 pt-8 pb-6 z-10">
        <div className="flex items-center justify-between mb-4 text-[11px] tracking-widest uppercase">
          <span className="text-[var(--primary)] flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[var(--primary)] bp-pulse" style={{ boxShadow: "var(--glowing-pointer-glow)" }} />
            array[{n}] · sort trace
          </span>
          <span className="text-[var(--text-muted)]">max {maxVal} · idx 0–{n - 1}</span>
        </div>

        <div className="flex-1 min-h-0 flex">
          {/* value axis */}
          <div className="relative w-9 shrink-0 mr-2">
            {GRIDLINES.map((g) => (
              <div key={g} className="absolute right-1 -translate-y-1/2 text-[10px] text-[var(--text-muted)] tabular-nums" style={{ top: `${(1 - g) * 100}%` }}>
                {Math.round(maxVal * g)}
              </div>
            ))}
            <div className="absolute top-0 bottom-0 right-0 w-px bg-[var(--border-shell)]" />
          </div>

          {/* bars + gridlines */}
          <div className="relative flex-1 min-w-0">
            {GRIDLINES.map((g) => (
              <div key={g} className="absolute left-0 right-0 border-t border-dashed" style={{ top: `${(1 - g) * 100}%`, borderColor: "var(--grid-line)" }} />
            ))}
            <div className="absolute left-0 right-0 bottom-0 h-px bg-[var(--primary-line)]" />

            {hasPair && (
              <div className="absolute top-1 z-20 pointer-events-none" style={{ left: `${((lo + 0.5) / n) * 100}%`, width: `${((hi - lo) / n) * 100}%` }}>
                <div className="relative flex flex-col items-center">
                  <div className="px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase bp-pulse mb-1 whitespace-nowrap" style={{ color: activeColor, background: activeDim, border: `1px solid ${activeColor}` }}>
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

            <div className="absolute inset-0 flex items-end gap-[1.2%]">
              {view.dataNodes.map((val, idx) => {
                const isActive = view.activeNodes.includes(idx);
                const isSorted = view.sortedNodes.includes(idx);
                // Scale to 90% of the chart so the label always has headroom above
                // the tallest bar. Height is a pure function of value — no clamping.
                const heightPct = Math.max((val / maxVal) * 90, 5);

                let color = "var(--primary)";
                let dim = "var(--primary-dim)";
                let line = "var(--primary-line)";
                if (isActive) { color = activeColor; dim = activeDim; line = activeColor; }
                else if (isSorted) { color = "var(--sorted)"; dim = "var(--sorted-dim)"; line = "var(--sorted)"; }

                return (
                  <motion.div key={val} layout transition={{ type: "spring", stiffness: 520, damping: 34 }} className="relative flex-1 h-full">
                    {/* value label floats just above the bar top — never affects height */}
                    <motion.span layout="position" className="absolute left-0 right-0 text-center text-[13px] font-bold tabular-nums" style={{ bottom: `calc(${heightPct}% + 5px)`, color }}>{val}</motion.span>
                    {/* bar pinned to the baseline */}
                    <div className="absolute bottom-0 left-0 right-0 transition-colors" style={{
                      height: `${heightPct}%`,
                      background: `linear-gradient(to top, ${dim}, color-mix(in srgb, ${dim} 40%, transparent))`,
                      borderLeft: `1px solid ${line}`, borderRight: `1px solid ${line}`, borderTop: `2px solid ${color}`,
                      boxShadow: isActive ? `0 0 14px 0 ${color}` : "none",
                    }}>
                      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: color, opacity: 0.9 }} />
                      {isSorted && <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px]" style={{ color }}>▪</span>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* static index ruler */}
        <div className="flex mt-2 pl-11">
          <div className="flex-1 flex gap-[1.2%]">
            {view.dataNodes.map((_, idx) => {
              const isActive = view.activeNodes.includes(idx);
              const isSorted = view.sortedNodes.includes(idx);
              const col = isActive ? activeColor : isSorted ? "var(--sorted)" : "var(--text-muted)";
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <span className="w-px h-1.5" style={{ background: col, opacity: isActive ? 1 : 0.5 }} />
                  <span className="text-[10px] tabular-nums px-1" style={{ color: col, border: isActive ? `1px solid ${col}` : "1px solid transparent", background: isActive ? activeDim : "transparent" }}>{idx}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
