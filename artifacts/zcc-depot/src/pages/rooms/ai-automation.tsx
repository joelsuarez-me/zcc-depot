import { useState } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Bot, BookOpen, ClipboardCheck, FileText, Languages, PhoneForwarded, UserRound } from "lucide-react";
import { RoomFrame, RoomSection, SourceNote, StatusTag, type Status } from "@/components/room-kit";
import { Ext } from "@/components/kit";
import { LINKS, RESOURCES } from "@/data/content";

const url = (id: string) => RESOURCES.find((r) => r.id === id)?.url ?? LINKS.usingSection;

const WALK: { t: string; who: string; icon: typeof Bot; status: Status; d: string; say: string; transcript: [string, string][] }[] = [
  { t: "Self-service at the front door", who: "AI agent or IVR", icon: Bot, status: "Plan-dependent", d: "A voice AI agent or Lex-based IVR captures intent and resolves simple requests such as order status. Voice AI agents vary by plan, region, and release stage.", say: "Automation handles the routine so people handle the hard calls.", transcript: [["Caller", "I need to check where my replacement order is."], ["AI agent", "I can help with that. Can you confirm the order number?"]] },
  { t: "Escalation with context", who: "Handoff to a human", icon: PhoneForwarded, status: "Config-dependent", d: "When the request needs a person, the contact flow transfers to a queue. Captured intent and attributes travel with the call so the customer does not repeat themselves.", say: "The handoff carries the story, not just the call.", transcript: [["AI agent", "Let me connect you with a specialist who can update the address."], ["System", "Intent: address change · Order verified"]] },
  { t: "Agent assist during the call", who: "Copilot knowledge suggestions", icon: BookOpen, status: "Config-dependent", d: "With live transcripts and Copilot enabled, generative AI identifies the reason for calling and surfaces help center guidance in the Knowledge panel. Agents can regenerate as the topic changes.", say: "Guidance arrives while the customer is still talking.", transcript: [["Agent", "I can see the order. Let me check the address policy."], ["Suggestion", "Address changes after dispatch: carrier redirect steps"]] },
  { t: "Real-time translation", who: "Early access program", icon: Languages, status: "Early access", d: "Real-time voice translation between customer and agent is documented as an EAP. Confirm eligibility and supported languages before showing it.", say: "One workforce, more languages, where available.", transcript: [["Caller (es)", "Necesito cambiar la dirección."], ["Agent hears", "I need to change the address."]] },
  { t: "Wrap-up and summary", who: "After-call work", icon: FileText, status: "Config-dependent", d: "Transcripts and summaries, when enabled, reduce manual note-taking and keep the ticket record consistent for the next agent.", say: "Less typing after the call, better records for the next one.", transcript: [["Summary", "Customer requested address change post-dispatch; carrier redirect initiated."]] },
  { t: "Quality review", who: "Zendesk QA (optional)", icon: ClipboardCheck, status: "Optional", d: "Zendesk QA can review call transcripts to coach agents. It is a separately licensed product, distinct from Amazon Connect Contact Lens analytics.", say: "Every call can become a coaching moment.", transcript: [["Reviewer", "Empathy: strong · Resolution: confirmed · Coaching: recap next steps"]] },
];

const CAPS: { t: string; s: Status; d: string; doc: string }[] = [
  { t: "Real-time AI knowledge suggestions", s: "Config-dependent", d: "Requires live voice transcripts and Zendesk Copilot.", doc: url("ai-suggestions") },
  { t: "Call summaries in notifications", s: "Config-dependent", d: "Summaries can be configured in call notifications.", doc: url("summaries") },
  { t: "Real-time voice translation", s: "Early access", d: "Documented as an early access program.", doc: url("translation") },
  { t: "Zendesk QA for call transcriptions", s: "Optional", d: "Separate product and licensing; transcript redaction with ADPP add-on does not redact audio.", doc: url("qa-transcriptions") },
  { t: "Contact Lens analytics and redaction", s: "Config-dependent", d: "Amazon Connect capability configured in the customer AWS account.", doc: url("aws-services") },
  { t: "Voice AI agents", s: "Plan-dependent", d: "Availability varies by plan, region, and release stage. Confirm before committing.", doc: LINKS.product },
  { t: "Agent-to-agent AI collaboration", s: "Conceptual", d: "Discussed as an architecture pattern only. Not a current or promised Zendesk Contact Center integration.", doc: "" },
];

