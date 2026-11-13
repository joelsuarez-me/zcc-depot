import { useMemo } from "react";
import { ResearchMarkdown } from "@/components/research-markdown";
import { SectionGlyph } from "@/components/art";
import { splitResearchAgenda } from "@/lib/research-agenda";

const GLYPH: Record<string, string> = {
  "Company and objective": "outcome",
  "Current platforms": "system",
  "Today’s conversation": "channel",
  "Questions to validate": "faq",
  "Desired outcomes": "outcome",
};

const card = "rounded-[1.6rem] border border-[#d9ddd2] bg-[#fbfbf6] p-5 md:p-8";
const field = "mt-2 min-w-0 break-words [overflow-wrap:anywhere] rounded-xl border border-[#d5d8cd] bg-[#fffefa] px-4 py-3.5 text-[#17251e]";

export function ResearchAgendaCards({ markdown, companyName, streaming = false }: { markdown: string; companyName: string; streaming?: boolean }) {
  const sections = useMemo(() => splitResearchAgenda(markdown), [markdown]);
  return (
    <div className="space-y-5" data-testid="list-report-agenda">
      {sections.map((s, i) => {
        const headId = `${s.id}-heading`;
        const isFirst = s.title === "Company and objective";
        const isSources = s.title === "Sources";
        const last = i === sections.length - 1;
        return (
          <section key={s.id} id={s.id} aria-labelledby={headId} data-testid="report-agenda-section" data-section-title={s.title}
            className={`${card} ${isSources ? "bg-[#f3f4ec]" : ""}`}>
            {isFirst && <div className="eyebrow flex items-center text-[#728075]">Demo brief<SectionGlyph label="outcome" /></div>}
            <h3 id={headId} className={`flex flex-wrap items-center gap-2 break-words text-2xl font-semibold tracking-tight text-[#203a2c] ${isFirst ? "mt-2" : ""}`}>
              {s.title}{GLYPH[s.title] && !isFirst && <SectionGlyph label={GLYPH[s.title]} />}
            </h3>
            {isFirst ? (
              <div className="mt-6 grid gap-5 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
                <div>
                  <p className="text-sm font-semibold text-[#304c38]">Company name</p>
                  <p className={`${field} text-[0.94rem] font-medium`} data-testid="text-agenda-company-name">{companyName}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#304c38]">Objective</p>
                  <div className={`${field} min-w-0 [&>*:first-child]:mt-0`}>
                    {s.markdown ? <ResearchMarkdown markdown={s.markdown} /> : <p className="text-sm text-[#69756d]/70">{streaming && last ? "Researching…" : "No objective returned."}</p>}
                  </div>
                </div>
              </div>
            ) : (
              <div className={`${field} mt-5 min-w-0 [&>*:first-child]:mt-0 ${isSources ? "text-sm" : ""}`}>
                {s.markdown ? <ResearchMarkdown markdown={s.markdown} /> : <p className="text-sm text-[#69756d]/70">{streaming && last ? "Researching…" : "No content returned for this section."}</p>}
                {streaming && last && <span className="mt-2 inline-block h-4 w-2 animate-pulse bg-[#203524]" aria-hidden />}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
