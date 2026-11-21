import { catalog, type CatalogAlgo, type CatalogCategory } from "@/lib/algorithms";

/**
 * The catalog read as a course: chapters (categories) of lessons (algorithms).
 * Only `ready` lessons are playable; the rest are listed as "soon".
 */
export const playable: CatalogAlgo[] = catalog.flatMap((c) => c.algos.filter((a) => a.ready));

/** Where the app opens: the first playable lesson of the first chapter. */
export const firstLesson: CatalogAlgo = playable[0];

export interface CourseLocation {
  chapter: CatalogCategory;
  chapterNo: number;   // 1-based
  lessonNo: number;    // 1-based within the chapter
  lessonCount: number; // lessons in the chapter, including "soon"
  prev?: CatalogAlgo;  // previous / next *playable* lesson across chapters
  next?: CatalogAlgo;
}

export function locate(slug: string): CourseLocation | undefined {
  const chapterIdx = catalog.findIndex((c) => c.algos.some((a) => a.slug === slug));
  if (chapterIdx < 0) return undefined;
  const chapter = catalog[chapterIdx];
  const i = playable.findIndex((a) => a.slug === slug);
  return {
    chapter,
    chapterNo: chapterIdx + 1,
    lessonNo: chapter.algos.findIndex((a) => a.slug === slug) + 1,
    lessonCount: chapter.algos.length,
    prev: i > 0 ? playable[i - 1] : undefined,
    next: i >= 0 && i < playable.length - 1 ? playable[i + 1] : undefined,
  };
}

export const pad2 = (n: number) => String(n).padStart(2, "0");
