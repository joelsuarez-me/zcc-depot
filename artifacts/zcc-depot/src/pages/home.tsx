import { useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Ext, Note, Reveal, Section, SectionHead } from "@/components/kit";
import { FEATURES, LINKS, PILLARS } from "@/data/content";

const DESTS = [
  { href: "/demos", n: "01", t: "Run the demo", d: "Seven-room agenda, presenter cues, and the guided click-through walkthrough." },
  { href: "/architecture", n: "02", t: "Explain the architecture", d: "Call journey, two-cloud data flow, Lambda roles, and the global footprint." },
  { href: "/sales", n: "03", t: "Frame the value", d: "Top five use cases, customer outcomes, FAQ, and a labeled roadmap snapshot." },
  { href: "/resources", n: "04", t: "Find the source", d: "Searchable, categorized official documentation with local bookmarks." },
];

export default function Home() {
  const reduce = useReducedMotion();
  const [feat, setFeat] = useState(0);
  const f = FEATURES[feat];
  return (
    <>
      <section className="on-dark relative overflow-hidden bg-[#203524] text-[#F5F5F2]">
        <div className="grid-lines absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-32 md:px-8 md:pt-40">
          <motion.div className="max-w-4xl" initial={reduce ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}>
            <h1 className="max-w-3xl font-sans text-3xl font-semibold leading-tight tracking-[-0.035em] text-[#F5F5F2] sm:text-4xl lg:text-[3.25rem]">
              ZENDESK CONTACT CENTER · platform ARCHITECT Depot
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-[#F5F5F2]/75">
              Everything you need to prepare the customer conversation: the story, the architecture behind it, the outcomes it supports, and the official sources to back every claim.
            </p>
          </motion.div>
        </div>
        <div className="relative overflow-hidden border-t border-[#D1F470]/15 py-4" aria-hidden>
          <div className="marquee flex w-max gap-10 whitespace-nowrap text-sm text-[#F5F5F2]/50">
            {[0, 1].map((k) => (
              <div key={k} className="flex gap-10">
                {["Zendesk Resolution Platform", "AI agents", "Copilot", "Connected knowledge and actions", "Amazon Connect", "Contact Lens", "Agent Workspace", "Enterprise-grade governance", "Calls and every channel"].map((w) => (
                  <span key={w} className="flex items-center gap-10">{w}<span className="h-1.5 w-1.5 rounded-full bg-[#D1F470]" /></span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Section>
        <SectionHead id="platform" num="01" eyebrow="One solution" title={<>One contact center solution. <span className="hl">Zero silos.</span></>}
          lede="Zendesk Contact Center brings voice into the Zendesk Resolution Platform, so AI agents, Copilot, and people work from the same knowledge, context, and actions." />
        <div className="grid gap-px overflow-hidden rounded-3xl border border-[#11110D]/10 bg-[#11110D]/10 md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <Reveal key={p.t} delay={i * 0.08} className="bg-[#FBFBF8] p-8 transition-colors hover:bg-[#ECF7C8]">
              <div className="mono mb-10 text-sm text-[#203524]/50">0{i + 1}</div>
              <h3 className="text-xl font-semibold tracking-tight">{p.t}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-[#11110D]/65">{p.d}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section tone="white">
        <SectionHead id="features" num="02" eyebrow="Features" title="Features for connected customer service" lede="Select a capability to brief it. Each description is qualified the way the source documentation qualifies it." />
        <div className="grid gap-6 lg:grid-cols-12">
          <div role="tablist" aria-label="Features" aria-orientation="vertical" className="flex flex-col gap-1 lg:col-span-5">
            {FEATURES.map((x, i) => (
              <button key={x.t} role="tab" aria-selected={i === feat} aria-controls="feature-panel" onClick={() => setFeat(i)} data-testid={`tab-feature-${i}`}
                className={`group flex items-center justify-between rounded-2xl px-5 py-4 text-left transition-all ${i === feat ? "bg-[#203524] text-[#F5F5F2]" : "hover:bg-[#203524]/6"}`}>
                <span className="font-medium">{x.t}</span>
                <span className={`mono text-xs ${i === feat ? "text-[#D1F470]" : "text-[#11110D]/35"}`}>{String(i + 1).padStart(2, "0")}</span>
              </button>
            ))}
          </div>
          <div id="feature-panel" role="tabpanel" className="relative min-h-[340px] overflow-hidden rounded-[2rem] bg-[#D1F470] p-8 md:p-12 lg:col-span-7" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.div key={feat} initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -12 }} transition={{ duration: 0.35 }}>
                <div className="eyebrow mb-8 text-[#203524]">{f.tag}</div>
                <h3 className="text-3xl font-semibold leading-tight tracking-tight text-[#11110D] md:text-5xl">{f.t}</h3>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#11110D]/80">{f.d}</p>
              </motion.div>
            </AnimatePresence>
            <div className="serif pointer-events-none absolute -bottom-10 -right-2 select-none text-[12rem] leading-none text-[#203524]/10" aria-hidden>{String(feat + 1).padStart(2, "0")}</div>
          </div>
        </div>
        <Note>Feature descriptions are based on <Ext href={LINKS.product} className="underline">Zendesk Contact Center</Ext> and linked Zendesk documentation.</Note>
      </Section>

      <Section tone="ink">
        <SectionHead num="03" eyebrow="Depot map" dark title={<>Four rooms. <span className="serif italic text-[#D1F470]">One conversation.</span></>} lede="Pick the room that matches where your customer conversation is today." />
        <div className="grid gap-4 md:grid-cols-2">
          {DESTS.map((d, i) => (
            <Reveal key={d.href} delay={i * 0.06}>
              <Link href={d.href} data-testid={`link-dest-${d.n}`} className="group flex h-full flex-col justify-between rounded-[1.75rem] border border-[#F5F5F2]/12 p-8 transition-all hover:-translate-y-1 hover:border-[#D1F470] hover:bg-[#203524]">
                <div className="flex items-start justify-between">
                  <span className="mono text-sm text-[#D1F470]">{d.n}</span>
                  <ArrowUpRight className="h-6 w-6 text-[#F5F5F2]/40 transition-all group-hover:rotate-45 group-hover:text-[#D1F470]" />
                </div>
                <div className="mt-14">
                  <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">{d.t}</h3>
                  <p className="mt-2 text-[#F5F5F2]/60">{d.d}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>
    </>
  );
}
