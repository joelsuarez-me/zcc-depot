import { useEffect } from "react";
import { ShieldCheck } from "lucide-react";
import { SectionLink } from "@/components/section-link";
import { Ext, Note, PageHero, Section, SectionHead } from "@/components/kit";
import { ComponentMap } from "@/components/contact-center-components/component-map";
import { SignInSequence } from "@/components/contact-center-components/sign-in-sequence";
import { APP_GUIDE_URL, COMPONENT_GUIDE_URL } from "@/data/contact-center-components";
import { ACCURACY_NOTES, LINKS } from "@/data/content";

export default function ArchitectureComponents() {
  useEffect(() => {
    const previous = document.title;
    document.title = "Understanding Contact Center components | ZCC Depot";
    return () => { document.title = previous; };
  }, []);
  return (
    <>
      <PageHero motif="map" eyebrow="Architecture · Components" title={<>Understanding <span className="serif italic text-[#D1F470]">Contact Center components</span></>}
        lede="Explore identity, routing and the agent experience, with deployment-specific AWS ownership and data boundaries.">
        {[["#map", "Architecture map"], ["#sign-in", "How sign-in works"], ["#privacy", "Data boundary"]].map(([h, l]) => (
          <a key={h} href={h} className="rounded-full border border-[#F5F5F2]/20 px-4 text-sm hover:border-[#D1F470] hover:text-[#D1F470]" data-testid={`link-jump-${h.slice(1)}`}>{l}</a>
        ))}
      </PageHero>

      <Section>
        <SectionHead id="map" eyebrow="Architecture map" title="Identity, routing and the agent experience" lede="Zendesk can federate sign-in to Amazon Connect and Cognito. Connect supplies the routing foundation. The map illustrates a customer-managed AWS example; Zendesk-managed deployments are also documented." />
        <ComponentMap />
        <Note>{ACCURACY_NOTES.awsOwnership} <Ext href={LINKS.managedAws} className="underline">Zendesk-managed setup</Ext>{" · "}<Ext href={LINKS.customerAws} className="underline">BYOA setup</Ext></Note>

      </Section>

      <Section tone="white">
        <SectionHead id="sign-in" eyebrow="Identity" title="How sign-in works" lede="Step through the sequence manually, or press Play. This is an explanation, not a live sign-in." />
        <SignInSequence />
      </Section>

      <Section>
        <div id="privacy" data-section-nav className="flex flex-col gap-5 rounded-[2rem] border-2 border-[#203524] bg-[#D1F470] p-7 md:flex-row md:p-10">
          <ShieldCheck className="h-8 w-8 shrink-0 text-[#203524]" aria-hidden />
          <div>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Trace each data boundary <SectionLink id="privacy" label="Data boundary" /></h2>
            <p className="mt-3 max-w-3xl leading-relaxed text-[#11110D]/80">AWS stores and processes configured Contact Center data, but recordings, transcripts and mapped call information can also be written back to Zendesk tickets. Do not claim that all customer data stays only in a customer-owned account. Ownership, retention, access and regional hosting depend on the deployment, enabled writeback and each connected service.</p>
          </div>
        </div>
        <Note>
          Sources:{" "}
          <Ext href={COMPONENT_GUIDE_URL} className="underline" testId="link-source-components">Understanding Contact Center components</Ext>{" · "}
          <Ext href={APP_GUIDE_URL} className="underline" testId="link-source-app">Navigating the Contact Center app</Ext>
          {" · "}<Ext href={LINKS.writeback} className="underline">Recording and transcript writeback</Ext>
          {" · "}<Ext href={LINKS.residency} className="underline">Regional Data Hosting Policy</Ext>
        </Note>
      </Section>
    </>
  );
}
