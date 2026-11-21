"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { type DerivedStep, ACTION_META } from "@/lib/viewModel";

interface Props {
  trace: DerivedStep[];
  current: number;
  time: string;
  space: string;
  pseudocode: string[];
  onSelect: (step: number) => void;
}

function Stat({ label, value, color = "var(--text-primary)" }: { label: string; value: ReactNode; color?: string }) {
  return (
    <div className="bp-frame bg-[var(--background-surface)] border border-[var(--border-shell)] px-3 py-2">
      <div className="text-[10px] tracking-widest uppercase text-[var(--text-muted)]">{label}</div>
      <div className="text-[20px] font-bold tabular-nums leading-tight" style={{ color }}>{value}</div>
    </div>
  );
}

function Legend({ c, t }: { c: string; t: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="w-2 h-2" style={{ background: c }} />
      <span className="text-[var(--text-muted)]">{t}</span>
    </span>
  );
}

export function TelemetryRail({ trace, current, time, space, pseudocode, onSelect }: Props) {
  const cur = trace[current];
  const rowRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => { rowRef.current?.scrollIntoView({ block: "nearest" }); }, [current]);

  const meta = ACTION_META[cur?.action ?? "init"];

  return (
    <div className="w-full lg:w-[384px] shrink-0 bg-[var(--background-shell)] border-t lg:border-t-0 lg:border-l border-[var(--border-shell)] flex flex-col relative z-20 min-h-0">
      <div className="flex items-center justify-between px-4 h-10 border-b border-[var(--border-shell)] bg-[var(--background-surface)]">
        <span className="text-[11px] tracking-[0.2em] uppercase text-[var(--primary)] flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[var(--primary)] bp-pulse" />telemetry
        </span>
        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest bp-hatch px-2 py-0.5">pass {cur?.pass ?? 1}</span>
      </div>

      <div className="grid grid-cols-4 gap-2 p-3 border-b border-[var(--border-shell)]">
        <Stat label="Step" value={<>{current}<span className="text-[var(--text-muted)] text-[13px]">/{trace.length - 1}</span></>} color="var(--primary)" />
        <Stat label="Cmp" value={cur?.comparisons ?? 0} color="var(--compare)" />
        <Stat label="Swap" value={cur?.swaps ?? 0} color="var(--swap)" />
        <Stat label="Sorted" value={cur?.sortedCount ?? 0} color="var(--sorted)" />
      </div>

      <div className="flex gap-2 px-3 py-3 border-b border-[var(--border-shell)]">
        {([["Time", time], ["Space", space]] as const).map(([label, val]) => (
          <div key={label} className="flex-1 flex items-center justify-between bg-[var(--background-surface)] border border-[var(--border-shell)] px-3 py-2">
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">{label}</span>
            <span className="text-[13px] font-bold text-[var(--primary)]" style={{ textShadow: "0 0 8px var(--primary-dim)" }}>{val || "—"}</span>
          </div>
        ))}
      </div>

      <div className="px-3 py-3 border-b border-[var(--border-shell)]">
        <div className="text-[10px] tracking-widest uppercase text-[var(--text-muted)] mb-2">pseudocode</div>
        <div className="bg-[var(--background-app)] border border-[var(--border-shell)] py-2">
          {pseudocode.map((line, idx) => {
            const active = cur?.line === idx;
            return (
              <div key={idx} className="flex items-center text-[12px] leading-relaxed" style={{ background: active ? "var(--primary-dim)" : "transparent", borderLeft: active ? "2px solid var(--primary)" : "2px solid transparent" }}>
                <span className="w-7 text-right pr-2 text-[var(--text-muted)] select-none tabular-nums">{idx + 1}</span>
                <span className="whitespace-pre" style={{ color: active ? "var(--primary)" : "var(--text-secondary)" }}>{line}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-3 py-3 border-b border-[var(--border-shell)]">
        <div className="text-[10px] tracking-widest uppercase text-[var(--text-muted)] mb-2">execution log</div>
        <div className="bg-[var(--background-surface)] border-l-2 px-3 py-2 text-[12px] text-[var(--text-primary)] leading-relaxed min-h-[52px]" style={{ borderColor: meta.color }}>
          <span className="font-bold mr-2" style={{ color: meta.color }}>{meta.glyph} {meta.label}</span>
          {cur?.note}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 h-8 border-b border-[var(--border-shell)] text-[10px] tracking-widest uppercase text-[var(--text-muted)] shrink-0">
        <span>step trace</span>
        <span className="flex items-center gap-3">
          <Legend c="var(--compare)" t="cmp" /><Legend c="var(--swap)" t="swap" /><Legend c="var(--sorted)" t="lock" />
        </span>
      </div>
      <div className="flex-1 min-h-[160px] overflow-y-auto bp-scroll">
        {trace.map((t) => {
          const isCur = t.index === current;
          const m = ACTION_META[t.action];
          return (
            <button key={t.index} ref={isCur ? rowRef : undefined} onClick={() => onSelect(t.index)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-left border-b border-[var(--border-card)] transition-colors hover:bg-[var(--background-card-hover)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--primary)]"
              style={{ background: isCur ? "var(--primary-dim)" : "transparent", borderLeft: isCur ? "2px solid var(--primary)" : "2px solid transparent" }}>
              <span className="w-8 text-[11px] tabular-nums text-[var(--text-muted)] shrink-0">{String(t.index).padStart(2, "0")}</span>
              <span className="w-1.5 h-1.5 shrink-0" style={{ background: m.color, boxShadow: isCur ? `0 0 6px ${m.color}` : "none" }} />
              <span className="w-12 text-[11px] font-bold shrink-0" style={{ color: m.color }}>{m.label}</span>
              <span className="w-14 text-[11px] tabular-nums text-[var(--text-secondary)] shrink-0">{t.i !== undefined ? `[${t.i},${t.j}]` : "—"}</span>
              <span className="flex-1 truncate text-[11px] text-[var(--text-muted)]">{t.values ? `${t.values[0]} ${t.action === "swap" ? "⇄" : "◇"} ${t.values[1]}` : t.note}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
