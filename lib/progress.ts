"use client";

import { useSyncExternalStore } from "react";

/**
 * Which lessons this viewer has watched to the end. A per-browser convenience
 * only: storage can be blocked or empty, so every access is guarded and the
 * app renders the same without it.
 */
const KEY = "algoviz.av1.completed";
const EVENT = "algoviz:progress";
const EMPTY: string[] = [];

let cache: { raw: string | null; list: string[] } = { raw: null, list: EMPTY };

function read(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw !== cache.raw) {
      const parsed = raw ? JSON.parse(raw) : [];
      cache = { raw, list: Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : EMPTY };
    }
    return cache.list;
  } catch {
    return EMPTY;
  }
}

export function markComplete(slug: string) {
  const list = read();
  if (list.includes(slug)) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify([...list, slug]));
  } catch {
    return;
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useCompleted(): string[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
