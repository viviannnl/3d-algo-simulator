"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { bubbleSort } from "@/lib/algorithms/bubbleSort";
import { buildSteps } from "@/lib/viewModel";

/** A small auto-playing bubble sort — purely decorative, loops forever. */
export function HeroMini() {
  const views = useMemo(() => buildSteps(bubbleSort, [5, 2, 8, 3, 6, 1, 7]), []);
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % views.length), 520);
    return () => clearInterval(id);
  }, [views.length]);

  const view = views[i];
  const maxVal = Math.max(...view.dataNodes, 1);

  return (
    <div className="bp-frame bg-[var(--background-surface)] border border-[var(--border-shell)] p-3 w-full max-w-[280px]">
      <div className="flex items-center justify-between mb-2 text-[9px] tracking-widest uppercase text-[var(--text-muted)]">
        <span className="text-[var(--primary)] flex items-center gap-1.5"><span className="w-1 h-1 bg-[var(--primary)] bp-pulse" />live demo</span>
        <span className="tabular-nums">bubble · {String(i).padStart(2, "0")}/{views.length - 1}</span>
      </div>
      <div className="flex items-end gap-[3%] h-20">
        {view.dataNodes.map((val, idx) => {
          const active = view.activeNodes.includes(idx);
          const sorted = view.sortedNodes.includes(idx);
          const color = active ? "var(--compare)" : sorted ? "var(--sorted)" : "var(--primary)";
          const dim = active ? "var(--compare-dim)" : sorted ? "var(--sorted-dim)" : "var(--primary-dim)";
          return (
            <motion.div key={val} layout transition={{ type: "spring", stiffness: 420, damping: 30 }} className="flex-1"
              style={{ height: `${Math.max((val / maxVal) * 100, 10)}%`, background: dim, borderTop: `2px solid ${color}`, borderLeft: `1px solid ${color}`, borderRight: `1px solid ${color}` }} />
          );
        })}
      </div>
    </div>
  );
}
