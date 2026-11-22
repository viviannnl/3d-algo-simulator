"use client";

import Link from "next/link";
import { T, at } from "@/lib/motion";

interface Props {
  isPlaying: boolean;
  currentStep: number;
  totalSteps: number;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  onScrub: (step: number) => void;
  onSpeedChange: (speed: number) => void;
  /** the next playable lesson — becomes the lit key once this one finishes */
  next?: { slug: string; name: string };
  intro?: boolean;
}

const Icon = {
  back: <svg aria-hidden="true" viewBox="0 0 16 16" className="w-3.5 h-3.5"><path d="M4 3v10M13 3.5 6.5 8 13 12.5z" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>,
  fwd: <svg aria-hidden="true" viewBox="0 0 16 16" className="w-3.5 h-3.5"><path d="M12 3v10M3 3.5 9.5 8 3 12.5z" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>,
  play: <svg aria-hidden="true" viewBox="0 0 16 16" className="w-3.5 h-3.5"><path d="M4.5 2.8v10.4L13 8z" fill="currentColor" /></svg>,
  pause: <svg aria-hidden="true" viewBox="0 0 16 16" className="w-3.5 h-3.5"><path d="M4 3h3v10H4zM9 3h3v10H9z" fill="currentColor" /></svg>,
  replay: <svg aria-hidden="true" viewBox="0 0 16 16" className="w-3.5 h-3.5"><path d="M3 8a5 5 0 1 0 1.6-3.7M3 2.5v3h3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>,
};

export function TransportBar({ isPlaying, currentStep, totalSteps, speed, onPlay, onPause, onStepForward, onStepBack, onScrub, onSpeedChange, next, intro = false }: Props) {
  const atStart = currentStep === 0;
  const atEnd = currentStep === totalSteps;
  const progressPct = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;
  const pad = String(totalSteps).length;

  return (
    <div data-testid="transport" className={`shrink-0 px-3 sm:px-5 lg:pr-3 pb-4 relative z-20 ${intro ? "enter" : ""}`} style={at(T.transport)}>
      <div className="flex items-center gap-4 px-2 pt-1 pb-4">
        <span className="label w-5 text-right tabular-nums">0</span>
        <div className="flex-1 relative h-7 flex items-center">
          {/* The real control is invisible and on top (z-10); it comes first so
              `.scrubber-input:focus-visible ~ .scrubber-thumb` can show its focus on the drawn knob. */}
          <input type="range" min={0} max={totalSteps} value={currentStep} onChange={(e) => onScrub(Number(e.target.value))} className="scrubber-input w-full absolute inset-0 opacity-0 cursor-pointer z-10" aria-label="Execution step scrubber" />
          {/* machined groove */}
          <div className="absolute inset-x-0 h-[6px] rounded-full bg-[var(--chassis-sunk)] shadow-[var(--shadow-tray)]" />
          <div className="absolute left-0 h-[6px] rounded-full bg-[var(--signal)]" style={{ width: `${progressPct}%`, boxShadow: "inset 0 1px 1px rgba(80,30,5,0.3)" }} />
          <div className="absolute inset-x-0 top-[calc(50%+7px)] flex justify-between px-[1px]" aria-hidden="true">
            {Array.from({ length: totalSteps + 1 }).map((_, i) => (
              <span key={i} className="w-px h-[5px]" style={{ background: i <= currentStep ? "var(--ink-3)" : "var(--seam-strong)" }} />
            ))}
          </div>
          <div data-testid="scrubber-thumb" className="scrubber-thumb absolute w-[18px] h-6 rounded-[5px] border border-[var(--seam-strong)] bg-[var(--chassis-raised)] shadow-[var(--shadow-key)] grid place-items-center"
            style={{ left: `calc(${progressPct}% - 9px)` }}>
            <span className="grip w-[9px] h-[11px]" />
          </div>
        </div>
        {/* amber readout window */}
        <div className="glass !rounded-[7px] !border px-2.5 py-1 font-mono text-[13px] tabular-nums flex items-center gap-1" aria-hidden="true">
          <span className="text-[var(--phosphor)] phosphor-text">{String(currentStep).padStart(pad, "0")}</span>
          <span className="text-[var(--phosphor-dim)]">/{totalSteps}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 flex-wrap">
        <div className="tray flex items-center gap-2 p-1.5">
          <button onClick={onStepBack} disabled={atStart} className="key" aria-label="Step back (left arrow)">{Icon.back}<span>Back</span></button>
          {isPlaying ? (
            <button onClick={onPause} className="key key-signal min-w-[104px]" aria-label="Pause (space)">{Icon.pause}<span>Pause</span></button>
          ) : (
            <button onClick={onPlay} className={`key min-w-[104px] ${atEnd ? "" : "key-signal"}`} aria-label={atEnd ? "Replay" : "Play (space)"}>{atEnd ? Icon.replay : Icon.play}<span>{atEnd ? "Replay" : "Play"}</span></button>
          )}
          <button onClick={onStepForward} disabled={atEnd} className="key" aria-label="Step forward (right arrow)"><span>Next</span>{Icon.fwd}</button>
        </div>
        <label className="flex items-center gap-2">
          <span className="label hidden sm:inline">speed</span>
          <span className="relative">
            <select value={speed} onChange={(e) => onSpeedChange(Number(e.target.value))} className="key appearance-none pr-8 font-mono tabular-nums" aria-label="Playback speed">
              <option value={1400}>0.5×</option><option value={700}>1×</option><option value={350}>2×</option><option value={180}>4×</option>
            </select>
            <svg aria-hidden="true" viewBox="0 0 10 6" className="w-2.5 h-1.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--ink-3)]"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
          </span>
        </label>
        {next && (
          <Link href={`/algorithms/${next.slug}`} className={`key ${atEnd ? "key-signal" : ""}`} data-testid="next-lesson">
            <span className="label !text-[9px] !text-inherit opacity-75">next</span>{next.name}
            <svg aria-hidden="true" viewBox="0 0 16 16" className="w-3.5 h-3.5"><path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
        )}
      </div>
    </div>
  );
}
