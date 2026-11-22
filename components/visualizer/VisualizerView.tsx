"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { VisualizerStage } from "./VisualizerStage";
import { NetworkStage } from "./NetworkStage";
import { TelemetryRail } from "./TelemetryRail";
import { TransportBar } from "./TransportBar";
import { InputControls } from "./InputControls";
import { CourseSidebar } from "@/components/course/CourseSidebar";
import { useVisualizer, initialFor } from "@/lib/store";
import { locate, pad2 } from "@/lib/course";
import { markComplete } from "@/lib/progress";
import { T, at, hasEntered, markEntered, stagger, type StageMode } from "@/lib/motion";

const STAGE_TITLE: Record<string, string> = { graph: "graph trace", tree: "tree trace" };

/** "CH 05 · MERGE SORT" — what the CRT shows while it changes channel. */
const channelLabel = (loc: ReturnType<typeof locate>, name: string) =>
  `ch ${loc ? pad2(loc.chapterNo) + "." + loc.lessonNo : "--"} · ${name}`;

function Chip({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span style={style} className="enter inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border border-[var(--seam-strong)] bg-[var(--chassis-raised)] shadow-[inset_0_1px_0_var(--seam-light)] font-mono text-[11px] text-[var(--ink-2)] tabular-nums whitespace-nowrap">{children}</span>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="font-mono text-[10px] text-[var(--ink-2)] px-1.5 py-[1px] rounded-[4px] bg-[var(--chassis-raised)] border border-[var(--seam-strong)] shadow-[0_1px_0_var(--seam)]">{children}</kbd>
  );
}

export function VisualizerView({ slug }: { slug: string }) {
  const store = useVisualizer();
  // Until the store holds this lesson (it loads in an effect), render the lesson's
  // own starting state — never the previous lesson, and never Bubble Sort by default.
  const loaded = store.algo.slug === slug;
  const fallback = useMemo(() => (loaded ? null : initialFor(slug)), [loaded, slug]);
  const {
    algo, input, target, graphNodes, graphSeed, views, derived, currentStep, totalSteps, isPlaying, speed,
  } = fallback ? { ...store, ...fallback } : store;
  const { load, shuffle, setInput, setTarget, play, pause, togglePlay, stepForward, stepBack, scrub, setSpeed, tick } = store;

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
      else if (e.key.toLowerCase() === "s") { shuffle(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, stepForward, stepBack, shuffle]);

  // watching a lesson to its last frame completes it (sidebar progress)
  useEffect(() => {
    if (totalSteps > 0 && currentStep === totalSteps) markComplete(algo.slug);
  }, [currentStep, totalSteps, algo.slug]);

  const loc = locate(algo.slug);
  const view = views[currentStep];
  const lesson = loc?.chapter.algos[loc.lessonNo - 1];

  // The full entrance plays once per tab; lesson switches after that only change channel.
  const [intro] = useState(() => !hasEntered());
  useEffect(() => { markEntered(); }, []);

  // Which transition the stage plays is decided when its content identity changes:
  // another lesson → channel change; same lesson, new input → static burst.
  const stageKey = `${algo.slug}|${input.join(",")}|${target}|${graphNodes}|${graphSeed}`;
  const seen = useRef<{ key: string; slug: string; mode: StageMode }>({ key: stageKey, slug: algo.slug, mode: intro ? "intro" : "channel" });
  if (seen.current.key !== stageKey) {
    seen.current = { key: stageKey, slug: algo.slug, mode: seen.current.slug !== algo.slug ? "channel" : "retune" };
  }
  const mode = seen.current.mode;
  // header copy re-enters on every lesson (quick), as part of the cascade on the first visit
  const hd = (introMs: number, switchMs: number) => at(intro ? introMs : switchMs);

  return (
    // Desktop: a locked, full-height instrument panel. Small screens: a normal scrolling page,
    // otherwise the stage collapses to 0px and the rail covers the controls.
    <div className="flex flex-col min-h-screen lg:h-screen lg:overflow-hidden">
      <TopBar intro={intro} />

      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        <CourseSidebar current={slug} intro={intro} />

        <main className="flex flex-col flex-1 min-w-0 min-h-0">
          {/* lesson header */}
          <div key={algo.slug} className="px-5 sm:px-8 pt-4 pb-1 shrink-0" data-testid="lesson-header">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
              <p className="enter font-mono text-[12px] text-[var(--ink-3)]" style={hd(T.header, 0)} data-testid="lesson-crumb">
                {loc && <>{pad2(loc.chapterNo)}. {loc.chapter.name} <span aria-hidden="true" className="text-[var(--seam-strong)] mx-1.5">/</span> Lesson {loc.lessonNo} of {loc.lessonCount}</>}
              </p>
              {/* phones: these repeat the telemetry rail, and cost the Play key its place above the fold */}
              <div className="hidden sm:flex items-center gap-2 flex-wrap">
                {[
                  <><span className="label !text-[9px]">time</span>{algo.complexity.time}</>,
                  <><span className="label !text-[9px]">space</span>{algo.complexity.space}</>,
                  <>{totalSteps} steps</>,
                ].map((c, i) => <Chip key={i} style={hd(stagger(T.header + 60, i, 45), 40 + i * 30)}>{c}</Chip>)}
              </div>
            </div>
            <div className="flex items-end justify-between gap-x-6 gap-y-3 flex-wrap">
              <div className="min-w-0">
                <h1 className="enter font-display text-[38px] leading-none tracking-[-0.01em] text-[var(--ink)] mb-1.5" style={hd(T.header + 40, 30)}>{algo.name}</h1>
                <p className="enter hidden sm:block text-[13px] text-[var(--ink-2)] max-w-[62ch]" style={hd(T.header + 90, 70)}>
                  {lesson?.description}
                  <span className="hidden 2xl:inline-flex items-center gap-1.5 label !normal-case !tracking-normal !text-[11px] ml-3 align-middle">
                    <Kbd>space</Kbd> play <Kbd>← →</Kbd> step <Kbd>s</Kbd> shuffle
                  </span>
                </p>
              </div>
              <div className={intro ? "enter" : undefined} style={at(T.header + 130)}>
                <InputControls kind={algo.kind} input={input} target={target} graphNodes={graphNodes}
                  onShuffle={shuffle} onSetInput={setInput} onSetTarget={setTarget} />
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row flex-1 min-h-0">
            <div className="flex flex-col flex-1 min-w-0 min-h-0">
              {view?.kind === "network" ? (
                <NetworkStage view={view} derived={derived[currentStep]} title={STAGE_TITLE[algo.kind]}
                  stageKey={stageKey} mode={mode} channel={channelLabel(loc, algo.name)} />
              ) : (
                <VisualizerStage view={view} derived={derived[currentStep]} title={algo.kind === "search" ? `search for ${target}` : "sort trace"}
                  stageKey={stageKey} mode={mode} channel={channelLabel(loc, algo.name)} />
              )}
              <TransportBar
                isPlaying={isPlaying} currentStep={currentStep} totalSteps={totalSteps} speed={speed}
                onPlay={play} onPause={pause} onStepForward={stepForward} onStepBack={stepBack} onScrub={scrub} onSpeedChange={setSpeed}
                next={loc?.next} intro={intro}
              />
            </div>
            <TelemetryRail
              trace={derived} current={currentStep}
              time={algo.complexity.time} space={algo.complexity.space}
              pseudocode={algo.pseudocode} stats={algo.stats} legend={algo.legend} onSelect={scrub}
              intro={intro} traceKey={stageKey}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
