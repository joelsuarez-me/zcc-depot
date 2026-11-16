import { Link } from "wouter";
import { ArrowUpRight } from "lucide-react";
import { Ext, Note, Reveal, Section, SectionHead } from "@/components/kit";
import { PillarArt } from "@/components/art";
import { HomeHero } from "@/components/home-hero";
import { CallJourney } from "@/components/call-journey";
import { FeatureExplorer } from "@/components/features/feature-explorer";
import { PILLARS } from "@/data/content";
import { HOW_IT_WORKS_GUIDE } from "@/data/navigation";

export default function Home() {
  return (
    <>
      <div className="hh-wrap"><HomeHero /></div>

      <Section>
        <SectionHead id="platform" num="01" eyebrow="One solution" title={<>One contact center solution. <span className="hl">Zero silos.</span></>}
          lede="Zendesk Contact Center brings voice into the Zendesk Resolution Platform, so AI agents, Copilot, and people work from the same knowledge, context, and actions." />
        <div className="grid gap-px overflow-hidden rounded-3xl border border-[#11110D]/10 bg-[#11110D]/10 md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <Reveal key={p.t} delay={i * 0.08} className="zart-host bg-[#FBFBF8] p-8 transition-colors hover:bg-[#ECF7C8]">
              <div className="mb-6 flex items-start justify-between"><div className="mono text-sm text-[#203524]/50">0{i + 1}</div><PillarArt index={i} /></div>
              <h3 className="text-xl font-semibold tracking-tight">{p.t}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-[#11110D]/65">{p.d}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHead id="how-it-works" num="02" eyebrow="How it works" title="From caller to Zendesk agent"
          lede="Select a stage to see what it does. Illustrative architecture." />
        <div className="mb-5">
          <Link href={HOW_IT_WORKS_GUIDE.href} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#203524]/20 bg-white px-5 py-2 text-sm font-semibold text-[#203524] transition-colors hover:bg-[#D1F470] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#203524]" data-testid="link-how-it-works-detailed">
            {HOW_IT_WORKS_GUIDE.label}<ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <CallJourney />
      </Section>

      <Section tone="white">
        <SectionHead id="features" num="03" eyebrow="Features" title="Explore the power of Zendesk Contact Center"
          lede="Discover how intelligent routing, AI-powered automation, unified agent experiences, workforce optimization, and enterprise-grade architecture come together to transform customer service." />
        <p className="mb-4"><span className="fx-label" data-testid="text-features-label">An interactive guide to the capabilities behind modern customer experiences.</span></p>
        <FeatureExplorer />

      

        <Note>Descriptions are qualified the way the linked Zendesk and AWS documentation qualifies them. Interactive demos are simulations with fictional data. Confirm availability, entitlements and pricing with current documentation.</Note>
      </Section>

    </>
  );
}
