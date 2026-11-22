import type { StageMode } from "@/lib/motion";
import { T, at } from "@/lib/motion";

/**
 * The glass's own transition, layered over the picture. Purely decorative
 * (aria-hidden, no pointer events); each variant is a one-shot CSS animation
 * that ends hidden, so it never blocks the stage it covers.
 */
export function CrtTransition({ mode, channel }: { mode: StageMode; channel: string }) {
  if (mode === "intro") {
    return (
      <div className="crt-boot font-mono" style={at(T.boot)} data-testid="crt-boot" aria-hidden="true">
        <span className="text-[10px] tracking-[0.2em] uppercase text-[var(--phosphor)] phosphor-text">AV-1 · warming up</span>
        <span className="crt-boot-bar"><span style={at(T.boot + 80)} /></span>
      </div>
    );
  }
  if (mode === "channel") {
    return (
      <div className="crt-channel font-mono" data-testid="crt-channel" aria-hidden="true">
        <span className="text-[11px] tracking-[0.2em] uppercase text-[var(--phosphor)] phosphor-text">{channel}</span>
      </div>
    );
  }
  return <div className="crt-static" data-testid="crt-static" aria-hidden="true" />;
}

/** When the picture itself opens, per mode. */
export const pictureOpens = (mode: StageMode) => (mode === "intro" ? T.picture : mode === "channel" ? 120 : 0);
