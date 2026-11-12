import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Video, MonitorUp, Layers } from "lucide-react";
import { DemoButton, Ext, Note, PageHero, Reveal, Section, SectionHead } from "@/components/kit";
import { DEMO_ROOMS, DEMO_URL, LINKS } from "@/data/content";
import { VideoHighlights } from "@/components/video-highlights";

const VIDEO_GA = [
  ["Native video calls", "Launch from Agent Workspace."],
  ["Pre-call preview", "Audio and video checks for both agents and customers."],
  ["Call controls", "Hold, join, start, and end call lifecycle."],
  ["Screen sharing", "Basic sharing with a choice of which window to show."],
  ["Connection continuity", "Maintain audio and video while moving between the call and screen share."],
  ["Context continuity", "Keep the customer conversation and agent workspace together through escalation."],
];
const VIDEO_LATER = ["Call recordings and video transcripts/playback", "Customer-initiated calls or screen sharing", "Voice-to-video handoff using invite codes", "Availability for non-PODS customers", "Advanced UI and brand customization"];

export default function Demos() {
  const reduce = useReducedMotion();
  const [room, setRoom] = useState(0);
  const r = DEMO_ROOMS[room];
  const external = r.href.startsWith("http");
  return (
    <>
      <PageHero eyebrow="Demos · Guided access" title={<>One story. <span className="serif italic text-[#D1F470]">Seven connected rooms.</span></>}
        lede="Guide your audience from the customer's first interaction through the agent experience, the architecture behind it, and the business impact. Then hand them the walkthrough.">
        <DemoButton />
        <a href="#agenda" className="inline-flex items-center gap-2 rounded-full border border-[#F5F5F2]/25 px-5 py-3 text-sm font-semibold hover:border-[#D1F470] hover:text-[#D1F470]" data-testid="link-agenda">View the agenda</a>
        <a href="#video-highlights" className="inline-flex items-center gap-2 rounded-full border border-[#F5F5F2]/25 px-5 py-3 text-sm font-semibold hover:border-[#D1F470] hover:text-[#D1F470]" data-testid="link-video-highlights">Video highlights</a>
      </PageHero>

      <VideoHighlights />

      <Section>
        <SectionHead id="agenda" num="02" eyebrow="Demo Approach" title="A presenter-ready journey" lede="Customer → Agent → Platform → Outcomes. Step through the rooms; each one links to the depot page that supports it." />
        <div className="grid gap-6 lg:grid-cols-12">
          <ol className="relative space-y-1 lg:col-span-5" aria-label="Demo rooms">
            {DEMO_ROOMS.map((x, i) => (
              <li key={x.n}>
                <button onClick={() => setRoom(i)} aria-current={i === room ? "step" : undefined} data-testid={`button-room-${x.n}`}
                  className={`flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left transition-all ${i === room ? "bg-[#203524] text-[#F5F5F2]" : "hover:bg-[#203524]/6"}`}>
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full mono text-xs ${i === room ? "bg-[#D1F470] text-[#11110D]" : i < room ? "bg-[#203524]/15 text-[#203524]" : "border border-[#11110D]/15"}`}>{x.n}</span>
                  <span><span className={`eyebrow block ${i === room ? "text-[#D1F470]" : "text-[#11110D]/45"}`}>{x.stage}</span><span className="font-medium">{x.t}</span></span>
                </button>
              </li>
            ))}
          </ol>
          <div className="lg:col-span-7">
            <div className="sticky top-28 overflow-hidden rounded-[2rem] border border-[#11110D]/10 bg-[#FBFBF8]">
              <div className="h-1.5 bg-[#11110D]/8"><div className="h-full bg-[#203524] transition-all duration-500" style={{ width: `${((room + 1) / DEMO_ROOMS.length) * 100}%` }} /></div>
              <AnimatePresence mode="wait">
                <motion.div key={room} className="p-8 md:p-10" initial={reduce ? false : { opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={reduce ? undefined : { opacity: 0, x: -20 }} transition={{ duration: 0.3 }} aria-live="polite">
                  <div className="eyebrow text-[#203524]">Room {r.n} · {r.stage}</div>
                  <h3 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">{r.t}</h3>
                  <p className="mt-4 text-lg leading-relaxed text-[#11110D]/70">{r.d}</p>
                  <div className="mt-8 rounded-2xl bg-[#D1F470] p-5">
                    <div className="eyebrow text-[#203524]">Takeaway</div>
                    <p className="mt-1 text-lg font-medium">{r.take}</p>
                  </div>
                  <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                    {external ? <DemoButton variant="forest" label="Open guided walkthrough" testId="button-room-demo" /> : (
                      <Link href={r.href} className="group inline-flex items-center gap-2 rounded-full bg-[#203524] px-5 py-3 text-sm font-semibold text-[#D1F470]" data-testid="link-room-section">
                        Open supporting section <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => setRoom((v) => Math.max(0, v - 1))} disabled={room === 0} aria-label="Previous room" data-testid="button-room-prev" className="grid h-11 w-11 place-items-center rounded-full border border-[#11110D]/15 transition hover:bg-[#203524]/8 disabled:opacity-30"><ArrowLeft className="h-4 w-4" /></button>
                      <button onClick={() => setRoom((v) => Math.min(DEMO_ROOMS.length - 1, v + 1))} disabled={room === DEMO_ROOMS.length - 1} aria-label="Next room" data-testid="button-room-next" className="grid h-11 w-11 place-items-center rounded-full border border-[#11110D]/15 transition hover:bg-[#203524]/8 disabled:opacity-30"><ArrowRight className="h-4 w-4" /></button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="forest">
        <div id="guided-demo" className="scroll-mt-28 grid gap-7">
          <Reveal>
            <div className="eyebrow mb-4 text-[#D1F470]">03 · Click-through demo</div>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">Step inside the <span className="serif italic text-[#D1F470]">contact center experience.</span></h2>
            <p className="mt-3 max-w-3xl text-base text-[#F5F5F2]/70">Explore the guided Storylane walkthrough below, or open it directly in this tab.</p>
            <div className="mt-5">
              <a href={DEMO_URL} data-testid="button-launch-demo-2" className="inline-flex items-center gap-2 rounded-full bg-[#D1F470] px-5 py-3 text-sm font-semibold text-[#11110D] transition hover:bg-[#c3ea55]">
                Open interactive walkthrough <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            </div>
            <p className="mono mt-3 text-xs text-[#F5F5F2]/60">Guided click-through demo. It is not connected to a live Zendesk account.</p>
          </Reveal>
          <Reveal delay={0.1}>
            <div data-testid="card-demo-preview" className="overflow-hidden rounded-2xl border border-[#D1F470]/25 bg-white">
              <iframe src="https://zendesk.storylane.io/demo/contactcenter-feb2026-en-us?embed=inline" title="Zendesk Contact Center interactive Storylane demo" loading="lazy" allowFullScreen className="block aspect-[4/3] w-full border-0 md:aspect-video" data-testid="iframe-guided-demo" />
            </div>
          </Reveal>
        </div>
      </Section>

      <Section>
        <SectionHead id="spotlight" num="04" eyebrow="Pre-demo spotlight" title={<>Elevating experiences. <span className="serif italic">Making every interaction transformative.</span></>}
          lede="Open with the journey: AI captures intent and context, routes the call, and prepares the agent for a more informed conversation." />
        <div className="grid gap-4 md:grid-cols-3">
          {[["Capture intent", "AI listens for why the customer is calling and gathers context before a human picks up."], ["Route with context", "The call reaches the right queue or expert with what has been learned so far."], ["Prepare the agent", "The agent opens a ticket and customer context together, ready for a more informed conversation."]].map(([t, d], i) => (
            <Reveal key={t} delay={i * 0.07} className="rounded-3xl border border-[#11110D]/10 bg-[#FBFBF8] p-7">
              <div className="mono text-sm text-[#203524]/50">Beat 0{i + 1}</div>
              <h3 className="mt-6 text-xl font-semibold">{t}</h3><p className="mt-2 text-[#11110D]/65">{d}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section tone="white">
        <SectionHead id="video" num="05" eyebrow="Visual channels" title="Video calling & screen sharing" lede="Bring visual context into complex support conversations with agent-initiated video and screen sharing in the Zendesk agent workspace." />
        <div className="grid gap-4 md:grid-cols-3">
          {[[Video, "Escalate with one click", "Start a browser-based video call from the customer's ticket for complex diagnostics, device setup, or difficult digital navigation."], [Layers, "Keep the conversation together", "The customer receives an invitation and chooses whether to join. The agent and customer can switch channels while keeping the service context in one conversation."], [MonitorUp, "Share the customer's view", "Use basic screen sharing to guide a customer through a workflow. The video call remains visible while a shared screen is selected."]].map(([Icon, t, d], i) => {
            const I = Icon as typeof Video;
            return (
              <Reveal key={t as string} delay={i * 0.07} className="rounded-3xl bg-[#203524] p-7 text-[#F5F5F2]">
                <I className="h-6 w-6 text-[#D1F470]" aria-hidden />
                <h3 className="mt-8 text-xl font-semibold">{t as string}</h3><p className="mt-2 text-[#F5F5F2]/70">{d as string}</p>
              </Reveal>
            );
          })}
        </div>
        <div className="mt-6 rounded-3xl border-2 border-dashed border-[#203524]/25 p-7">
          <div className="eyebrow text-[#203524]">Availability and scope · optional service</div>
          <p className="mt-3 leading-relaxed text-[#11110D]/75">The current Help Center lists video calling as an optional SaaS service for embedding calls on web and mobile, and says to contact a Zendesk account representative to add optional AWS services. The interim launch deck describes its initial GA scope more narrowly: agent-initiated calls from the workspace, the standard Zendesk web chat widget, and customers with the Zendesk Contact Center add-on on PODS infrastructure. Scope may change; confirm current eligibility and rollout with Zendesk.</p>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-[#11110D]/10 p-7">
            <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">What the interim deck lists for GA</h3><span className="eyebrow rounded-full bg-[#D1F470] px-2.5 py-1">Deck target: Q3</span></div>
            <dl className="mt-5 divide-y divide-[#11110D]/8">{VIDEO_GA.map(([t, d]) => <div key={t} className="grid grid-cols-5 gap-3 py-3"><dt className="col-span-2 font-medium">{t}</dt><dd className="col-span-3 text-sm text-[#11110D]/65">{d}</dd></div>)}</dl>
          </div>
          <div className="rounded-3xl border border-[#11110D]/10 p-7">
            <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">Placed after GA in the deck</h3><span className="eyebrow rounded-full border border-[#11110D]/20 px-2.5 py-1">FY27 Q4 · historical target</span></div>
            <ul className="mt-5 space-y-3">{VIDEO_LATER.map((t) => <li key={t} className="flex gap-3 text-[#11110D]/75"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#203524]" />{t}</li>)}</ul>
            <p className="mt-5 text-sm text-[#11110D]/55">These are historical roadmap targets in the supplied deck, not confirmed delivery dates.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 text-sm leading-relaxed text-[#11110D]/70">
          <p><strong className="text-[#11110D]">Privacy and security:</strong> the launch deck calls out enterprise-grade controls but does not define them. Confirm consent, sharing permissions, data handling, recording behavior, and security coverage with Zendesk.</p>
          <p><strong className="text-[#11110D]">Screen sharing is not screen recording.</strong> The Help Center lists Screen Recording separately as an optional service for capturing agent desktop activity alongside audio for QA and coaching.</p>
        </div>
        <Note>Sources: <Ext href={LINKS.awsServices} className="underline">About AWS services in Contact Center</Ext> and <Ext href={LINKS.resolution} className="underline">Advancing the Resolution Platform</Ext>. The launch deck is interim and notes that feature scope may change.</Note>
      </Section>
    </>
  );
}
