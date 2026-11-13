import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";
import { Ext, Note, PageHero, Reveal, Section, SectionHead } from "@/components/kit";
import { LINKS, OUTCOMES, USE_CASES } from "@/data/content";
import { PresenterOnly } from "@/components/presenter";
import { usePresenterContent } from "@/hooks/use-presenter-content";

function Details({ q, children, testId }: { q: string; children: ReactNode; testId: string }) {
  return (
    <details className="group border-b border-[#11110D]/10 [&_summary::-webkit-details-marker]:hidden" data-testid={testId}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg font-medium transition-colors hover:text-[#203524]">
        {q}<span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#11110D]/15 transition-transform group-open:rotate-45 group-open:bg-[#D1F470]"><Plus className="h-4 w-4" aria-hidden /></span>
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

export default function Sales() {
  const [, navigate] = useLocation();
  useEffect(() => {
    const redirectFaq = () => {
      if (window.location.hash === "#faq") navigate("/resources#faq", { replace: true });
      else if (window.location.hash === "#roadmap") navigate("/resources#roadmap", { replace: true });
    };
    redirectFaq();
    window.addEventListener("hashchange", redirectFaq);
    return () => window.removeEventListener("hashchange", redirectFaq);
  }, [navigate]);
  return (
    <>
      <PageHero eyebrow="Sales · Customer outcomes" title={<>Features are interesting. <span className="serif italic text-[#D1F470]">Use cases are sellable.</span></>}
        lede={<>You do not need to be a contact center architect to start these conversations. Recognize the pattern and confidently say, <span className="text-[#D1F470]">"We can help with that."</span></>}>
        {[["#use-cases", "Use cases"], ["#guidance", "Presentation guidance"]].map(([h, l]) => (
          <a key={h} href={h} className="rounded-full border border-[#F5F5F2]/20 px-4 py-2 text-sm hover:border-[#D1F470] hover:text-[#D1F470]" data-testid={`link-jump-${h.slice(1)}`}>{l}</a>
        ))}
      </PageHero>

      <Section>
        <SectionHead id="use-cases" num="01" eyebrow="Customer use cases" title="Top 5 use cases" lede="Five customer pains, five conversation starters, and the outcomes Zendesk Contact Center can support." />
        <UseCases />
      </Section>

      <Section tone="white">
        <SectionHead id="outcomes" num="02" eyebrow="Customer outcomes" title="Proof, in their numbers" lede="Examples from the Contact Center pitch deck show how teams use voice, digital channels, and AI to improve service operations." />
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

      <PresenterOnly title="Internal seller reference"><GuidanceSection /></PresenterOnly>
    </>
  );
}

function GuidanceSection() {
  const { data, isLoading, isError, refetch } = usePresenterContent();
  const gtmDoc = data?.legacy.resources.find((r) => r.id === "gtm");
  return (
    <Section>
      <SectionHead id="guidance" eyebrow="Presentation guidance · internal" title="Level 1 Foundation seller reference" lede="Recognize customer pain, tell the platform story, qualify early fit, and bring in the right specialists." />
      <div className="rounded-[2rem] border border-[#11110D]/10 bg-[#FBFBF8] px-6 md:px-10">
        {isLoading && <div className="space-y-3 py-6" aria-busy="true">{[0, 1, 2].map((k) => <div key={k} className="h-10 animate-pulse rounded-xl bg-[#11110D]/6" />)}</div>}
        {(isError || (!isLoading && !data)) && <p className="py-6 text-sm">Guidance could not be loaded. <button type="button" className="underline" onClick={() => void refetch()} data-testid="button-guidance-retry">Retry</button></p>}
        {data?.legacy.gtm.map((g, k) => (
          <Details key={g.t} q={g.t} testId={`gtm-${k}`}>
            <p>{g.body}</p>
            <ul className="mt-4 space-y-2">{g.list.map((x) => <li key={x} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#11110D]" />{x}</li>)}</ul>
          </Details>
        ))}
        {gtmDoc && <div className="py-5"><Ext href={gtmDoc.url} className="text-sm font-semibold underline" testId="link-gtm-doc">Open the internal GTM guide (Zendesk access required)</Ext></div>}
      </div>
      <Note>Internal enablement summary; verify current commercial and implementation details before customer commitments.</Note>
    </Section>
  );
}
