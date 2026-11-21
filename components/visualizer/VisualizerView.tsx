"use client";

import { useEffect, useRef } from "react";
import { TopBar } from "@/components/TopBar";
import { VisualizerStage } from "./VisualizerStage";
import { TelemetryRail } from "./TelemetryRail";
import { TransportBar } from "./TransportBar";
import { InputControls } from "./InputControls";
import { useVisualizer } from "@/lib/store";

export function VisualizerView({ slug }: { slug: string }) {
  const {
    algo, input, views, derived, currentStep, totalSteps, isPlaying, speed,
    load, shuffle, setInput, play, pause, togglePlay, stepForward, stepBack, scrub, setSpeed, tick,
  } = useVisualizer();

  useEffect(() => { load(slug); }, [slug, load]);

  // playback interval
  const tickRef = useRef(tick);
  useEffect(() => { tickRef.current = tick; }, [tick]);
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => tickRef.current(), speed);
    return () => clearInterval(id);
  }, [isPlaying, speed]);

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      if (e.key === " ") { e.preventDefault(); togglePlay(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); stepForward(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); stepBack(); }
      else if (e.key.toLowerCase() === "s") { shuffle(input.length); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, stepForward, stepBack, shuffle, input.length]);

  return (
    <div className="flex flex-col h-screen bg-[var(--background)] overflow-hidden">
      <TopBar breadcrumbs={["Algorithms", algo.name]} />

      {/* sub-strip: title + input controls */}
      <div className="flex items-center justify-between gap-4 px-6 h-12 bg-[var(--background-shell)] border-b border-[var(--border-shell)] text-[11px] shrink-0 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-[var(--text-primary)] font-semibold tracking-wide">{algo.name}</span>
          <span className="tracking-widest uppercase text-[var(--primary)]">{algo.complexity.time}</span>
          <span className="hidden md:inline text-[var(--text-muted)]">· press <kbd className="text-[var(--text-secondary)]">space</kbd> play · <kbd className="text-[var(--text-secondary)]">←/→</kbd> step · <kbd className="text-[var(--text-secondary)]">s</kbd> shuffle</span>
        </div>
        <InputControls input={input} onShuffle={shuffle} onSetInput={setInput} />
      </div>

      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        <div className="flex flex-col flex-1 min-w-0 min-h-0">
          <VisualizerStage view={views[currentStep]} derived={derived[currentStep]} />
          <TransportBar
            isPlaying={isPlaying} currentStep={currentStep} totalSteps={totalSteps} speed={speed}
            onPlay={play} onPause={pause} onStepForward={stepForward} onStepBack={stepBack} onScrub={scrub} onSpeedChange={setSpeed}
          />
        </div>
        <TelemetryRail
          trace={derived} current={currentStep}
          time={algo.complexity.time} space={algo.complexity.space}
          pseudocode={algo.pseudocode} onSelect={scrub}
        />
      </div>
    </div>
  );
}