export default function AiAutomation() {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();
  const w = WALK[i];
  const Icon = w.icon;
  return (
    <RoomFrame id="ai-automation" lede="Follow one call through every AI touchpoint, with each capability labeled by its real availability." actions={<Link href="/demos/nuggets" className="room-chip" data-testid="link-ai-nuggets">Demo nuggets<ArrowRight className="h-3.5 w-3.5" aria-hidden /></Link>}>
      <RoomSection id="ai-walkthrough" eyebrow="Call-length walkthrough" title="Six moments where AI shows up" lede="Step through a single replacement-order call. The transcript panel shows what the customer and agent would see.">
        <div className="ai-walk">
          <ol className="ai-steps" role="tablist" aria-label="Walkthrough steps">
            {WALK.map((x, k) => {
              const I = x.icon;
              return (
                <li key={x.t}>
                  <button type="button" role="tab" aria-selected={k === i} onClick={() => setI(k)} className={`ai-step ${k === i ? "is-on" : ""}`} data-testid={`tab-ai-step-${k}`}>
                    <span className="ai-step-icon"><I className="h-4 w-4" aria-hidden /></span>
                    <span className="min-w-0 text-left"><span className="block truncate text-sm font-semibold">{x.t}</span><span className="block truncate text-xs opacity-60">{x.who}</span></span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="ai-stage" role="tabpanel" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.div key={i} initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.25 }} className="grid gap-5 md:grid-cols-2">
                <div>
                  <div className="flex items-center gap-2"><span className="ai-step-icon is-big"><Icon className="h-5 w-5" aria-hidden /></span><StatusTag s={w.status} /></div>
                  <h3 className="mt-4 text-2xl font-semibold tracking-tight">{w.t}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-[#11110D]/72">{w.d}</p>
                  <p className="mt-4 border-l-2 border-[#D1F470] pl-3 text-sm italic text-[#11110D]/80">{w.say}</p>
                </div>
                <div className="ai-transcript" aria-label="Illustrative transcript">
                  <div className="mono mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-[#F5F5F2]/45"><span className="h-1.5 w-1.5 rounded-full bg-[#D1F470]" aria-hidden />Illustrative · not a live system</div>
                  {w.transcript.map(([who, line], k) => (
                    <motion.div key={k} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduce ? 0 : 0.15 + k * 0.25 }} className="mb-2.5">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#D1F470]"><UserRound className="h-3 w-3" aria-hidden />{who}</div>
                      <p className="text-sm text-[#F5F5F2]/90">{line}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="mt-5 flex gap-2">
              <button type="button" className="depot-btn depot-btn-ghost" onClick={() => setI((v) => Math.max(0, v - 1))} disabled={i === 0} data-testid="button-ai-prev">Previous</button>
              <button type="button" className="depot-btn depot-btn-ink" onClick={() => setI((v) => Math.min(WALK.length - 1, v + 1))} disabled={i === WALK.length - 1} data-testid="button-ai-next">Next moment<ArrowRight className="h-4 w-4" aria-hidden /></button>
            </div>
          </div>
        </div>
      </RoomSection>

      <RoomSection id="capability-status" eyebrow="Capability status" title="What is available, configurable, or conceptual" tone="panel">
        <div className="overflow-hidden rounded-2xl border border-[#11110D]/10 bg-[#FBFBF8]">
          {CAPS.map((c) => (
            <div key={c.t} className="grid gap-2 border-t border-[#11110D]/8 px-4 py-3.5 first:border-t-0 md:grid-cols-12 md:items-center">
              <div className="font-semibold md:col-span-4">{c.t}</div>
              <div className="md:col-span-2"><StatusTag s={c.s} /></div>
              <div className="text-sm text-[#11110D]/65 md:col-span-5">{c.d}</div>
              <div className="md:col-span-1 md:text-right">{c.doc ? <Ext href={c.doc} className="text-xs underline" testId={`link-cap-${c.t.slice(0, 12).replace(/\W+/g, "-").toLowerCase()}`}>Docs</Ext> : <span className="text-xs text-[#11110D]/40">None</span>}</div>
            </div>
          ))}
        </div>
        <SourceNote>Status reflects public Zendesk documentation as linked. Release stages change; confirm current availability before customer commitments.</SourceNote>
      </RoomSection>

      <RoomSection id="quality-paths" eyebrow="QA and Contact Lens" title="Two quality paths, not one">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="depot-card"><StatusTag s="Config-dependent" /><h3 className="mt-3 text-lg font-semibold">Amazon Connect Contact Lens</h3><ul className="mt-3 space-y-1.5 text-sm text-[#11110D]/70"><li>Configured in the customer AWS account</li><li>Real-time and post-call transcription and analytics</li><li>Redaction of transcripts and recordings when configured</li><li>Real-time events can be forwarded to Zendesk</li></ul></div>
          <div className="depot-card"><StatusTag s="Optional" /><h3 className="mt-3 text-lg font-semibold">Zendesk QA</h3><ul className="mt-3 space-y-1.5 text-sm text-[#11110D]/70"><li>Separate Zendesk product with its own licensing</li><li>Reviews call transcriptions for coaching and scoring</li><li>Post-call transcript redaction with the ADPP add-on</li><li>Transcript redaction does not redact attached call audio</li></ul></div>
        </div>
      </RoomSection>

      <RoomSection id="orchestration" eyebrow="Orchestration concepts" title="Agent collaboration, as a concept" lede="Use this to frame future-state architecture conversations. It is not a current Zendesk Contact Center integration." tone="panel">
        <div className="ai-concept">
          {["Live contact", "Orchestrating AI agent", "Specialist agent", "Result or human escalation"].map((x, k) => (
            <div key={x} className="ai-concept-node"><span className="mono text-[10px] text-[#11110D]/45">0{k + 1}</span><span className="font-semibold">{x}</span></div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2"><StatusTag s="Conceptual" /><span className="text-xs text-[#11110D]/55">Questions to validate: who orchestrates, how context and ticket data transfer, how activity is reported, and how cost is attributed.</span></div>
      </RoomSection>
    </RoomFrame>
  );
}
