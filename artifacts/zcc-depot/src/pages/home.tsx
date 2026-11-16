import { Link } from "wouter";
import { ArrowUpRight } from "lucide-react";
import { Note, Reveal, Section, SectionHead } from "@/components/kit";
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

      <Section id="quick-connects">
        <SectionHead permalinkId="quick-connects" eyebrow="Amazon Connect · Routing" title="Quick Connects: common transfers, ready to use" lede="Quick connects give agents a named list of destinations for common transfers, such as a specialist, another queue, or an on-call phone number." />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            { title: "Phone number", label: "External destination", copy: "Send a contact to a phone number, such as a supervisor or on-call pager." },
            { title: "User", label: "Specific agent", copy: "Transfer to a named Connect user through the configured transfer flow." },
            { title: "Queue", label: "Another team", copy: "Route the contact to a queue through its configured transfer flow." },
            { title: "Flow", label: "Chat only", copy: "Let an agent start an interactive workflow during an active chat." },
          ].map((item) => (
            <article key={item.title} className="rounded-2xl border border-[#203524]/15 bg-[#FBFBF8] p-5">
              <p className="eyebrow text-[#203524]/65">{item.label}</p>
              <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#11110D]/65">{item.copy}</p>
            </article>
          ))}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[2rem] bg-[#203524] p-6 text-[#F5F5F2]">
            <p className="eyebrow text-[#D1F470]">Set up</p>
            <ol className="mt-3 grid gap-3 text-sm leading-relaxed">
              <li><strong>1. Create the destination.</strong> In the Connect admin site, open <strong>Routing → Quick connects</strong>. Give it a unique name, choose the type, set the destination and flow when applicable, then save.</li>
              <li><strong>2. Make it available to agents.</strong> Edit the relevant queue, add the quick connect, and save. Agents see quick connects associated with queues in their routing profile, including the Default outbound queue.</li>
              <li><strong>3. Try it in the CCP.</strong> For a phone-number quick connect, open Quick connects, select the entry, and choose Call.</li>
            </ol>
          </div>
          <div className="rounded-[2rem] border border-[#203524]/15 bg-[#FBFBF8] p-6">
            <p className="eyebrow text-[#203524]/65">What agents see</p>
            <ul className="mt-3 grid gap-3 text-sm leading-relaxed text-[#11110D]/75">
              <li><strong>User and Queue:</strong> shown in the CCP when an agent transfers a contact.</li>
              <li><strong>Phone number:</strong> external destinations appear in the CCP at all times. No transfer flow runs; caller ID comes from the queue configuration.</li>
              <li><strong>Flow:</strong> supported for chat contacts only.</li>
            </ul>
          </div>
        </div>
        <Note>Quick connects are reusable destinations. For User and Queue types, the associated flow controls the transfer behavior. AWS notes that the Contact Control Panel may show an internal transfer as connected while the destination agent is still being notified and accepting the contact.</Note>
        <p className="mt-4 text-sm"><Ext href="https://docs.aws.amazon.com/connect/latest/adminguide/quick-connects.html" className="font-semibold text-[#203524] underline" testId="link-aws-quick-connects">AWS admin guide: Create quick connects</Ext></p>
      </Section>


        <Note>Descriptions are qualified the way the linked Zendesk and AWS documentation qualifies them. Interactive demos are simulations with fictional data. Confirm availability, entitlements and pricing with current documentation.</Note>
      </Section>

    </>
  );
}
