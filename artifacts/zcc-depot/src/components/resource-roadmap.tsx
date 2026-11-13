import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Note, Section, SectionHead } from "@/components/kit";
import { PresenterOnly } from "@/components/presenter";
import { usePresenterContent } from "@/hooks/use-presenter-content";

type View = "executive" | "technical" | "internal";
const labels: Record<View, string> = { executive: "Executive roadmap", technical: "Technical roadmap", internal: "Internal planning horizon" };

function RoadmapBody() {
  const [tab, setTab] = useState<View>("executive");
  const { data, isLoading, isError, refetch } = usePresenterContent();
  if (isLoading) return <div className="grid gap-4 md:grid-cols-4" aria-busy="true">{[0, 1, 2, 3].map((k) => <div key={k} className="h-56 animate-pulse rounded-3xl bg-[#11110D]/6" />)}</div>;
  if (isError || !data) return <div className="rounded-2xl border border-[#11110D]/10 p-6 text-sm">Roadmap could not be loaded. <button type="button" className="underline" onClick={() => void refetch()} data-testid="button-roadmap-retry">Retry</button></div>;
  const roadmap = data.legacy.roadmap;
  return (
    <>
      <div className="mb-8 flex gap-4 rounded-2xl border-2 border-[#11110D] bg-[#D1F470]/40 p-5">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div className="text-sm leading-relaxed"><strong>Confidential planning snapshot · last updated February 2026.</strong> Summarizes the attached Zendesk roadmap. Dates, statuses, and concepts reflect that source deck; plans may change and are not commitments. Share only under applicable confidentiality terms, and confirm current status and approved wording before external use.</div>
      </div>
      <div role="tablist" aria-label="Roadmap views" className="mb-6 flex flex-wrap gap-2">
        {(Object.keys(labels) as View[]).map((key) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)} data-testid={`tab-roadmap-${key}`} className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${tab === key ? "bg-[#11110D] text-[#D1F470]" : "border border-[#11110D]/15 hover:border-[#11110D]"}`}>{labels[key]}</button>
        ))}
      </div>
      <div role="tabpanel" aria-label={labels[tab]} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {roadmap[tab].map((item, index) => (
          <div key={item.when + item.t} className="relative rounded-3xl border border-[#11110D]/10 bg-[#FBFBF8] p-6">
            <div className="mb-5 flex items-center gap-3"><span className="h-3 w-3 rounded-full border-2 border-[#11110D]" style={{ background: index === 0 ? "#11110D" : "transparent" }} /><span className="mono text-xs">{item.when}</span></div>
            <h3 className="text-lg font-semibold">{item.t}</h3>
            {item.d && <p className="mt-2 text-sm text-[#11110D]/65">{item.d}</p>}
            <ul className="mt-4 space-y-2">{item.items.map((text) => <li key={text} className="rounded-xl bg-[#11110D]/5 px-3 py-2 text-sm">{text}</li>)}</ul>
          </div>
        ))}
      </div>
      <Note>Source: Zendesk Contact Center Roadmap presentation. Product concepts and mockups are illustrative; actual products may differ.</Note>
    </>
  );
}

export function ResourceRoadmap() {
  return (
    <PresenterOnly title="Confidential roadmap">
      <Section>
        <SectionHead id="roadmap" eyebrow="Roadmap · confidential" title="Executive, technical, and internal horizons" lede="A phased view of the Contact Center experience. Not for unqualified customer distribution." />
        <RoadmapBody />
      </Section>
    </PresenterOnly>
  );
}
