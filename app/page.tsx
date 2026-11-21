import { TopBar } from "@/components/TopBar";
import { HeroMini } from "@/components/catalog/HeroMini";
import { AlgorithmCard } from "@/components/catalog/AlgorithmCard";
import { catalog } from "@/lib/algorithms";

export default function CatalogPage() {
  const total = catalog.reduce((n, c) => n + c.algos.length, 0);

  return (
    <div className="min-h-screen bg-[var(--background)] relative flex flex-col">
      <div className="pointer-events-none absolute inset-0 z-0 bp-dotgrid opacity-60" />
      <div className="relative z-10 flex flex-col min-h-screen">
        <TopBar breadcrumbs={["Catalog"]} />

        {/* hero */}
        <header className="px-6 sm:px-12 pt-10 pb-8 border-b border-[var(--border-shell)]">
          <div className="flex flex-col lg:flex-row lg:items-center gap-8 justify-between">
            <div>
              <div className="flex items-center gap-2 text-[11px] tracking-[0.25em] uppercase text-[var(--primary)] mb-3">
                <span className="w-1.5 h-1.5 bg-[var(--primary)] bp-pulse" />algorithm index
              </div>
              <h1 className="text-[32px] sm:text-[40px] font-bold text-white leading-none tracking-tight mb-4">
                Watch algorithms <span className="text-[var(--primary)]">think.</span>
              </h1>
              <p className="text-[13px] text-[var(--text-secondary)] max-w-[46ch] leading-relaxed mb-6">
                Step through sorting, graph, and tree algorithms frame by frame — scrub the
                execution, read the trace, and see every compare and swap as it happens.
              </p>
              <div className="flex flex-wrap gap-3 text-[11px]">
                {([["algorithms", total], ["categories", catalog.length], ["live", 1]] as const).map(([label, val]) => (
                  <div key={label} className="bp-frame flex items-center gap-2 px-3 py-1.5 bg-[var(--background-surface)] border border-[var(--border-shell)]">
                    <span className="text-[16px] font-bold tabular-nums text-[var(--primary)]">{val}</span>
                    <span className="uppercase tracking-widest text-[var(--text-muted)]">{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <HeroMini />
          </div>
        </header>

        {/* catalog */}
        <main className="flex-1 w-full px-6 sm:px-12 py-10 flex flex-col gap-12">
          {catalog.map((category, catIdx) => (
            <section key={category.id} className="w-full">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-1 h-5 bg-[var(--primary)]" style={{ boxShadow: "0 0 8px var(--primary)" }} />
                <span className="text-[13px] text-[var(--primary)] tabular-nums">{(catIdx + 1).toString().padStart(2, "0")}</span>
                <h2 className="text-[18px] font-semibold text-white tracking-wide uppercase">{category.name}</h2>
                <span className="text-[10px] text-[var(--text-muted)] tracking-widest uppercase">{category.algos.length} algorithms</span>
                <div className="flex-1 border-t border-dashed border-[var(--border-shell)]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.algos.map((algo, i) => (
                  <AlgorithmCard key={algo.slug} algo={algo} index={i} />
                ))}
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}
