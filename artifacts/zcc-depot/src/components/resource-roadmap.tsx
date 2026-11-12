import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Note, Section, SectionHead } from "@/components/kit";
import { ROADMAP } from "@/data/content";

export function ResourceRoadmap() {
  const [tab, setTab] = useState<keyof typeof ROADMAP>("executive");
  const labels = { executive: "Executive roadmap", technical: "Technical roadmap", internal: "Internal planning horizon" };
  return (
    <Section>
      <SectionHead id="roadmap" eyebrow="Roadmap · confidential" title="Executive, technical, and internal horizons" lede="A phased view of the Contact Center experience. Not for unqualified customer distribution." />
      <div className="mb-8 flex gap-4 rounded-2xl border-2 border-[#203524] bg-[#D1F470]/40 p-5">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div className="text-sm leading-relaxed"><strong>Confidential planning snapshot · last updated February 2026.</strong> Summarizes the attached Zendesk roadmap. Dates, statuses, and concepts reflect that source deck; plans may change and are not commitments. Share only under applicable confidentiality terms, and confirm current status and approved wording before external use.</div>
      </div>
      <div role="tablist" aria-label="Roadmap views" className="mb-6 flex flex-wrap gap-2">
        {(Object.keys(labels) as (keyof typeof ROADMAP)[]).map(key => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)} data-testid={`tab-roadmap-${key}`} className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${tab === key ? "bg-[#203524] text-[#D1F470]" : "border border-[#11110D]/15 hover:border-[#203524]"}`}>{labels[key]}</button>
        ))}
      </div>
      <div role="tabpanel" aria-label={labels[tab]} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ROADMAP[tab].map((item, index) => (
          <div key={item.when + item.t} className="relative rounded-3xl border border-[#11110D]/10 bg-[#FBFBF8] p-6">
            <div className="mb-5 flex items-center gap-3"><span className="h-3 w-3 rounded-full border-2 border-[#203524]" style={{ background: index === 0 ? "#203524" : "transparent" }} /><span className="mono text-xs">{item.when}</span></div>
            <h3 className="text-lg font-semibold">{item.t}</h3>
            {item.d && <p className="mt-2 text-sm text-[#11110D]/65">{item.d}</p>}
            <ul className="mt-4 space-y-2">{item.items.map(text => <li key={text} className="rounded-xl bg-[#11110D]/5 px-3 py-2 text-sm">{text}</li>)}</ul>
          </div>
        ))}
      </div>
      <Note>Source: Zendesk Contact Center Roadmap presentation. Product concepts and mockups are illustrative; actual products may differ.</Note>
    </Section>
  );
}
