import { useMemo, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { COMPARISON_CATEGORIES, COMPARISON_ROWS, COMPARISON_SOURCES, type ComparisonCategory } from "@/data/voice-comparison";
import { Ext } from "@/components/kit";

const srcById = Object.fromEntries(COMPARISON_SOURCES.map(s => [s.id, s]));

export function Matrix() {
  const [cat, setCat] = useState<ComparisonCategory | "All">("All");
  const rows = useMemo(() => cat === "All" ? COMPARISON_ROWS : COMPARISON_ROWS.filter(r => r.category === cat), [cat]);
  const opts: (ComparisonCategory | "All")[] = ["All", ...COMPARISON_CATEGORIES];
  return (
    <div>
      <div role="group" aria-label="Filter capabilities by category" className="mb-4 flex flex-wrap gap-2">
        {opts.map(o => (
          <button key={o} type="button" className="vc-chip" aria-pressed={cat === o} onClick={() => setCat(o)} data-testid={`button-filter-${o.toLowerCase()}`}>
            {o}<span className="mono text-[0.7rem] opacity-70">{o === "All" ? COMPARISON_ROWS.length : COMPARISON_ROWS.filter(r => r.category === o).length}</span>
          </button>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">{rows.length} capability rows shown</p>
      <div className="vc-card !p-4 md:!p-6">
        <div className="hidden gap-5 pb-3 md:grid-cols-[13rem_1fr_1fr] min-[900px]:grid" aria-hidden>
          <span className="eyebrow text-[#11110D]/60">Topic</span>
          <span className="eyebrow text-[#11110D]">Zendesk Voice</span>
          <span className="eyebrow text-[#203524]">Zendesk Contact Center</span>
        </div>
        {rows.map(r => (
          <article key={r.id} className="vc-row" data-testid={`row-compare-${r.id}`} aria-labelledby={`row-${r.id}`}>
            <div>
              <span className="mono text-[0.68rem] uppercase tracking-wider text-[#203524]/75">{r.category}</span>
              <h3 id={`row-${r.id}`} className="mt-1 text-lg font-semibold leading-tight">{r.topic}</h3>
            </div>
            <div className="vc-cell is-voice"><span className="vc-cell-label vc-sm-only text-[#203524]">Zendesk Voice</span>{r.voice}</div>
            <div className="vc-cell is-zcc"><span className="vc-cell-label vc-sm-only text-[#D1F470]">Zendesk Contact Center</span>{r.contactCenter}</div>
            <div className="vc-confirm">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#203524]" aria-hidden />
              <div>
                <strong className="font-semibold">Confirm: </strong>{r.confirm}
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                  {r.sources.map(s => <Ext key={s} href={srcById[s].url} className="font-semibold text-[#203524] underline decoration-[#203524]/30 underline-offset-2 hover:decoration-[#203524]" testId={`link-row-${r.id}-${s}`}>{srcById[s].title}</Ext>)}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
