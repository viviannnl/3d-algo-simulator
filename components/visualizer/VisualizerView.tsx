"use client";

import { useEffect, useRef } from "react";
import { TopBar } from "@/components/TopBar";
import { VisualizerStage } from "./VisualizerStage";
import { TelemetryRail } from "./TelemetryRail";
import { TransportBar } from "./TransportBar";
import { InputControls } from "./InputControls";
import { CourseSidebar } from "@/components/course/CourseSidebar";
import { useVisualizer } from "@/lib/store";
import { locate, pad2 } from "@/lib/course";
import { markComplete } from "@/lib/progress";

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border border-[var(--seam-strong)] bg-[var(--chassis-raised)] shadow-[inset_0_1px_0_var(--seam-light)] font-mono text-[11px] text-[var(--ink-2)] tabular-nums whitespace-nowrap">{children}</span>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="font-mono text-[10px] text-[var(--ink-2)] px-1.5 py-[1px] rounded-[4px] bg-[var(--chassis-raised)] border border-[var(--seam-strong)] shadow-[0_1px_0_var(--seam)]">{children}</kbd>
  );
}

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
      // Ignore only text entry. The scrubber (range input) must still take shortcuts,
      // otherwise Space does nothing after a user drags it.
      const el = e.target as HTMLElement;
      const typing = el?.tagName === "TEXTAREA" || el?.isContentEditable ||
        (el?.tagName === "INPUT" && (el as HTMLInputElement).type !== "range");
      if (typing) return;
      if (e.key === " ") { e.preventDefault(); togglePlay(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); stepForward(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); stepBack(); }
      else if (e.key.toLowerCase() === "s") { shuffle(input.length); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, stepForward, stepBack, shuffle, input.length]);

  // watching a lesson to its last frame completes it (sidebar progress)
  useEffect(() => {
    if (totalSteps > 0 && currentStep === totalSteps) markComplete(algo.slug);
  }, [currentStep, totalSteps, algo.slug]);

  const loc = locate(algo.slug);
  const lesson = loc?.chapter.algos[loc.lessonNo - 1];

  return (
    // Desktop: a locked, full-height instrument panel. Small screens: a normal scrolling page,
    // otherwise the stage collapses to 0px and the rail covers the controls.
    <div className="flex flex-col min-h-screen lg:h-screen lg:overflow-hidden">
      <TopBar />

      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        <CourseSidebar current={slug} />

        <main className="flex flex-col flex-1 min-w-0 min-h-0">
          {/* lesson header */}
          <div className="px-5 sm:px-8 pt-4 pb-1 shrink-0">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
              <p className="font-mono text-[12px] text-[var(--ink-3)]" data-testid="lesson-crumb">
                {loc && <>{pad2(loc.chapterNo)}. {loc.chapter.name} <span aria-hidden="true" className="text-[var(--seam-strong)] mx-1.5">/</span> Lesson {loc.lessonNo} of {loc.lessonCount}</>}
              </p>
              {/* phones: these repeat the telemetry rail, and cost the Play key its place above the fold */}
              <div className="hidden sm:flex items-center gap-2 flex-wrap">
                <Chip><span className="label !text-[9px]">time</span>{algo.complexity.time}</Chip>
                <Chip><span className="label !text-[9px]">space</span>{algo.complexity.space}</Chip>
                <Chip>{totalSteps} steps</Chip>
              </div>
            </div>
            <div className="flex items-end justify-between gap-x-6 gap-y-3 flex-wrap">
              <div className="min-w-0">
                <h1 className="font-display text-[38px] leading-none tracking-[-0.01em] text-[var(--ink)] mb-1.5">{algo.name}</h1>
                <p className="hidden sm:block text-[13px] text-[var(--ink-2)] max-w-[62ch]">
                  {lesson?.description}
                  <span className="hidden 2xl:inline-flex items-center gap-1.5 label !normal-case !tracking-normal !text-[11px] ml-3 align-middle">
                    <Kbd>space</Kbd> play <Kbd>← →</Kbd> step <Kbd>s</Kbd> shuffle
                  </span>
                </p>
              </div>
              <InputControls input={input} onShuffle={shuffle} onSetInput={setInput} />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row flex-1 min-h-0">
            <div className="flex flex-col flex-1 min-w-0 min-h-0">
              <VisualizerStage view={views[currentStep]} derived={derived[currentStep]} />
              <TransportBar
                isPlaying={isPlaying} currentStep={currentStep} totalSteps={totalSteps} speed={speed}
                onPlay={play} onPause={pause} onStepForward={stepForward} onStepBack={stepBack} onScrub={scrub} onSpeedChange={setSpeed}
                next={loc?.next}
              />
            </div>
            <TelemetryRail
              trace={derived} current={currentStep}
              time={algo.complexity.time} space={algo.complexity.space}
              pseudocode={algo.pseudocode} onSelect={scrub}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
