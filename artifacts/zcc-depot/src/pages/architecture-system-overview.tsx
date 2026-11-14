import { Link } from "wouter";
import { ArrowLeft, Link2 } from "lucide-react";
import { Ext } from "@/components/kit";
import { SystemOverviewDiagram } from "@/components/system-overview-diagram";
import "@/components/system-overview-diagram.css";
import { SO_DOCS, SO_DOC_LABEL, SO_SECTIONS } from "@/data/system-overview";
import { ACCURACY_NOTES, LINKS } from "@/data/content";

export default function ArchitectureSystemOverview() {
  return (
    <div className="mx-auto max-w-7xl overflow-x-clip px-4 py-6 md:px-8" data-testid="page-system-overview">
      <header className="sov-hero">
        <div className="sov-hero-line" style={{ top: "22%" }} aria-hidden><i className="sov-hero-dot" /></div>
        <div className="sov-hero-line" style={{ bottom: "18%" }} aria-hidden><i className="sov-hero-dot" style={{ animationDelay: "-3s" }} /></div>
        <div className="relative">
          <Link href="/rooms/architecture-integrations" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#111317]/65 hover:text-[#111317]" data-testid="link-back-architecture-room"><ArrowLeft className="h-3.5 w-3.5" aria-hidden />Architecture & Integrations</Link>
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold leading-[1.05] tracking-tight text-[#111317] md:text-5xl">Detailed System Overview & Data Flow</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#111317]/75 md:text-base">Zendesk brings the agent experience together with a configured AWS foundation. This diagram illustrates a customer-managed (BYOA) example, not every deployment model.</p>
          <p className="mt-3 max-w-3xl text-xs leading-relaxed text-[#111317]/75">{ACCURACY_NOTES.awsOwnership} <Ext href={LINKS.managedAws} className="font-bold underline">Zendesk-managed setup</Ext>{" · "}<Ext href={LINKS.customerAws} className="font-bold underline">Customer-managed setup</Ext></p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
            {SO_SECTIONS.map((s) => <a key={s.id} href={`#${s.id}`} className="rounded-full border border-[#C9CDD3] bg-white px-3 py-1.5 hover:bg-[#F1F3F5]" data-testid={`link-jump-${s.id}`}>{s.t}</a>)}
          </div>
        </div>
      </header>

      <section id="system-diagram" data-section-nav className="mt-6" aria-label="Interactive diagram">
        <a href="#system-diagram" className="mb-2 inline-flex items-center gap-2 text-xs font-semibold underline"><Link2 className="h-3.5 w-3.5" aria-hidden />Direct link to interactive diagram</a>
        <p className="mb-2 text-xs text-[#111317]/65 md:hidden">Swipe or scroll sideways inside the diagram to explore all components.</p>
        <SystemOverviewDiagram />
        <p className="mt-2 text-xs text-[#111317]/60">Illustrative architecture based on public documentation, not live infrastructure. AWS services shown are optional or configuration-dependent and are not all bundled by default.</p>
      </section>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {SO_SECTIONS.map((s) => (
          <section key={s.id} id={s.id} data-section-nav className="sov-sec rounded-2xl border border-[#D9DCE0] bg-[#FCFCFB] p-5" aria-labelledby={`${s.id}-h`}>
            <div className="flex items-start justify-between gap-3">
              <h2 id={`${s.id}-h`} className="text-lg font-extrabold tracking-tight text-[#111317]">{s.t}</h2>
              <a href={`#${s.id}`} className="rounded-full p-1.5 text-[#111317]/55 hover:bg-[#F1F3F5]" aria-label={`Permalink to ${s.t}`} data-testid={`link-permalink-${s.id}`}><Link2 className="h-4 w-4" aria-hidden /></a>
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[#111317]/78">
              {s.points.map((p) => <li key={p} className="border-l-2 border-[#E0352B]/50 pl-3">{p}</li>)}
            </ul>
            <Ext href={SO_DOCS[s.doc]} className="mt-3 text-xs font-bold underline" testId={`link-doc-${s.id}`}>{SO_DOC_LABEL[s.doc]}</Ext>
          </section>
        ))}
      </div>
    </div>
  );
}
