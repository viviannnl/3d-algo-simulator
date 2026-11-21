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
    <div className="flex items-center gap-2.5 flex-wrap">
      <span className="label mr-0.5 hidden sm:inline">input</span>

      <button onClick={() => onShuffle(input.length)} className="key key-sm" aria-label="Shuffle input">
        <svg aria-hidden="true" viewBox="0 0 16 16" className="w-3.5 h-3.5"><path d="M2 4h2.5c1.6 0 2.6.8 3.5 2.2l1 1.6c.9 1.4 1.9 2.2 3.5 2.2H14M2 12h2.5c.9 0 1.6-.3 2.2-.8M9.3 4.8c.6-.5 1.3-.8 2.2-.8H14M12 2l2 2-2 2M12 10l2 2-2 2" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
        Shuffle
      </button>

      {/* size selector: a recessed tray; the chosen size is the key pressed in */}
      <div className="tray flex items-center gap-1 p-1" role="group" aria-label="Array size">
        {SIZES.map((s) => (
          <button key={s} onClick={() => onShuffle(s)} aria-pressed={input.length === s} aria-label={`${s} elements`}
            className="key key-sm !w-8 !px-0 font-mono tabular-nums">
            {s}
          </button>
        ))}
      </div>

      {editing ? (
        <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
          className="h-7 px-2.5 w-56 rounded-md font-mono text-[12px] bg-[var(--chassis-raised)] border border-[var(--ink-3)] shadow-[var(--shadow-tray)] text-[var(--ink)] outline-none focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
          aria-label="Custom array (comma separated)" />
      ) : (
        <button onClick={() => { setDraft(input.join(", ")); setEditing(true); }} className="key key-sm" aria-label="Edit custom array">
          <svg aria-hidden="true" viewBox="0 0 16 16" className="w-3 h-3"><path d="M10.5 2.5l3 3L6 13H3v-3z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>
          Custom
        </button>
      )}
    </div>
  );
}
