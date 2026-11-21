"use client";

import { useState } from "react";

interface Props {
  input: number[];
  onShuffle: (n: number) => void;
  onSetInput: (values: number[]) => void;
}

const SIZES = [6, 8, 10, 12];

export function InputControls({ input, onShuffle, onSetInput }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(input.join(", "));

  const commit = () => {
    const values = draft.split(/[\s,]+/).map((s) => parseInt(s, 10)).filter((v) => Number.isFinite(v));
    if (values.length >= 2) onSetInput(values);
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap text-[11px]">
      <span className="text-[10px] tracking-widest uppercase text-[var(--text-muted)] mr-1">input</span>

      <button onClick={() => onShuffle(input.length)} className="h-7 px-3 inline-flex items-center gap-1.5 bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--primary)] hover:brightness-125 transition-all" aria-label="Shuffle input">
        ⤨ Shuffle
      </button>

      <div className="flex items-center border border-[var(--border-shell)]">
        {SIZES.map((s) => (
          <button key={s} onClick={() => onShuffle(s)} className="h-7 w-7 tabular-nums transition-colors border-r border-[var(--border-shell)] last:border-r-0"
            style={input.length === s ? { background: "var(--primary-dim)", color: "var(--primary)" } : { color: "var(--text-secondary)" }} aria-label={`${s} elements`}>
            {s}
          </button>
        ))}
      </div>

      {editing ? (
        <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
          className="h-7 px-2 w-56 bg-[var(--background-app)] border border-[var(--primary)] text-[var(--text-primary)] outline-none" aria-label="Custom array (comma separated)" />
      ) : (
        <button onClick={() => { setDraft(input.join(", ")); setEditing(true); }} className="h-7 px-3 bg-[var(--background-surface)] border border-[var(--border-shell)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors" aria-label="Edit custom array">
          ✎ Custom
        </button>
      )}
    </div>
  );
}
