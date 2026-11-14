import { useEffect, useState } from "react";
import { SimulationCaption } from "@/components/simulation-caption";
import { Link } from "wouter";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BookOpen, Mic, Pause, Phone, PhoneOff, Play, RotateCcw, Ticket, UserRound } from "lucide-react";
import { RoomFrame, RoomSection, SourceNote, StatusTag } from "@/components/room-kit";
import { DemoButton, Ext } from "@/components/kit";
import { LINKS, RESOURCES } from "@/data/content";

const doc = (id: string) => RESOURCES.find((r) => r.id === id)?.url ?? LINKS.usingSection;

type Phase = { t: string; d: string; status: string; call: "ringing" | "live" | "wrap" | "idle"; ticket: string; transcript: string[]; knowledge?: string };
const PHASES: Phase[] = [
  { t: "Incoming call", d: "The agent is Available. A call routes from the queue and rings in Agent Workspace with caller details from the lookup.", status: "Available", call: "ringing", ticket: "Searching for caller", transcript: [] },
  { t: "Accept and context", d: "The agent accepts. The illustrative ticket shows prior conversations from email and messaging, plus mapped IVR attributes. Matching and field mapping must be configured; recognizing a number is not authentication.", status: "On call", call: "live", ticket: "#48217 Replacement order", transcript: ["IVR selection: Order support", "Identity verification: separate approved step"] },
  { t: "Conversation", d: "Live transcript runs where enabled. The agent uses call controls (hold, transfer, mute) without leaving the ticket.", status: "On call", call: "live", ticket: "#48217 Replacement order", transcript: ["Caller: The replacement still shows the old address.", "Agent: I can see that. Let me check what we can do."] },
  { t: "Knowledge assist", d: "Copilot suggests a help center answer based on the live transcript. The agent marks it helpful or regenerates.", status: "On call", call: "live", ticket: "#48217 Replacement order", transcript: ["Caller: Can it still be redirected?"], knowledge: "Redirecting a shipment after dispatch" },
  { t: "Wrap-up", d: "The call ends. The summary and transcript, where enabled, are written to the ticket. The agent sets a disposition and solves.", status: "After call work", call: "wrap", ticket: "#48217 Solved", transcript: ["Summary: Address redirect requested and confirmed with carrier."] },
];

const LIFECYCLE = [
  { k: "New", d: "Call creates or matches a ticket" },
  { k: "Open", d: "Agent works the call with context" },
  { k: "Pending", d: "Follow-up by email or outbound call" },
  { k: "Solved", d: "Resolution recorded with summary" },
  { k: "Closed", d: "Record retained for reporting and QA" },
];

