import { describe, it, expect } from "vitest";
import { catalog, algorithms } from "@/lib/algorithms";
import { playable, firstLesson, locate, pad2 } from "./course";

describe("course", () => {
  it("playable lessons are exactly the implemented algorithms, in catalog order", () => {
    expect(playable.map((a) => a.slug)).toEqual(
      catalog.flatMap((c) => c.algos).filter((a) => algorithms.some((x) => x.slug === a.slug)).map((a) => a.slug),
    );
    expect(playable.every((a) => a.ready)).toBe(true);
  });

  it("the course runs Sorting → Searching → Graphs → Trees, and lessons cross chapter boundaries", () => {
    expect(locate("shell-sort")!.next?.slug).toBe("linear-search");
    expect(locate("binary-search")!.next?.slug).toBe("bfs");
    expect(locate("dijkstra")!.next?.slug).toBe("bst-insert");
    expect(locate("bfs")!.chapterNo).toBe(3);
  });

  it("opens on the first playable lesson", () => {
    expect(firstLesson.slug).toBe("bubble-sort");
  });

  it("locates a lesson inside its chapter", () => {
    const loc = locate("selection-sort")!;
    expect(loc.chapter.name).toBe("Sorting");
    expect(loc.chapterNo).toBe(1);
    expect(loc.lessonNo).toBe(3);
    expect(loc.lessonCount).toBe(7);
    expect(loc.prev?.slug).toBe("insertion-sort");
    expect(loc.next?.slug).toBe("quick-sort");
  });

  it("the first lesson has no prev, the last playable has no next", () => {
    expect(locate(playable[0].slug)!.prev).toBeUndefined();
    expect(locate(playable[playable.length - 1].slug)!.next).toBeUndefined();
  });

  it("roadmap lessons are located but never link anywhere playable-adjacent", () => {
    const loc = locate("topological-sort")!;
    expect(loc.chapterNo).toBe(3);
    expect(loc.prev).toBeUndefined();
    expect(loc.next).toBeUndefined();
  });

  it("unknown slugs are not in the course", () => {
    expect(locate("nope")).toBeUndefined();
  });

  it("pads lesson numbers", () => {
    expect(pad2(3)).toBe("03");
    expect(pad2(12)).toBe("12");
  });
});
