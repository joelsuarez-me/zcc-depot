import { useEffect } from "react";
import { ShieldCheck } from "lucide-react";
import { SectionLink } from "@/components/section-link";
import { Ext, Note, PageHero, Section, SectionHead } from "@/components/kit";
import { ComponentMap } from "@/components/contact-center-components/component-map";
import { SignInSequence } from "@/components/contact-center-components/sign-in-sequence";
import { APP_GUIDE_URL, COMPONENT_GUIDE_URL } from "@/data/contact-center-components";

export default function ArchitectureComponents() {
  useEffect(() => {
    const previous = document.title;
    document.title = "Understanding Contact Center components | ZCC Depot";
    return () => { document.title = previous; };
  }, []);
  return (
    <>
      <PageHero motif="map" eyebrow="Architecture · Components" title={<>Understanding <span className="serif italic text-[#D1F470]">Contact Center components</span></>}
        lede="Three components, one customer AWS boundary. Select each to see what it does, what it connects to, and where its limits are.">
        {[["#map", "Architecture map"], ["#sign-in", "How sign-in works"], ["#privacy", "Data boundary"]].map(([h, l]) => (
          <a key={h} href={h} className="rounded-full border border-[#F5F5F2]/20 px-4 text-sm hover:border-[#D1F470] hover:text-[#D1F470]" data-testid={`link-jump-${h.slice(1)}`}>{l}</a>
        ))}
      </PageHero>

      <Section>
        <SectionHead id="map" eyebrow="Architecture map" title="Identity, routing and the agent experience" lede="Zendesk Identity Provider signs agents in to Amazon Connect. Connect routes customer interactions to the Contact Center app. Connect, the app and Contact Center data sit in the customer's AWS account." />
        <ComponentMap />
      </Section>

      <Section tone="white">
        <SectionHead id="sign-in" eyebrow="Identity" title="How sign-in works" lede="Step through the sequence manually, or press Play. This is an explanation, not a live sign-in." />
        <SignInSequence />
      </Section>

      <Section>
        <div id="privacy" data-section-nav className="flex flex-col gap-5 rounded-[2rem] border-2 border-[#203524] bg-[#D1F470] p-7 md:flex-row md:p-10">
          <ShieldCheck className="h-8 w-8 shrink-0 text-[#203524]" aria-hidden />
          <div>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Data stays in the customer AWS account <SectionLink id="privacy" label="Data boundary" /></h2>
            <p className="mt-3 max-w-3xl leading-relaxed text-[#11110D]/80">Call recordings, customer information and other Contact Center data stay in the customer's AWS account, not on Zendesk servers. The Contact Center app and its supporting components are deployed in that AWS environment. This describes Contact Center environment data only, not the storage policies of every connected product.</p>
          </div>
        </div>
        <Note>
          Sources:{" "}
          <Ext href={COMPONENT_GUIDE_URL} className="underline" testId="link-source-components">Understanding Contact Center components</Ext>{" · "}
          <Ext href={APP_GUIDE_URL} className="underline" testId="link-source-app">Navigating the Contact Center app</Ext>
        </Note>
      </Section>
    </>
  );
}
