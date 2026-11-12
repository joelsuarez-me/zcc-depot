import { useState, type ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Plus, AlertTriangle } from "lucide-react";
import { Ext, Note, PageHero, Reveal, Section, SectionHead } from "@/components/kit";
import { FAQ, GTM, LINKS, OUTCOMES, ROADMAP, USE_CASES } from "@/data/content";

function Details({ q, children, testId }: { q: string; children: ReactNode; testId: string }) {
  return (
    <details className="group border-b border-[#11110D]/10 [&_summary::-webkit-details-marker]:hidden" data-testid={testId}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg font-medium transition-colors hover:text-[#203524]">
        {q}<span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#11110D]/15 transition-transform group-open:rotate-45 group-open:bg-[#D1F470]"><Plus className="h-4 w-4" /></span>
      </summary>
      <div className="pb-6 pr-12 leading-relaxed text-[#11110D]/70">{children}</div>
    </details>
  );
}

function UseCases() {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();
  const u = USE_CASES[i];
  const col = (title: string, items: string[], cls: string) => (
    <div className={`rounded-2xl p-5 ${cls}`}><div className="eyebrow mb-3 opacity-70">{title}</div><ul className="space-y-2">{items.map((x) => <li key={x} className="flex gap-2 text-[15px]"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />{x}</li>)}</ul></div>
  );
  return (
    <>
      <div role="tablist" aria-label="Use cases" className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {USE_CASES.map((x, k) => (
          <button key={k} role="tab" aria-selected={i === k} onClick={() => setI(k)} data-testid={`tab-usecase-${k + 1}`}
            className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition ${i === k ? "bg-[#203524] text-[#D1F470]" : "border border-[#11110D]/15 hover:border-[#203524]"}`}>
            <span className="mono mr-2 opacity-60">0{k + 1}</span>{x.t.split(" ").slice(0, 4).join(" ")}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={i} role="tabpanel" initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.3 }}
          className="rounded-[2rem] border border-[#11110D]/10 bg-[#FBFBF8] p-6 md:p-10">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="serif text-7xl leading-none text-[#203524]/20">0{i + 1}</div>
              <h3 className="mt-4 text-3xl font-semibold leading-tight tracking-tight">{u.t}</h3>
              <div className="eyebrow mt-6 text-[#203524]">The scenario</div>
              <p className="mt-2 text-lg leading-relaxed text-[#11110D]/75">{u.scenario}</p>
            </div>
            <div className="grid gap-3 lg:col-span-7">
              {col("What's really broken", u.broken, "bg-[#11110D]/5")}
              {col("What Zendesk Contact Center enables", u.enables, "bg-[#203524] text-[#F5F5F2]")}
              {col("Business outcome", u.outcome, "bg-[#D1F470]")}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

function OperatingModel() {
  const [v, setV] = useState<"today" | "evolving">("today");
  const data = v === "today"
    ? { k: "Current team", t: "People manage each part of service", roles: ["Tier 1–3 agents", "Supervisors and quality teams", "Knowledge managers", "Workforce managers"], d: "Teams coordinate queues, schedules, knowledge, and quality across customer interactions." }
    : { k: "People + AI", t: "AI takes routine work; specialists guide outcomes", roles: ["AI agents", "Agent copilots", "SME agents", "AI service architects"], d: "AI agents handle suitable requests, copilots support live agents, and specialists improve knowledge and workflows." };
  return (
    <div>
      <div role="tablist" className="mb-6 inline-flex rounded-full bg-[#F5F5F2]/10 p-1">
        {(["today", "evolving"] as const).map((x) => (
          <button key={x} role="tab" aria-selected={v === x} onClick={() => setV(x)} data-testid={`tab-model-${x}`} className={`rounded-full px-5 py-2 text-sm font-medium transition ${v === x ? "bg-[#D1F470] text-[#11110D]" : "text-[#F5F5F2]/70"}`}>{x === "today" ? "Today" : "Evolving model"}</button>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div><div className="eyebrow text-[#D1F470]">{data.k}</div><h3 className="mt-3 text-3xl font-semibold">{data.t}</h3><p className="mt-3 text-[#F5F5F2]/70">{data.d}</p></div>
        <div className="grid grid-cols-2 gap-3">
          {data.roles.map((r, k) => (
            <motion.div key={v + r} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: k * 0.06 }} className={`rounded-2xl p-5 ${v === "evolving" && k < 2 ? "bg-[#D1F470] text-[#11110D]" : "border border-[#F5F5F2]/15"}`}>
              <div className="mono text-xs opacity-50">0{k + 1}</div><div className="mt-6 font-semibold">{r}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Roadmap() {
  const [tab, setTab] = useState<keyof typeof ROADMAP>("executive");
  const labels = { executive: "Executive roadmap", technical: "Technical roadmap", internal: "Internal planning horizon" };
  return (
    <div>
      <div className="mb-8 flex gap-4 rounded-2xl border-2 border-[#203524] bg-[#D1F470]/40 p-5">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div className="text-sm leading-relaxed"><strong>Confidential planning snapshot · last updated February 2026.</strong> Summarizes the attached Zendesk roadmap. Dates, statuses, and concepts reflect that source deck; plans may change and are not commitments. Share only under applicable confidentiality terms, and confirm current status and approved wording before external use.</div>
      </div>
      <div role="tablist" className="mb-6 flex flex-wrap gap-2">
        {(Object.keys(labels) as (keyof typeof ROADMAP)[]).map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} data-testid={`tab-roadmap-${k}`} className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${tab === k ? "bg-[#203524] text-[#D1F470]" : "border border-[#11110D]/15 hover:border-[#203524]"}`}>{labels[k]}</button>
        ))}
      </div>
      <div role="tabpanel" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ROADMAP[tab].map((r, k) => (
          <div key={r.when + r.t} className="relative rounded-3xl border border-[#11110D]/10 bg-[#FBFBF8] p-6">
            <div className="mb-5 flex items-center gap-3"><span className="h-3 w-3 rounded-full border-2 border-[#203524]" style={{ background: k === 0 ? "#203524" : "transparent" }} /><span className="mono text-xs">{r.when}</span></div>
            <h3 className="text-lg font-semibold">{r.t}</h3>
            {r.d && <p className="mt-2 text-sm text-[#11110D]/65">{r.d}</p>}
            <ul className="mt-4 space-y-2">{r.items.map((x) => <li key={x} className="rounded-xl bg-[#11110D]/5 px-3 py-2 text-sm">{x}</li>)}</ul>
          </div>
        ))}
      </div>
      <Note>Source: Zendesk Contact Center Roadmap presentation. Product concepts and mockups are illustrative; actual products may differ.</Note>
    </div>
  );
}

