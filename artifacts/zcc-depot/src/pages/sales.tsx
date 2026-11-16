import { useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";
import { ArrowUpRight, Plus } from "lucide-react";
import { Ext, Note, PageHero, Reveal, Section, SectionHead } from "@/components/kit";
import { LINKS, OUTCOMES } from "@/data/content";
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
        <SectionHead id="use-cases" num="01" eyebrow="Customer scenarios" title="Explore the use-case library" lede="The consolidated library brings cross-industry starting scenarios together with the detailed industry collection, architecture notes, and demo steps." />
        <a href="/sales/use-cases-by-vertical" className="inline-flex items-center gap-2 rounded-full bg-[#203524] px-5 py-3 text-sm font-semibold text-[#D1F470]" data-testid="link-full-use-cases">Browse all use cases<ArrowUpRight className="h-4 w-4" aria-hidden /></a>
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
