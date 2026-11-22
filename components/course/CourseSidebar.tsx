"use client";

import Link from "next/link";
import { useState } from "react";
import { catalog } from "@/lib/algorithms";
import { playable, pad2 } from "@/lib/course";
import { useCompleted } from "@/lib/progress";
import { T, at, stagger } from "@/lib/motion";

const Chevron = ({ open }: { open: boolean }) => (
  <svg aria-hidden="true" viewBox="0 0 10 10" className={`w-2.5 h-2.5 shrink-0 transition-transform duration-150 ${open ? "rotate-90" : ""}`}>
    <path d="M3 1.5 6.5 5 3 8.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function LessonIcon({ state }: { state: "done" | "current" | "todo" | "soon" }) {
  if (state === "done") {
    return (
      <svg aria-hidden="true" viewBox="0 0 16 16" className="w-3.5 h-3.5 shrink-0 text-[var(--sorted-ink)]">
        <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5 8.2 7 10.2 11 6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (state === "current") {
    // a tiny lit screen
    return (
      <span aria-hidden="true" className="w-3.5 h-3 shrink-0 rounded-[3px] bg-[var(--glass)] grid place-items-center">
        <span className="w-1.5 h-[2px] rounded-full bg-[var(--phosphor)] shadow-[var(--glow-tight)]" />
      </span>
    );
  }
  return <span aria-hidden="true" className={`w-3.5 h-3 shrink-0 rounded-[3px] border ${state === "soon" ? "border-[var(--seam)]" : "border-[var(--ink-3)]"}`} />;
}

export function CourseSidebar({ current, intro = false }: { current: string; intro?: boolean }) {
  const enter = intro ? "enter" : "";
  const completed = useCompleted();
  const currentChapter = catalog.find((c) => c.algos.some((a) => a.slug === current))?.id;
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => (currentChapter ? { [currentChapter]: true } : {}));
  const [mobileOpen, setMobileOpen] = useState(false);
  const total = catalog.reduce((n, c) => n + c.algos.length, 0);
  const done = playable.filter((a) => completed.includes(a.slug)).length;

  return (
    <nav aria-label="Course" data-testid="course-sidebar"
      className="lg:w-[256px] shrink-0 flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r border-[var(--seam)]">
      <div className={`flex items-center justify-between px-5 pt-4 pb-3 ${enter}`} style={at(T.sidebar)}>
        <button type="button" onClick={() => setMobileOpen((o) => !o)} aria-expanded={mobileOpen} aria-controls="course-tree"
          className="lg:hidden flex items-center gap-2 rounded-md font-display text-[22px] leading-none text-[var(--ink)]">
          <Chevron open={mobileOpen} /> Course
        </button>
        <span className="hidden lg:block font-display text-[22px] leading-none text-[var(--ink)]">Course</span>
        <span className="label">{total} lessons</span>
      </div>

      <div id="course-tree" className={`${mobileOpen ? "block" : "hidden"} lg:block flex-1 min-h-0 overflow-y-auto scroll-quiet px-3 pb-3`}>
        {catalog.map((chapter, ci) => {
          const open = !!expanded[chapter.id];
          const chapterDone = chapter.algos.filter((a) => completed.includes(a.slug)).length;
          return (
            <div key={chapter.id} className={`mb-1 ${enter}`} style={at(stagger(T.sidebar + 60, ci, 50))}>
              <button type="button" onClick={() => setExpanded((e) => ({ ...e, [chapter.id]: !open }))} aria-expanded={open}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-left text-[var(--ink-2)] hover:bg-[var(--chassis-sunk)] transition-colors duration-150">
                <Chevron open={open} />
                <span className="font-mono text-[11px] text-[var(--signal-ink)] tabular-nums">{pad2(ci + 1)}</span>
                <span className="flex-1 text-[14px] font-medium text-[var(--ink)]">{chapter.name}</span>
                <span className="font-mono text-[11px] tabular-nums text-[var(--ink-3)]">{chapterDone}/{chapter.algos.length}</span>
              </button>
              {open && (
                <ul className="ml-[13px] pl-3 border-l border-[var(--seam)] py-1 space-y-0.5">
                  {chapter.algos.map((a) => {
                    const isCur = a.slug === current;
                    const state = !a.ready ? "soon" : isCur ? "current" : completed.includes(a.slug) ? "done" : "todo";
                    if (!a.ready) {
                      return (
                        <li key={a.slug} aria-disabled="true" className="flex items-center gap-2.5 px-2.5 py-[7px] text-[13px] text-[var(--ink-3)]">
                          <LessonIcon state={state} />
                          <span className="flex-1 truncate">{a.name}</span>
                          <span className="label !text-[9px]">soon</span>
                        </li>
                      );
                    }
                    return (
                      <li key={a.slug}>
                        <Link href={`/algorithms/${a.slug}`} aria-current={isCur ? "page" : undefined}
                          className={`flex items-center gap-2.5 px-2.5 py-[7px] rounded-[7px] text-[13px] border transition-colors duration-150 ${isCur
                            ? "bg-[var(--chassis-raised)] border-[var(--seam-strong)] shadow-[var(--shadow-key)] text-[var(--ink)] font-medium"
                            : "border-transparent text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--chassis-sunk)]"}`}>
                          <LessonIcon state={state} />
                          <span className="flex-1 truncate">{a.name}</span>
                          {state === "done" && <span className="sr-only">(completed)</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <div className={`${mobileOpen ? "block" : "hidden"} lg:block px-5 py-3 border-t border-[var(--seam)] ${enter}`} style={at(T.sidebar + 300)} data-testid="course-progress">
        <div className="flex items-center justify-between mb-2">
          <span className="label">progress</span>
          <span className="font-mono text-[12px] tabular-nums text-[var(--ink)]">{done} / {playable.length}</span>
        </div>
        <div className="h-[5px] rounded-full bg-[var(--chassis-sunk)] shadow-[var(--shadow-tray)] overflow-hidden" aria-hidden="true">
          <div className="h-full rounded-full bg-[var(--sorted-ink)] origin-left transition-transform duration-300" style={{ transform: `scaleX(${done / playable.length})` }} />
        </div>
      </div>
    </nav>
  );
}
