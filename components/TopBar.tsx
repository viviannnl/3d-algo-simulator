import Link from "next/link";

export function TopBar({ breadcrumbs = [] as string[] }) {
  return (
    <header className="shrink-0 flex items-center h-12 px-5 bg-[var(--background-shell)] border-b border-[var(--border-shell)] relative z-30" style={{ backdropFilter: "blur(12px)" }}>
      <Link href="/" className="flex items-center gap-2 text-[15px] font-bold text-white hover:text-[var(--primary)] transition-colors outline-none focus-visible:ring-1 focus-visible:ring-[var(--primary)]">
        <span className="text-[var(--primary)]">~</span> AlgoViz
      </Link>
      <div className="flex items-center gap-2 ml-5 text-[12px] text-[var(--text-muted)]">
        {breadcrumbs.map((b, i) => (
          <span key={i} className="flex items-center gap-2">
            <span className="text-[var(--border)]">›</span>
            <span className={i === breadcrumbs.length - 1 ? "text-[var(--text-secondary)]" : ""}>{b}</span>
          </span>
        ))}
      </div>
      <div className="ml-auto text-[10px] tracking-widest uppercase text-[var(--text-muted)] flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-[var(--sorted)] bp-pulse" /> local
      </div>
    </header>
  );
}
