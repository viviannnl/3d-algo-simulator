"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ACTION_META } from "@/lib/viewModel";
import type { DerivedStep, LegendItem, StatDef } from "@/lib/types";
import { T, at, stagger } from "@/lib/motion";

interface Props {
  trace: DerivedStep[];
  current: number;
  time: string;
  space: string;
  pseudocode: string[];
  stats: StatDef[];
  legend: LegendItem[];
  onSelect: (step: number) => void;
  intro?: boolean;
  /** changes with the lesson/input; the trace list fades in fresh when it does */
  traceKey?: string;
}

function Stat({ label, value, led }: { label: string; value: ReactNode; led: string }) {
  return (
    <div data-testid={`stat-${label.toLowerCase()}`} className="px-3 py-3 border-r border-[var(--seam)] last:border-r-0">
      <div className="label flex items-center gap-1.5 mb-1">
        <span className="led" style={{ background: led }} />{label}
      </div>
      <div className="font-display text-[34px] leading-[1] tabular-nums text-[var(--ink)]">{value}</div>
    </div>
  );
}

function Legend({ c, t }: { c: string; t: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="led" style={{ background: c }} />
      <span>{t}</span>
    </span>
  );
}

export function TelemetryRail({ trace, current, time, space, pseudocode, stats, legend, onSelect, intro = false, traceKey }: Props) {
  // first visit: the module rises, then its sections settle in top to bottom
  // only the very first trace list cascades; a shuffle mid-intro just fades the new one in
  const firstTrace = useRef(traceKey);
  const introRows = intro && traceKey === firstTrace.current;
  const sec = (i: number) => (intro ? { className: "enter", style: at(stagger(T.rail + 100, i, 60)) } : { className: "", style: undefined });
  const cur = trace[current];
  const rowRef = useRef<HTMLButtonElement | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);

  // Keep the current row visible by scrolling the list only. scrollIntoView would also
  // scroll the page, which on phones jumped the whole lesson down to the trace on load.
  useEffect(() => {
    const row = rowRef.current, list = listRef.current;
    if (!row || !list) return;
    const top = row.offsetTop; // the list is position:relative, so this is relative to it
    if (top < list.scrollTop) list.scrollTop = top;
    else if (top + row.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = top + row.offsetHeight - list.clientHeight;
  }, [current]);

  const meta = ACTION_META[cur?.action ?? "init"];

  return (
    <aside data-testid="telemetry-rail" style={at(T.rail)}
      className={`w-auto lg:w-[360px] shrink-0 mx-3 mb-4 sm:mx-5 lg:ml-2 lg:mt-5 lg:mb-5 flex flex-col min-h-0 relative z-20 rounded-[var(--radius-card)] bg-[var(--chassis-raised)] border border-[var(--seam)] shadow-[var(--shadow-card)] overflow-hidden ${intro ? "enter-module" : ""}`}>
      <div className={`shrink-0 flex items-center justify-between px-4 h-11 border-b border-[var(--seam)] ${sec(0).className}`} style={sec(0).style}>
        <span className="font-display text-[20px] leading-none text-[var(--ink)]">Telemetry</span>
        <span className="label px-2 py-[3px] rounded-[4px] bg-[var(--chassis-sunk)] shadow-[var(--shadow-tray)] !text-[var(--ink-2)]">pass {cur?.pass ?? 1}</span>
      </div>

      <div className={`shrink-0 grid border-b border-[var(--seam)] ${sec(1).className}`} style={{ ...sec(1).style, gridTemplateColumns: `repeat(${stats.length + 1}, minmax(0, 1fr))` }}>
        <Stat label="Step" led="var(--signal)" value={<>{current}<span className="text-[var(--ink-3)] text-[15px] font-sans">/{trace.length - 1}</span></>} />
        {stats.map((d) => <Stat key={d.key} label={d.label} led={d.led} value={cur?.stats[d.key] ?? 0} />)}
      </div>

      <dl className={`shrink-0 px-4 py-2.5 border-b border-[var(--seam)] text-[12px] ${sec(2).className}`} style={sec(2).style}>
        {([["Time", time], ["Space", space]] as const).map(([label, val]) => (
          <div key={label} className="flex items-baseline gap-2 py-[3px]">
            <dt className="label">{label}</dt>
            <span aria-hidden="true" className="flex-1 border-b border-dotted border-[var(--seam-strong)] translate-y-[-3px]" />
            <dd className="font-mono font-medium text-[var(--ink)]">{val || "—"}</dd>
          </div>
        ))}
      </dl>

      <div className={`shrink-0 px-4 py-3 border-b border-[var(--seam)] ${sec(3).className}`} style={sec(3).style}>
        <div className="label mb-2">pseudocode</div>
        <div className="glass !rounded-[12px] py-2.5 font-mono overflow-x-auto scroll-quiet">
          {pseudocode.map((line, idx) => {
            const active = cur?.line === idx;
            return (
              <div key={idx} data-testid="pseudo-line" aria-current={active ? "true" : undefined}
                className="relative z-10 flex items-center text-[12px] leading-[1.75] pr-2 min-w-max"
                style={{ background: active ? "var(--phosphor-faint)" : "transparent" }}>
                <span className="w-5 shrink-0 text-center select-none" style={{ color: "var(--phosphor-hot)" }} aria-hidden="true">{active ? "▸" : ""}</span>
                <span className="w-5 shrink-0 text-right pr-2 text-[var(--phosphor-dim)] select-none tabular-nums">{idx + 1}</span>
                <span className="whitespace-pre" style={{ color: active ? "var(--phosphor-hot)" : "var(--phosphor-dim)", textShadow: active ? "var(--glow-tight)" : "none" }}>{line}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className={`shrink-0 px-4 py-3 border-b border-[var(--seam)] ${sec(4).className}`} style={sec(4).style}>
        <div className="label mb-2">execution log</div>
        <div className="flex gap-2.5 text-[13px] text-[var(--ink)] leading-relaxed min-h-[44px]">
          <span className="font-mono font-semibold text-[11px] tracking-[0.06em] pt-[2px] shrink-0" style={{ color: meta.color }}>{meta.glyph} {meta.label}</span>
          <span>{cur?.note}</span>
        </div>
      </div>

      <div className={`label flex items-center justify-between px-4 h-9 border-b border-[var(--seam)] shrink-0 ${sec(5).className}`} style={sec(5).style}>
        <span>step trace</span>
        <span className="flex items-center gap-3">
          {legend.map((l) => <Legend key={l.label} c={l.color} t={l.label} />)}
        </span>
      </div>
      <div ref={listRef} key={traceKey} className="fade-in relative flex-1 min-h-[160px] max-h-[50vh] lg:max-h-none overflow-y-auto scroll-quiet font-mono">
        {trace.map((t) => {
          const isCur = t.index === current;
          const m = ACTION_META[t.action];
          return (
            <button key={t.index} ref={isCur ? rowRef : undefined} onClick={() => onSelect(t.index)}
              style={{ ...(introRows && t.index < 10 ? at(stagger(T.trace, t.index, 35)) : {}), background: isCur ? "var(--chassis-sunk)" : undefined }}
              data-testid="trace-row" aria-current={isCur ? "step" : undefined} aria-label={`Jump to step ${t.index}: ${m.label}`}
              className={`${introRows && t.index < 10 ? "enter" : ""} relative w-full flex items-center gap-2 px-4 py-[7px] text-left text-[11px] border-b border-[var(--seam)] last:border-b-0 transition-colors duration-150 hover:bg-[var(--chassis)] focus-visible:outline-offset-[-2px]`}
              >
              {isCur && <span aria-hidden="true" className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r bg-[var(--signal)]" />}
              {/* the current row sits on the sunk tint, where ink-3 would drop below AA — use ink-2 */}
              <span className="w-7 tabular-nums shrink-0" style={{ color: isCur ? "var(--ink-2)" : "var(--ink-3)" }}>{String(t.index).padStart(2, "0")}</span>
              <span className="w-12 font-semibold shrink-0" style={{ color: m.color }}>{m.label}</span>
              <span className="w-14 tabular-nums text-[var(--ink-2)] shrink-0">{t.i !== undefined ? `[${t.i},${t.j}]` : t.detail ?? "—"}</span>
              <span className="flex-1 truncate font-sans" style={{ color: isCur ? "var(--ink)" : "var(--ink-3)" }}>{t.values ? `${t.values[0]} ${t.action === "swap" ? "⇄" : "◇"} ${t.values[1]}` : t.summary ?? t.note}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
