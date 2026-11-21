import Link from "next/link";
import type { CatalogAlgo } from "@/lib/algorithms";

function CardGlyph({ categoryId }: { categoryId: string }) {
  const stroke = "var(--primary)";
  if (categoryId === "graphs") {
    return (
      <svg viewBox="0 0 120 44" className="w-full h-11" preserveAspectRatio="none">
        <g stroke={stroke} strokeOpacity="0.4" strokeWidth="1">
          <line x1="20" y1="34" x2="55" y2="12" /><line x1="55" y1="12" x2="90" y2="30" />
          <line x1="20" y1="34" x2="60" y2="38" /><line x1="60" y1="38" x2="90" y2="30" />
        </g>
        {[[20, 34], [55, 12], [90, 30], [60, 38]].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="4" fill="var(--background-card)" stroke={stroke} strokeOpacity={i === 0 ? 1 : 0.55} strokeWidth="1.5" />
        ))}
      </svg>
    );
  }
  if (categoryId === "trees") {
    return (
      <svg viewBox="0 0 120 44" className="w-full h-11" preserveAspectRatio="none">
        <g stroke={stroke} strokeOpacity="0.4" strokeWidth="1">
          <line x1="60" y1="8" x2="34" y2="26" /><line x1="60" y1="8" x2="86" y2="26" />
          <line x1="34" y1="26" x2="22" y2="40" /><line x1="34" y1="26" x2="46" y2="40" />
        </g>
        {[[60, 8, 1], [34, 26, 0.6], [86, 26, 0.6], [22, 40, 0.45], [46, 40, 0.45]].map(([cx, cy, o], i) => (
          <rect key={i} x={(cx as number) - 3.5} y={(cy as number) - 3.5} width="7" height="7" fill="var(--background-card)" stroke={stroke} strokeOpacity={o as number} strokeWidth="1.5" />
        ))}
      </svg>
    );
  }
  const bars = [16, 26, 20, 34, 40, 30, 44];
  return (
    <svg viewBox="0 0 120 44" className="w-full h-11" preserveAspectRatio="none">
      {bars.map((h, i) => {
        const w = 120 / bars.length;
        const sorted = i >= bars.length - 2;
        return <rect key={i} x={i * w + 2} y={44 - h} width={w - 4} height={h} fill={sorted ? "var(--sorted-dim)" : "var(--primary-dim)"} stroke={sorted ? "var(--sorted)" : stroke} strokeOpacity={sorted ? 0.9 : 0.5} strokeWidth="1" />;
      })}
    </svg>
  );
}

export function AlgorithmCard({ algo, index }: { algo: CatalogAlgo; index: number }) {
  const inner = (
    <>
      <div className="absolute top-0 left-0 right-0 h-px bg-[var(--primary)] opacity-0 group-hover:opacity-80 transition-opacity" style={{ boxShadow: "0 0 10px var(--primary)" }} />
      <div className="relative z-10 flex items-start justify-between mb-3">
        <h3 className="text-[15px] font-semibold text-[var(--text-primary)] group-hover:text-white transition-colors">
          <span className="text-[var(--primary)] mr-2 tabular-nums">{(index + 1).toString().padStart(2, "0")}</span>{algo.name}
        </h3>
        <span className="shrink-0 text-[9px] tracking-widest uppercase px-1.5 py-0.5 border"
          style={algo.ready ? { color: "var(--sorted)", borderColor: "var(--sorted)", background: "var(--sorted-dim)" } : { color: "var(--text-muted)", borderColor: "var(--border-shell)" }}>
          {algo.ready ? "● ready" : "◦ soon"}
        </span>
      </div>
      <div className="relative z-10 mb-3 px-1 py-1 bg-[var(--background-app)] border border-[var(--border-card)]"><CardGlyph categoryId={algo.categoryId} /></div>
      <p className="relative z-10 text-[12px] text-[var(--text-secondary)] mb-4 flex-1 leading-relaxed">{algo.description}</p>
      <div className="relative z-10 flex items-center justify-between mt-auto">
        <div className="flex gap-1.5 flex-wrap">
          {([["Time", algo.time], ["Space", algo.space]] as const).map(([t, v]) => (
            <span key={t} className="px-1.5 py-0.5 bg-[var(--background-shell)] border border-[var(--border-shell)] text-[11px] flex items-center gap-1">
              <span className="text-[var(--text-muted)] uppercase tracking-wider text-[9px]">{t}</span><span className="text-[var(--primary)]">{v}</span>
            </span>
          ))}
        </div>
        <span className="text-[10px] tracking-widest uppercase text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">{algo.ready ? "open ▸" : "soon"}</span>
      </div>
    </>
  );

  const cls = "bp-frame group relative overflow-hidden flex flex-col w-full text-left p-4 bg-[var(--background-card)] border border-[var(--border-card)] transition-all duration-150 outline-none focus-visible:ring-1 focus-visible:ring-[var(--primary)]";

  if (!algo.ready) {
    return <div className={`${cls} opacity-70`} aria-disabled>{inner}</div>;
  }
  return (
    <Link href={`/algorithms/${algo.slug}`} className={`${cls} hover:border-[var(--primary)] hover:bg-[var(--background-card-hover)]`}>{inner}</Link>
  );
}