export default function AgentExperience() {
  const [p, setP] = useState(0);
  const [auto, setAuto] = useState(false);
  const [history, setHistory] = useState(0);
  const conversations = [
    { channel: "Email", label: "Earlier · Customer email", message: "My replacement order still has the old delivery address. Can you check it?", context: "The agent reviews the original request and ticket history." },
    { channel: "Messaging", label: "Earlier · Digital conversation", message: "Please use 14 Market Street for this replacement.", context: "Prior messaging provides context when the customer and conversations are correctly linked." },
    { channel: "Voice", label: "Now · Configured call", message: "I am calling to confirm the replacement address.", context: "The agent checks the prior discussion and completes the approved identity-verification step." },
  ];
  const reduce = useReducedMotion();
  const ph = PHASES[p];
  useEffect(() => {
    if (!auto || reduce) return;
    const t = setTimeout(() => setP((v) => (v + 1) % PHASES.length), 4200);
    return () => clearTimeout(t);
  }, [auto, p, reduce]);

  return (
    <RoomFrame id="agent-experience" lede="A guided Agent Workspace simulation. Illustrative screens, real workflow; features depend on configuration." actions={<DemoButton label="Real click-through" testId="button-agent-demo" />}>
      <RoomSection id="workspace-sim" eyebrow="Workspace simulation" title="One workspace, across channels">
        <div className="ax-sim">
          <SimulationCaption title={PHASES[p].t} status={auto ? "Playing" : "Ready / paused"} step={`Step ${p + 1} of ${PHASES.length}`}>{PHASES[p].d}</SimulationCaption>
          <div className="ax-steps" role="tablist" aria-label="Simulation phases">
            {PHASES.map((x, k) => <button key={x.t} type="button" role="tab" aria-selected={k === p} onClick={() => { setAuto(false); setP(k); }} className={`ax-step ${k === p ? "is-on" : ""} ${k < p ? "is-past" : ""}`} data-testid={`tab-phase-${k}`}><span className="mono text-[10px]">0{k + 1}</span>{x.t}</button>)}
            <div className="ml-auto flex gap-1">
              <button type="button" className="depot-icon-btn is-light" onClick={() => setAuto((a) => !a)} disabled={!!reduce} aria-label={auto ? "Pause autoplay" : "Autoplay"} data-testid="button-sim-autoplay">{auto ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
              <button type="button" className="depot-icon-btn is-light" onClick={() => { setAuto(false); setP(0); }} aria-label="Restart" data-testid="button-sim-restart"><RotateCcw className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="ax-window" aria-live="polite">
            <div className="ax-chrome"><span /><span /><span /><span className="mono ml-3 text-[10px] text-[#11110D]/45">Agent Workspace · illustrative</span><span className={`ax-status ml-auto ${ph.status === "Available" ? "is-avail" : ph.status === "On call" ? "is-call" : "is-acw"}`}>{ph.status}</span></div>
            <div className="ax-grid">
              <div className="ax-pane">
                <div className="eyebrow text-[10px] text-[#11110D]/45">Ticket</div>
                <div className="mt-1 flex items-center gap-2 font-semibold"><Ticket className="h-4 w-4" aria-hidden />{ph.ticket}</div>
                <div className="mt-3 space-y-1.5 text-xs text-[#11110D]/60"><div>Requester: Mara Okafor</div><div>Channel history: Email, Messaging, Voice</div><div>Priority: Normal</div></div>
                 <div className="mt-4 border-t border-[#11110D]/10 pt-3">
                   <div className="flex flex-wrap gap-1" role="group" aria-label="Explore conversation history">
                     {conversations.map((c, index) => <button key={c.channel} type="button" className={`room-pill ${history === index ? "is-on" : ""}`} aria-pressed={history === index} onClick={() => { setAuto(false); setHistory(index); }} data-testid={`button-history-${c.channel.toLowerCase()}`}>{c.channel}</button>)}
                   </div>
                   <div className="mt-3 rounded-xl bg-[#11110D]/5 p-3" aria-live="polite" data-testid="panel-channel-history">
                     <p className="text-xs font-semibold">{conversations[history].label}</p>
                     <p className="mt-2 text-sm">{conversations[history].message}</p>
                     <p className="mt-2 text-xs leading-relaxed text-[#11110D]/65">{conversations[history].context}</p>
                   </div>
                 </div>
                <AnimatePresence>{ph.knowledge && (
                  <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="ax-knowledge">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold"><BookOpen className="h-3.5 w-3.5" aria-hidden />Knowledge suggestion</div>
                    <div className="mt-1 text-sm">{ph.knowledge}</div>
                  </motion.div>
                )}</AnimatePresence>
              </div>
              <div className="ax-pane is-ink on-dark">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold"><UserRound className="h-4 w-4 text-[#D1F470]" aria-hidden />+1 (415) 555 0142</div>
                  <span className={`ax-ring ${ph.call === "ringing" ? "is-ringing" : ""}`} aria-hidden><Phone className="h-4 w-4" /></span>
                </div>
                <div className="mt-4 flex gap-1.5">
                  {[Mic, Pause, PhoneOff].map((I, k) => <span key={k} className={`ax-ctl ${ph.call !== "live" ? "is-off" : ""}`} aria-hidden><I className="h-3.5 w-3.5" /></span>)}
                </div>
                <div className="mt-4 min-h-[96px] space-y-2">
                  {ph.transcript.length === 0 ? <p className="text-xs text-[#F5F5F2]/45">Waiting for the agent to accept.</p>
                    : ph.transcript.map((l, k) => <motion.p key={p + "-" + k} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduce ? 0 : k * 0.3 }} className="text-sm text-[#F5F5F2]/85">{l}</motion.p>)}
                </div>
              </div>
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.p key={p} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 max-w-3xl text-[15px] leading-relaxed text-[#11110D]/75">{ph.d}</motion.p>
          </AnimatePresence>
        </div>
        <SourceNote>See <Ext href={doc("agent-interface")} className="underline">Using the Contact Center agent interface</Ext> and <Ext href={doc("managing-calls")} className="underline">Managing calls</Ext>. Transcripts, summaries, suggestions and cross-channel context depend on enabled features and configuration. This sample does not establish automatic voice-to-digital transfer.</SourceNote>
      </RoomSection>

      <RoomSection id="ticket-lifecycle" eyebrow="Ticket lifecycle" title="From ring to record" tone="panel">
        <ol className="ax-life">
          {LIFECYCLE.map((l, k) => <li key={l.k} className={k <= Math.min(p, 3) ? "is-on" : ""}><span className="font-semibold">{l.k}</span><span className="text-xs text-[#11110D]/60">{l.d}</span></li>)}
        </ol>
        <SourceNote>Ticket statuses follow standard Zendesk ticketing. See <Ext href={doc("calls-tickets")} className="underline">How Contact Center calls become tickets</Ext>.</SourceNote>
      </RoomSection>

      <RoomSection id="supervisor" eyebrow="Supervisor workflows" title="What leads can do, where supported">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { t: "Operational dashboards", d: "Monitor queues and agent states with the Contact Center dashboards app.", s: "Documented" as const, doc: doc("dashboards-app") },
            { t: "Routing profile changes", d: "Adjust which queues agents serve by updating Amazon Connect routing profiles.", s: "Documented" as const, doc: doc("routing-profiles-update") },
            { t: "Quality review", d: "Coach from call transcripts with Zendesk QA, a separately licensed product.", s: "Optional" as const, doc: doc("qa-transcriptions") },
          ].map((x) => <div key={x.t} className="depot-card"><StatusTag s={x.s} /><h3 className="mt-3 font-semibold">{x.t}</h3><p className="mt-1.5 text-sm text-[#11110D]/65">{x.d}</p><Ext href={x.doc} className="mt-3 text-xs underline">Documentation</Ext></div>)}
        </div>
      </RoomSection>

      <RoomSection id="demo-assets" eyebrow="Demo assets" title="Show it for real" tone="panel">
        <div className="grid gap-2 md:grid-cols-3">
          {[["/demos/nuggets", "Demo Nuggets", "Narrated Voice Copilot, QA, AI agent, and video simulations."], ["/demos#guided-demo", "Click-through demo", "The embedded Storylane walkthrough."], ["/demos/instance-details", "Demo instance", "Shared environment details for live demos."]].map(([h, t, d]) => (
            <Link key={h} href={h} className="room-next" data-testid={`link-asset-${t.toLowerCase().replace(/\W+/g, "-")}`}><span className="flex-1"><span className="block font-semibold">{t}</span><span className="block text-sm text-[#11110D]/60">{d}</span></span><ArrowRight className="h-4 w-4" aria-hidden /></Link>
          ))}
        </div>
      </RoomSection>
    </RoomFrame>
  );
}
