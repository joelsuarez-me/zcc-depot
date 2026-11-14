import { useState } from "react";
import { Link } from "wouter";
import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Ext, Note, Reveal, Section, SectionHead } from "@/components/kit";
import { PillarArt } from "@/components/art";
import { HomeHero, RoomStrip } from "@/components/home-hero";
import { CallJourney } from "@/components/call-journey";
import { FEATURES, LINKS, PILLARS } from "@/data/content";
import { HOW_IT_WORKS_GUIDE } from "@/data/navigation";

export default function Home() {
  const reduce = useReducedMotion();
  const [feat, setFeat] = useState(0);
  const f = FEATURES[feat];
  return (
    <>
      <div className="hh-wrap"><HomeHero /><RoomStrip /></div>

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
        <SectionHead id="features" num="03" eyebrow="Features" title="Features for connected customer service" lede="Select a capability to brief it. Each description is qualified the way the source documentation qualifies it." />
        <div className="grid items-start gap-6 lg:grid-cols-12">
          <div role="tablist" aria-label="Features" aria-orientation="vertical" className="flex flex-col gap-1 lg:col-span-5">
            {FEATURES.map((x, i) => (
              <button key={x.t} id={`feature-tab-${i}`} type="button" role="tab" tabIndex={i === feat ? 0 : -1} aria-selected={i === feat} aria-controls="feature-panel" onClick={() => setFeat(i)}
                onKeyDown={(event) => {
                  const next = event.key === "ArrowDown" ? (i + 1) % FEATURES.length
                    : event.key === "ArrowUp" ? (i + FEATURES.length - 1) % FEATURES.length
                    : event.key === "Home" ? 0 : event.key === "End" ? FEATURES.length - 1 : null;
                  if (next === null) return;
                  event.preventDefault();
                  setFeat(next);
                  event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
                }} data-testid={`tab-feature-${i}`}
                className={`group flex items-center justify-between rounded-2xl px-5 py-4 text-left transition-all ${i === feat ? "bg-[#203524] text-[#F5F5F2]" : "hover:bg-[#203524]/6"}`}>
                <span className="font-medium">{x.t}</span>
                <span className={`mono text-xs ${i === feat ? "text-[#D1F470]" : "text-[#11110D]/35"}`}>{String(i + 1).padStart(2, "0")}</span>
              </button>
            ))}
          </div>
          <div id="feature-panel" role="tabpanel" aria-labelledby={`feature-tab-${feat}`} tabIndex={0} className="relative min-h-[340px] overflow-hidden rounded-[2rem] bg-[#D1F470] p-8 md:p-12 lg:sticky lg:top-24 lg:col-span-7" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.div key={feat} initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -12 }} transition={{ duration: 0.35 }}>
                <div className="eyebrow mb-8 text-[#203524]">{f.tag}</div>
                <h3 className="text-3xl font-semibold leading-tight tracking-tight text-[#11110D] md:text-5xl">{f.t}</h3>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#11110D]/80">{f.d}</p>
                <p className="relative z-10 mt-6 border-l-2 border-[#203524]/30 pl-3 text-xs leading-relaxed text-[#11110D]/70" data-testid="feature-sources">
                  Source{(f.sources?.length ?? 1) > 1 ? "s" : ""}: {(f.sources ?? [{ label: "Zendesk Contact Center", href: LINKS.product }]).map((source, i) => (
                    <span key={source.href}>{i > 0 && " · "}<Ext href={source.href} className="underline underline-offset-2">{source.label}</Ext></span>
                  ))}
                </p>
              </motion.div>
            </AnimatePresence>
            <div className="serif pointer-events-none absolute -bottom-10 -right-2 select-none text-[12rem] leading-none text-[#203524]/10" aria-hidden>{String(feat + 1).padStart(2, "0")}</div>
          </div>
        </div>
        <Note>Feature descriptions are based on <Ext href={LINKS.product} className="underline">Zendesk Contact Center</Ext> and linked Zendesk documentation.</Note>
      </Section>

    </>
  );
}
