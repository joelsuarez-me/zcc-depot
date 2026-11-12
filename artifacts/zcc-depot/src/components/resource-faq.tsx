import { Plus } from "lucide-react";
import { Ext, Note, Section, SectionHead } from "@/components/kit";
import { FAQ, LINKS } from "@/data/content";

export function ResourceFaq() {
  return (
    <Section tone="white">
      <SectionHead id="faq" eyebrow="FAQ" title="Short answers, carefully qualified" lede="Answers to common Zendesk Contact Center questions, with current product guidance as the reference." />
      <div className="mx-auto max-w-4xl">
        {FAQ.map(([question, answer], index) => (
          <details key={question} className="group border-b border-[#11110D]/10 [&_summary::-webkit-details-marker]:hidden" data-testid={`faq-${index}`}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg font-medium hover:text-[#203524]">
              {question}<span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#11110D]/15 transition-transform group-open:rotate-45 group-open:bg-[#D1F470]"><Plus className="h-4 w-4" aria-hidden /></span>
            </summary>
            <p className="pb-6 pr-12 leading-relaxed text-[#11110D]/70">{answer}</p>
          </details>
        ))}
        <Note>Answers summarize <Ext href={LINKS.product} className="underline">Zendesk's Contact Center page</Ext>. Confirm product, compliance and performance claims against the current plan and agreement.</Note>
      </div>
    </Section>
  );
}
