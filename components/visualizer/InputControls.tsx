"use client";

import { useEffect, useState } from "react";
import type { AlgoKind } from "@/lib/types";

interface Props {
  kind: AlgoKind;
  input: number[];
  target: number;
  graphNodes: number;
  onShuffle: (n: number) => void;
  onSetInput: (values: number[]) => void;
  onSetTarget: (target: number) => void;
}

const SIZES: Record<AlgoKind, number[]> = { sort: [6, 8, 10, 12], search: [6, 8, 10, 12], tree: [6, 8, 10, 12], graph: [6, 8, 10] };

const field = "h-7 px-2.5 rounded-md font-mono text-[12px] bg-[var(--chassis-raised)] border border-[var(--ink-3)] shadow-[var(--shadow-tray)] text-[var(--ink)] outline-none focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]";

const ShuffleIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 16 16" className="w-3.5 h-3.5"><path d="M2 4h2.5c1.6 0 2.6.8 3.5 2.2l1 1.6c.9 1.4 1.9 2.2 3.5 2.2H14M2 12h2.5c.9 0 1.6-.3 2.2-.8M9.3 4.8c.6-.5 1.3-.8 2.2-.8H14M12 2l2 2-2 2M12 10l2 2-2 2" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export function InputControls({ kind, input, target, graphNodes, onShuffle, onSetInput, onSetTarget }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(input.join(", "));
  const [targetDraft, setTargetDraft] = useState(String(target));
  useEffect(() => setTargetDraft(String(target)), [target]);

  const commit = () => {
    const values = draft.split(/[\s,]+/).map((s) => parseInt(s, 10)).filter((v) => Number.isFinite(v));
    if (values.length >= 2) onSetInput(values);
    setEditing(false);
  };
  const commitTarget = () => {
    const t = parseInt(targetDraft, 10);
    if (Number.isFinite(t)) onSetTarget(t);
    else setTargetDraft(String(target));
  };

  const isGraph = kind === "graph";
  const size = isGraph ? graphNodes : input.length;

  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      <span className="label mr-0.5 hidden sm:inline">input</span>

      <button onClick={() => onShuffle(size)} className="key key-sm" aria-label={isGraph ? "New graph" : "Shuffle input"}>
        <ShuffleIcon />
        {isGraph ? "New graph" : "Shuffle"}
      </button>

      {/* size selector: a recessed tray; the chosen size is the key pressed in */}
      <div className="tray flex items-center gap-1 p-1" role="group" aria-label={isGraph ? "Node count" : "Array size"}>
        {SIZES[kind].map((s) => (
          <button key={s} onClick={() => onShuffle(s)} aria-pressed={size === s} aria-label={`${s} ${isGraph ? "nodes" : "elements"}`}
            className="key key-sm !w-8 !px-0 font-mono tabular-nums">
            {s}
          </button>
        ))}
      </div>

      {kind === "search" && (
        <label className="flex items-center gap-1.5">
          <span className="label">target</span>
          <input value={targetDraft} inputMode="numeric" onChange={(e) => setTargetDraft(e.target.value)} onBlur={commitTarget}
            onKeyDown={(e) => { if (e.key === "Enter") commitTarget(); }}
            className={`${field} w-14 text-center`} aria-label="Search target" />
        </label>
      )}

      {!isGraph && (editing ? (
        <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
          className={`${field} w-56`}
          aria-label={kind === "tree" ? "Keys to insert (comma separated)" : "Custom array (comma separated)"} />
      ) : (
        <button onClick={() => { setDraft(input.join(", ")); setEditing(true); }} className="key key-sm" aria-label={kind === "tree" ? "Edit keys to insert" : "Edit custom array"}>
          <svg aria-hidden="true" viewBox="0 0 16 16" className="w-3 h-3"><path d="M10.5 2.5l3 3L6 13H3v-3z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>
          Custom
        </button>
      ))}
    </div>
  );
}
