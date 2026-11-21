import Link from "next/link";

export function TopBar() {
  return (
    <header className="shrink-0 flex items-center h-14 px-5 sm:px-8 border-b border-[var(--seam)] relative z-30">
      <Link href="/" className="flex items-center gap-2.5 rounded-md text-[var(--ink)] transition-opacity hover:opacity-75">
        {/* tiny monitor mark */}
        <span aria-hidden="true" className="relative w-[22px] h-[18px] rounded-[5px] bg-[var(--chassis-raised)] border border-[var(--seam-strong)] shadow-[var(--shadow-key)] grid place-items-center">
          <span className="w-[14px] h-[9px] rounded-[2px] bg-[var(--glass)] grid place-items-center">
            <span className="w-[6px] h-[2px] bg-[var(--phosphor)] rounded-full" />
          </span>
        </span>
        <span className="font-display text-[24px] leading-none tracking-[-0.01em]">Algorithm Visualizer</span>
        <span className="label !text-[9px] px-1.5 py-[1px] rounded border border-[var(--seam-strong)] hidden sm:inline">AV-1</span>
      </Link>
      <div className="ml-auto flex items-center gap-4">
        <span aria-hidden="true" className="vents hidden md:flex">{Array.from({ length: 9 }).map((_, i) => <span key={i} />)}</span>
        <span className="label flex items-center gap-2">
          <span className="led led-on bg-[var(--sorted)] text-[var(--sorted)]" /> ready
        </span>
      </div>
    </header>
  );
}
