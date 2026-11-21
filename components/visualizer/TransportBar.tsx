"use client";

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
}

export function TransportBar({ isPlaying, currentStep, totalSteps, speed, onPlay, onPause, onStepForward, onStepBack, onScrub, onSpeedChange }: Props) {
  const atStart = currentStep === 0;
  const atEnd = currentStep === totalSteps;
  const progressPct = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  const btn = "h-9 px-4 text-[13px] inline-flex items-center justify-center gap-2 border transition-all duration-150 outline-none focus-visible:ring-1 focus-visible:ring-[var(--primary)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";
  const ghost = `${btn} bg-[var(--background-surface)] text-[var(--text-secondary)] border-[var(--border-shell)] hover:border-[var(--primary)] hover:text-[var(--primary)]`;
  const primary = `${btn} bg-[var(--primary-dim)] text-[var(--primary)] border-[var(--primary)]`;

  return (
    <div className="shrink-0 bg-[var(--background-shell)] border-t border-[var(--border-shell)] px-6 py-4 relative z-20">
      <div className="flex items-center gap-4 mb-4">
        <span className="text-[11px] tabular-nums text-[var(--text-muted)] w-6 text-right">0</span>
        <div className="flex-1 relative h-6 flex items-center">
          <div className="absolute inset-x-0 h-[3px] bg-[var(--border-shell)]" />
          <div className="absolute inset-x-0 flex justify-between">
            {Array.from({ length: totalSteps + 1 }).map((_, i) => (
              <span key={i} className="w-px h-2 -mt-1" style={{ background: i <= currentStep ? "var(--primary-line)" : "var(--border-shell)" }} />
            ))}
          </div>
          <div className="absolute left-0 h-[3px] bg-[var(--primary)]" style={{ width: `${progressPct}%`, boxShadow: "0 0 8px var(--primary)" }} />
          <div className="absolute w-2 h-5 bg-[var(--primary)]" style={{ left: `calc(${progressPct}% - 4px)`, boxShadow: "var(--glowing-pointer-glow)" }} />
          <input type="range" min={0} max={totalSteps} value={currentStep} onChange={(e) => onScrub(Number(e.target.value))} className="w-full absolute inset-0 opacity-0 cursor-pointer" aria-label="Execution step scrubber" />
        </div>
        <div className="flex items-center gap-1.5 text-[13px] tabular-nums">
          <span className="px-2 py-0.5 font-bold text-[var(--primary)] bg-[var(--primary-dim)] border border-[var(--primary)]">{String(currentStep).padStart(2, "0")}</span>
          <span className="text-[var(--text-muted)]">/</span>
          <span className="text-[var(--text-secondary)]">{totalSteps}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 flex-wrap">
        <button onClick={onStepBack} disabled={atStart} className={ghost} aria-label="Step back (left arrow)"><span>⏮</span><span>Step Back</span></button>
        {isPlaying ? (
          <button onClick={onPause} className={primary} aria-label="Pause (space)" style={{ boxShadow: "0 0 12px var(--primary-dim)" }}><span>⏸</span><span>Pause</span></button>
        ) : (
          <button onClick={onPlay} className={atEnd ? ghost : primary} aria-label={atEnd ? "Replay" : "Play (space)"} style={!atEnd ? { boxShadow: "0 0 12px var(--primary-dim)" } : undefined}><span>{atEnd ? "↺" : "▶"}</span><span>{atEnd ? "Replay" : "Play"}</span></button>
        )}
        <button onClick={onStepForward} disabled={atEnd} className={ghost} aria-label="Step forward (right arrow)"><span>Step Forward</span><span>⏭</span></button>
        <div className="h-6 w-px bg-[var(--border-shell)] mx-1 hidden sm:block" />
        <select value={speed} onChange={(e) => onSpeedChange(Number(e.target.value))} className="h-9 bg-[var(--background-surface)] text-[var(--text-secondary)] border border-[var(--border-shell)] hover:border-[var(--primary)] px-3 text-[13px] outline-none focus-visible:ring-1 focus-visible:ring-[var(--primary)] cursor-pointer" aria-label="Playback speed">
          <option value={1400}>0.5×</option><option value={700}>1×</option><option value={350}>2×</option><option value={180}>4×</option>
        </select>
      </div>
    </div>
  );
}