export default function Sales() {
  return (
    <>
      <PageHero eyebrow="Sales · Customer outcomes" title={<>Features are interesting. <span className="serif italic text-[#D1F470]">Use cases are sellable.</span></>}
        lede={<>You do not need to be a contact center architect to start these conversations. Recognize the pattern and confidently say, <span className="text-[#D1F470]">"We can help with that."</span></>}>
        {[["#use-cases", "Use cases"], ["#outcomes", "Outcomes"], ["#operating-model", "Human + AI"], ["#faq", "FAQ"], ["#roadmap", "Roadmap"], ["#guidance", "Presentation guidance"]].map(([h, l]) => (
          <a key={h} href={h} className="rounded-full border border-[#F5F5F2]/20 px-4 py-2 text-sm hover:border-[#D1F470] hover:text-[#D1F470]" data-testid={`link-jump-${h.slice(1)}`}>{l}</a>
        ))}
      </PageHero>

      <Section>
        <SectionHead id="use-cases" num="08" eyebrow="Customer use cases" title="Top 5 use cases" lede="Five customer pains, five conversation starters, and the outcomes Zendesk Contact Center can support." />
        <UseCases />
      </Section>

      <Section tone="white">
        <SectionHead id="outcomes" num="15" eyebrow="Customer outcomes" title="Proof, in their numbers" lede="Examples from the Contact Center pitch deck show how teams use voice, digital channels, and AI to improve service operations." />
        <div className="grid gap-4 lg:grid-cols-4">
          {OUTCOMES.map((o, k) => (
            <Reveal key={o.co} delay={k * 0.06} className="rounded-3xl border border-[#11110D]/10 p-7">
              <div className="eyebrow text-[#203524]">{o.co}</div><p className="mt-1 text-sm text-[#11110D]/55">{o.theme}</p>
              {o.stats.map(([v, l]) => <div key={l} className="mt-6"><div className="text-4xl font-semibold tracking-tight">{v}</div><div className="text-sm text-[#11110D]/60">{l}</div></div>)}
            </Reveal>
          ))}
          <Reveal delay={0.2} className="rounded-3xl bg-[#D1F470] p-7">
            <div className="eyebrow">Forrester Total Economic Impact</div>
            <div className="mt-6 text-6xl font-semibold tracking-tight">301%</div><div className="text-sm">three-year ROI</div>
            <p className="mt-6 text-sm text-[#11110D]/70">Study-specific estimate for a composite Zendesk customer, with payback in under six months.</p>
          </Reveal>
        </div>
        <Note>Sources: Zendesk Contact Center pitch deck customer proof slides and the commissioned Forrester Consulting study. Confirm approved public-use wording before external distribution.</Note>
      </Section>

      <Section tone="forest">
        <SectionHead id="operating-model" num="16" eyebrow="Human + AI operating model" dark title="How contact center roles evolve" lede="As AI handles more routine work, people can focus on complex cases, knowledge, and service quality." />
        <OperatingModel />
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4"><SectionHead id="faq" num="17" eyebrow="FAQ" title="Short answers, carefully qualified" /></div>
          <div className="lg:col-span-8">
            {FAQ.map(([q, a], k) => <Details key={q} q={q} testId={`faq-${k}`}>{a}</Details>)}
            <Note>Answers summarize <Ext href={LINKS.product} className="underline">Zendesk's Contact Center page</Ext>. Product, compliance, and performance claims should be checked against the current plan and agreement.</Note>
          </div>
        </div>
      </Section>

      <Section tone="white">
        <SectionHead id="roadmap" num="18" eyebrow="Roadmap · confidential" title="Executive, technical, and internal horizons" lede="A phased view of the Contact Center experience. Not for unqualified customer distribution." />
        <Roadmap />
      </Section>

      <Section>
        <SectionHead id="guidance" num="GTM" eyebrow="Presentation guidance · internal" title="Level 1 Foundation seller reference" lede="Recognize customer pain, tell the platform story, qualify early fit, and bring in the right specialists." />
        <div className="rounded-[2rem] border border-[#11110D]/10 bg-[#FBFBF8] px-6 md:px-10">
          {GTM.map((g, k) => (
            <Details key={g.t} q={g.t} testId={`gtm-${k}`}>
              <p>{g.body}</p>
              <ul className="mt-4 space-y-2">{g.list.map((x) => <li key={x} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#203524]" />{x}</li>)}</ul>
            </Details>
          ))}
          <div className="py-5"><Ext href={LINKS.gtmDoc} className="text-sm font-semibold underline" testId="link-gtm-doc">Open the internal GTM guide (Zendesk access required)</Ext></div>
        </div>
        <Note>Internal enablement summary; verify current commercial and implementation details before customer commitments.</Note>
      </Section>
    </>
  );
}
