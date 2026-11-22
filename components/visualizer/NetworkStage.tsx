"use client";

import type { DerivedStep, EdgeState, NetworkView, NodeState } from "@/lib/types";
import { edgeKey } from "@/lib/types";

const NODE: Record<Exclude<NodeState, "hidden">, { ring: string; fill: string; text: string; glow?: string }> = {
  idle: { ring: "var(--phosphor-dim)", fill: "var(--glass)", text: "var(--phosphor-dim)" },
  frontier: { ring: "var(--compare)", fill: "var(--compare-dim)", text: "var(--compare)", glow: "var(--compare)" },
  current: { ring: "var(--swap)", fill: "var(--swap-dim)", text: "var(--swap-hot)", glow: "var(--swap)" },
  visited: { ring: "var(--sorted)", fill: "var(--sorted-dim)", text: "var(--sorted-hot)" },
  found: { ring: "var(--sorted)", fill: "var(--sorted-dim)", text: "var(--sorted)", glow: "var(--sorted)" },
};

const EDGE: Record<Exclude<EdgeState, "hidden">, { stroke: string; width: number; dash?: string }> = {
  idle: { stroke: "var(--phosphor-line)", width: 1.25, dash: "4 4" },
  active: { stroke: "var(--compare)", width: 2.5 },
  tree: { stroke: "var(--sorted)", width: 2 },
};

/** Graphs and trees on the CRT: SVG edges under HTML nodes, both placed in % of the glass. */
export function NetworkStage({ view, derived, title }: { view: NetworkView; derived?: DerivedStep; title: string }) {
  const pos = Object.fromEntries(view.nodes.map((n) => [n.id, n]));
  const done = derived?.action === "done";
  const shown = view.nodes.filter((n) => view.nodeState[n.id] !== "hidden").length;

  return (
    <div className="flex-1 min-h-[380px] sm:min-h-[440px] lg:min-h-0 flex p-3 sm:p-5 lg:pr-3">
      <div className="bezel flex-1 flex min-w-0">
        <div className="glass glass-grid flex-1 min-w-0" data-testid="network-stage">
          {done && <div key="sweep" className="crt-sweep" aria-hidden="true" />}

          <div className="crt-on absolute inset-0 flex flex-col px-5 sm:px-8 pt-5 sm:pt-6 pb-4 z-10 font-mono">
            <div className="flex items-center justify-between mb-2 text-[10px] sm:text-[11px] tracking-[0.12em] uppercase">
              <span className="flex items-center gap-2 text-[var(--phosphor)] phosphor-text">
                <span className="led led-pulse bg-[var(--phosphor)] text-[var(--phosphor)] !shadow-[var(--glow-tight)]" />
                {title}
              </span>
              <span className="text-[var(--phosphor-dim)]">{shown}/{view.nodes.length} nodes · {view.edges.length} edges</span>
            </div>

            {/* plotting area: inset so node discs at the edges are never clipped */}
            <div className="relative flex-1 min-h-0 mx-4 my-5">
              <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {view.edges.map((e) => {
                  const st = view.edgeState[edgeKey(e.a, e.b)];
                  if (st === "hidden") return null;
                  const s = EDGE[st];
                  const p = pos[e.a], q = pos[e.b];
                  return (
                    <line key={edgeKey(e.a, e.b)} data-testid="edge" data-state={st}
                      x1={p.x * 100} y1={p.y * 100} x2={q.x * 100} y2={q.y * 100}
                      stroke={s.stroke} strokeWidth={s.width} strokeDasharray={s.dash} vectorEffect="non-scaling-stroke"
                      style={{ transition: "stroke 200ms, stroke-width 200ms", filter: st === "active" ? "drop-shadow(0 0 4px var(--compare))" : undefined }} />
                  );
                })}
              </svg>

              {/* edge weights sit at the midpoint, on a glass-coloured chip so the line breaks around them */}
              {view.edges.map((e) => {
                if (e.w === undefined || view.edgeState[edgeKey(e.a, e.b)] === "hidden") return null;
                const p = pos[e.a], q = pos[e.b];
                const st = view.edgeState[edgeKey(e.a, e.b)];
                return (
                  <span key={`w-${edgeKey(e.a, e.b)}`} className="absolute -translate-x-1/2 -translate-y-1/2 px-1 rounded-[3px] bg-[var(--glass)] text-[10px] tabular-nums"
                    style={{ left: `${((p.x + q.x) / 2) * 100}%`, top: `${((p.y + q.y) / 2) * 100}%`, color: st === "active" ? "var(--compare)" : "var(--phosphor-dim)" }}>
                    {e.w}
                  </span>
                );
              })}

              {view.nodes.map((n) => {
                const st = view.nodeState[n.id];
                if (st === "hidden") return null;
                const look = NODE[st];
                return (
                  <div key={n.id} data-testid="node" data-id={n.id} data-state={st}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                    style={{ left: `${n.x * 100}%`, top: `${n.y * 100}%` }}>
                    <span className="grid place-items-center w-9 h-9 sm:w-10 sm:h-10 rounded-full text-[12px] sm:text-[13px] font-semibold tabular-nums transition-[background,box-shadow,color] duration-200"
                      style={{
                        // solid glass under the tint, so edges never show through and cross the label
                        background: `linear-gradient(${look.fill}, ${look.fill}), var(--glass)`,
                        color: look.text,
                        boxShadow: `inset 0 0 0 1.5px ${look.ring}${look.glow ? `, 0 0 16px -3px ${look.glow}` : ""}`,
                        textShadow: `0 0 6px color-mix(in srgb, ${look.text} 45%, transparent)`,
                      }}>
                      {n.label}
                    </span>
                    {view.badges[n.id] !== undefined && (
                      <span data-testid="node-badge" className="mt-1 px-1 rounded-[3px] bg-[var(--glass)] text-[10px] tabular-nums" style={{ color: look.text === "var(--phosphor-dim)" ? "var(--phosphor-dim)" : look.text }}>
                        {view.badges[n.id]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {view.strip && <Strip label={view.strip.label} items={view.strip.items} />}
          </div>
        </div>
      </div>
    </div>
  );
}

/** The queue / stack / output readout along the bottom of the glass. */
export function Strip({ label, items, testId = "glass-strip" }: { label: string; items: string[]; testId?: string }) {
  return (
    <div data-testid={testId} className="flex items-center gap-2 min-h-7 pt-2 border-t border-[var(--phosphor-grid)] text-[10px] sm:text-[11px] overflow-hidden">
      <span className="shrink-0 uppercase tracking-[0.12em] text-[var(--phosphor-dim)]">{label} ▸</span>
      {items.length === 0 ? (
        <span className="text-[var(--phosphor-dim)]">empty</span>
      ) : (
        <span className="flex gap-1.5 min-w-0 overflow-hidden">
          {items.map((it, k) => (
            <span key={`${it}-${k}`} className="shrink-0 px-1.5 rounded-[3px] tabular-nums"
              style={k === 0 ? { color: "var(--phosphor-hot)", background: "var(--phosphor-faint)", textShadow: "var(--glow-tight)" } : { color: "var(--phosphor)" }}>
              {it}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}
