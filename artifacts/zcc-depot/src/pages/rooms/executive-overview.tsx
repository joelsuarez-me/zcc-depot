import { useState } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, X } from "lucide-react";
import { RoomFrame, RoomSection, SourceNote } from "@/components/room-kit";
import { DemoButton, Ext } from "@/components/kit";
import { LINKS, PILLARS, USE_CASES } from "@/data/content";
import { CustomerProof } from "@/components/customer-proof";
import { ROOMS } from "@/data/depot-rooms";

const STORY = [
  { k: "Challenge", t: "Voice sits apart from everything else", d: "Customers repeat themselves across channels. Agents switch between a phone system, a ticketing tool, and a knowledge base. Leaders reconcile reports from different vendors.", cue: "Ask: where does a call lose context today?" },
  { k: "Solution", t: "Voice joins the Zendesk service platform", d: "Zendesk Contact Center connects Amazon Connect telephony with Zendesk Agent Workspace, so calls, tickets, and customer context live in one place for agents.", cue: "Position: one agent workspace, one ticket history." },
  { k: "Architecture", t: "Customer-owned voice foundation, Zendesk workflow", d: "Telephony, recordings, and call records stay in the customer's AWS account. Integration functions carry agent actions and call data to Zendesk where configured.", cue: "Show: the security boundary in Room 02." },
  { k: "Demonstration", t: "Show one call, end to end", d: "Ring, caller context, live transcript and knowledge suggestions where enabled, wrap-up, and the resulting ticket. One story is stronger than ten features.", cue: "Use: the guided demo or Agent Experience room." },
  { k: "Outcome", t: "Fewer handoffs, less after-call work", d: "Outcomes depend on the customer's baseline and configuration. Frame value as hypotheses to measure: transfer rate, handle time, after-call work, and first-contact resolution.", cue: "Agree: which two metrics define success." },
];

export default function ExecutiveOverview() {
  const [step, setStep] = useState(0);
  const [uc, setUc] = useState(0);
  const [after, setAfter] = useState(true);
  const reduce = useReducedMotion();
  const s = STORY[step];
  const u = USE_CASES[uc];
  return (
    <RoomFrame id="executive-overview" lede="Why modern contact centers need unified experiences, and how to tell that story in five beats without overclaiming." actions={<DemoButton label="Guided demo" testId="button-room-demo" />}>
      <RoomSection id="value-story" eyebrow="Value story" title="Challenge to outcome, in five beats" lede="Select a beat. Each one carries the line to say and the proof to show next.">
        <div className="exec-story">
          <ol className="exec-rail" role="tablist" aria-label="Value story">
            {STORY.map((x, i) => (
              <li key={x.k}>
                <button type="button" role="tab" aria-selected={i === step} onClick={() => setStep(i)} className={`exec-beat ${i === step ? "is-on" : ""} ${i < step ? "is-past" : ""}`} data-testid={`tab-story-${i}`}>
                  <span className="mono text-[11px]">0{i + 1}</span><span className="font-semibold">{x.k}</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="exec-card" role="tabpanel" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={reduce ? false : { opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={reduce ? undefined : { opacity: 0, x: -12 }} transition={{ duration: 0.28 }}>
                <div className="eyebrow text-[#11110D]/55">{s.k}</div>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">{s.t}</h3>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#11110D]/72">{s.d}</p>
                <p className="mt-5 inline-flex rounded-full bg-[#11110D] px-4 py-2 text-sm text-[#D1F470]">{s.cue}</p>
              </motion.div>
            </AnimatePresence>
            <div className="mt-6 flex gap-2">
              <button type="button" className="depot-btn depot-btn-ghost" onClick={() => setStep((v) => Math.max(0, v - 1))} disabled={step === 0} data-testid="button-story-prev">Previous</button>
              <button type="button" className="depot-btn depot-btn-ink" onClick={() => setStep((v) => Math.min(STORY.length - 1, v + 1))} disabled={step === STORY.length - 1} data-testid="button-story-next">Next beat<ArrowRight className="h-4 w-4" aria-hidden /></button>
            </div>
          </div>
        </div>
      </RoomSection>

      <RoomSection id="before-after" eyebrow="Before and after" title="Make the change visible" lede="Pick a scenario, then flip between what breaks today and what the platform enables." tone="panel">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Scenarios">
          {USE_CASES.map((x, i) => <button key={x.t} type="button" role="tab" aria-selected={i === uc} onClick={() => setUc(i)} className={`room-pill ${i === uc ? "is-on" : ""}`} data-testid={`tab-scenario-${i}`}>{x.t}</button>)}
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="text-[15px] leading-relaxed text-[#11110D]/75">{u.scenario}</p>
            <div className="depot-mode is-light mt-5 w-max" role="radiogroup" aria-label="View">
              <button type="button" role="radio" aria-checked={!after} onClick={() => setAfter(false)} className={!after ? "is-on" : ""} data-testid="button-view-before">Today</button>
              <button type="button" role="radio" aria-checked={after} onClick={() => setAfter(true)} className={after ? "is-on" : ""} data-testid="button-view-after">With the platform</button>
            </div>
          </div>
          <div className="lg:col-span-7">
            <ul className={`exec-list ${after ? "is-after" : ""}`}>
              {(after ? [...u.enables, ...u.outcome] : u.broken).map((x) => (
                <li key={x}>{after ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : <X className="h-4 w-4 shrink-0" aria-hidden />}{x}</li>
              ))}
            </ul>
          </div>
        </div>
        <SourceNote>Outcomes describe intended direction, not measured results. Confirm baselines with the customer before quantifying.</SourceNote>
      </RoomSection>

      <RoomSection id="pillars" eyebrow="Platform pillars" title="Three ideas executives remember">
        <div className="grid gap-3 md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <div key={p.t} className="depot-card"><div className="mono text-xs text-[#11110D]/40">0{i + 1}</div><h3 className="mt-3 text-lg font-semibold tracking-tight">{p.t}</h3><p className="mt-2 text-sm leading-relaxed text-[#11110D]/65">{p.d}</p></div>
          ))}
        </div>
        <SourceNote>From the <Ext href={LINKS.product} className="underline">Zendesk Contact Center product page</Ext>.</SourceNote>
      </RoomSection>

      <RoomSection id="customer-proof" eyebrow="Customer proof" title="Customer-reported results" lede="Figures are as reported in Zendesk customer materials for these specific customers. They are not predictions for a new deployment.">
        <CustomerProof />
        <SourceNote>Results are customer-reported from supplied Zendesk materials, not live independent verification, predictions, or guarantees for a new deployment. Confirm approved public-use wording before external distribution.</SourceNote>
      </RoomSection>

      <RoomSection id="next-steps" eyebrow="Next steps" title="Where to take the conversation">
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {ROOMS.filter((r) => r.id !== "executive-overview").map((r) => (
            <Link key={r.id} href={r.href} className="room-next" data-testid={`link-next-${r.id}`}>
              <span className="mono text-xs text-[#11110D]/40">{r.n}</span>
              <span className="flex-1"><span className="block font-semibold">{r.title}</span><span className="block text-sm text-[#11110D]/60">{r.summary}</span></span>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            </Link>
          ))}
        </div>
      </RoomSection>
    </RoomFrame>
  );
}
