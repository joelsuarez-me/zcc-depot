import { useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Ext, Note, Reveal, Section, SectionHead } from "@/components/kit";
import { Pause, Play } from "lucide-react";
import { HeroArt, PillarArt, RouteBadge } from "@/components/art";
import { FEATURES, JOURNEY, LINKS, PILLARS } from "@/data/content";

export default function Home() {
  const reduce = useReducedMotion();
  const [feat, setFeat] = useState(0);
  const [paused, setPaused] = useState(false);
  const f = FEATURES[feat];
  return (
    <>
      <section className="on-dark relative overflow-hidden bg-[#203524] text-[#F5F5F2]">
        <div className="grid-lines absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-5 pb-3 pt-20 md:px-8">
          <motion.div className="grid gap-3 md:grid-cols-12 md:items-center md:gap-8" initial={reduce ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}>
            <h1 className="max-w-3xl font-sans text-[clamp(1rem,5.5vw,2rem)] font-semibold leading-tight tracking-[-0.035em] text-[#F5F5F2] md:col-span-7 lg:col-span-6">
              <span className="block whitespace-nowrap">ZENDESK CONTACT CENTER ·</span>{" "}
              <span className="block whitespace-nowrap"><span className="text-[#D1F470]">platform</span>{" "}ARCHITECT Depot</span>
            </h1>
            <p className="max-w-2xl text-sm leading-snug text-[#F5F5F2]/75 md:col-span-5 lg:col-span-4"><span className="mr-1.5 align-middle lg:hidden"><RouteBadge motif="flow" /></span>
              Everything you need to prepare the customer conversation: the story, the architecture behind it, the outcomes it supports, and the official sources to back every claim.
            </p>
            <div className="zart-slot pointer-events-none hidden lg:col-span-2 lg:block" aria-hidden><HeroArt motif="flow" className="is-sm" /></div>
          </motion.div>
        </div>
        <div className={`relative flex items-center border-t border-[#D1F470]/15 ${paused || reduce ? "marquee-paused" : ""}`}>
          <button type="button" onClick={() => setPaused((v) => !v)} aria-pressed={paused} aria-label={paused ? "Play topic ticker" : "Pause topic ticker"} data-testid="button-marquee-toggle"
            className="relative z-10 ml-3 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#D1F470]/40 text-[#D1F470] transition-colors hover:bg-[#D1F470] hover:text-[#203524] md:ml-6">
            {paused ? <Play className="h-3 w-3" aria-hidden /> : <Pause className="h-3 w-3" aria-hidden />}
          </button>
          <div className="min-w-0 flex-1 overflow-hidden py-1.5" aria-hidden>
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
        </div>
      </section>

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

      <Section tone="forest">
        <SectionHead id="how-it-works" num="02" eyebrow="How it works" dark title="From caller to Zendesk agent"
          lede="Follow the configured call journey: voice entry, routing, customer context, and the agent workspace." />
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="How Zendesk Contact Center works">
          {JOURNEY.map(stage => (
            <li key={stage.k} className="rounded-3xl border border-[#D1F470]/20 bg-[#11110D]/20 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#D1F470]/60">
              <div className="mono text-sm text-[#D1F470]">{stage.k} · {stage.label}</div>
              <h3 className="mt-6 text-xl font-semibold">{stage.t}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#F5F5F2]/70">{stage.d}</p>
            </li>
          ))}
        </ol>
        <Link href="/architecture#journey" className="mt-8 inline-flex rounded-full border border-[#D1F470]/40 px-5 py-3 text-sm font-semibold text-[#D1F470] transition-colors hover:bg-[#D1F470] hover:text-[#203524]">
          Explore the call journey
        </Link>
      </Section>

      <Section tone="white">
        <SectionHead id="features" num="03" eyebrow="Features" title="Features for connected customer service" lede="Select a capability to brief it. Each description is qualified the way the source documentation qualifies it." />
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

    </>
  );
}
