import { useState } from "react";
import { ArrowRight, Check, CircleHelp, ExternalLink } from "lucide-react";
import { RoomFrame, RoomSection, StatusTag, type Status } from "@/components/room-kit";
import { RESOURCES } from "@/data/content";

type UC = { id: string; t: string; status: Status; challenge: string; solution: string[]; arch: string[]; steps: string[]; value: string[]; questions: string[]; docs: string[] };

const UCS: UC[] = [
  {
    id: "scenario-inbound", t: "Intelligent inbound call handling", status: "Config-dependent",
    challenge: "Callers wait, get transferred, and explain themselves twice because routing is based on availability rather than need.",
    solution: ["Contact flows capture intent with IVR or a Lex bot", "Routing profiles and queues send the call to the right skill group", "Caller lookup opens the right ticket before the agent says hello"],
    arch: ["Caller", "Amazon Connect", "Contact flow + Lex", "Queue", "Agent Workspace"],
    steps: ["Dial the demo number and choose a menu option", "Show the IVR selection recorded on the ticket", "Accept in Agent Workspace and point at the matched ticket", "Open routing profiles to show queue assignment"],
    value: ["Fewer avoidable transfers", "Higher first-contact resolution potential", "Less time spent re-establishing context"],
    questions: ["How are calls routed today, and what share are transferred?", "Which intents could be captured before an agent answers?", "What caller data exists that agents cannot see today?"],
    docs: ["ivr-recipe", "routing-profiles", "attributes-call-info"],
  },
  {
    id: "scenario-ai-assisted", t: "AI-assisted customer service", status: "Plan-dependent",
    challenge: "Repetitive calls crowd out complex ones, and agents search for answers while the customer waits.",
    solution: ["AI agents or IVR self-service handle routine requests where available", "Escalation carries captured context to a human", "Copilot suggests help center answers from the live transcript"],
    arch: ["Caller", "AI agent or IVR", "Handoff", "Agent Workspace", "Copilot + help center"],
    steps: ["Start with a routine request handled by automation", "Escalate a request that needs a person", "Show the knowledge suggestion during the call", "Mark it helpful and regenerate after a topic change"],
    value: ["More agent time for complex calls", "More consistent answers", "Knowledge gaps become visible"],
    questions: ["Which call types are repetitive and well documented?", "How current is the help center for those topics?", "Who owns AI quality and escalation rules?"],
    docs: ["ai-suggestions", "translation"],
  },
  {
    id: "scenario-continuity", t: "Voice-to-digital continuity", status: "Documented",
    challenge: "A customer tried chat, then email, then calls. The phone agent sees none of it.",
    solution: ["Calls create or update Zendesk tickets alongside digital channels", "Agents see the full conversation history in one ticket view", "Follow-up can continue by email, messaging, or outbound call"],
    arch: ["Messaging / email", "Zendesk tickets", "Inbound call", "Caller lookup", "Same ticket"],
    steps: ["Show a messaging conversation on a ticket", "Place the call and show the matched ticket", "Add a call note and set pending", "Send the follow-up by email from the same ticket"],
    value: ["Customers repeat themselves less", "One record for audits and reporting", "Smoother follow-up across channels"],
    questions: ["How many calls follow a digital contact?", "Where do agents look for history today?", "Which follow-ups are by phone versus email?"],
    docs: ["calls-tickets", "outbound", "managing-calls"],
  },
  {
    id: "scenario-productivity", t: "Agent productivity", status: "Config-dependent",
    challenge: "Agents swivel between tools and spend minutes on notes after every call.",
    solution: ["Call controls live inside Agent Workspace", "Transcripts and summaries reduce manual notes where enabled", "Dashboards show where time goes"],
    arch: ["Agent Workspace", "Call controls", "Transcript", "Summary", "Dashboards"],
    steps: ["Handle the call without leaving the ticket", "Show the transcript and generated summary", "Review the call in the dashboards app", "Optionally review it in Zendesk QA"],
    value: ["Less after-call work", "More consistent records", "Lower cognitive load for agents"],
    questions: ["How long is after-call work today?", "What must agents document after every call?", "How is coaching done today?"],
    docs: ["summaries", "agent-interface", "dashboards-app", "qa-transcriptions"],
  },
  {
    id: "scenario-modernization", t: "Contact center modernization", status: "Documented",
    challenge: "Voice lives on a separate platform with separate renewals, security reviews, and reports.",
    solution: ["Amazon Connect provides a cloud telephony foundation in the customer AWS account", "Zendesk Contact Center connects it to the Zendesk service platform", "CloudFormation standardizes deployment"],
    arch: ["Legacy telephony", "Amazon Connect", "CloudFormation", "Zendesk Contact Center", "Single service platform"],
    steps: ["Walk the architecture in Room 02", "Show the customer AWS data boundary", "Explain the deployment template and identity model", "Discuss the commercial path with the account team"],
    value: ["Fewer vendors to manage", "A common foundation for AI across channels", "Simpler reporting and operations"],
    questions: ["When do current telephony contracts renew?", "Is there an existing AWS relationship?", "Who must approve a new data boundary?"],
    docs: ["components", "aws-services", "implementing", "getting-started"],
  },
];

function UseCase({ u }: { u: UC }) {
  const [step, setStep] = useState(0);
  return (
    <RoomSection id={u.id} eyebrow={`Use case`} title={u.t} lede={u.challenge} tone={UCS.indexOf(u) % 2 ? "panel" : "plain"}>
      <div className="mb-4"><StatusTag s={u.status} /></div>
      <div className="uc-arch" aria-label="Relevant architecture">
        {u.arch.map((a, k) => <span key={a} className="uc-arch-node">{a}{k < u.arch.length - 1 && <ArrowRight className="uc-arch-arrow h-3.5 w-3.5" aria-hidden />}</span>)}
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-12">
        <div className="depot-card lg:col-span-4">
          <div className="eyebrow text-[#11110D]/50">Solution approach</div>
          <ul className="mt-3 space-y-2 text-sm">{u.solution.map((s) => <li key={s} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{s}</li>)}</ul>
        </div>
        <div className="depot-card lg:col-span-4">
          <div className="eyebrow text-[#11110D]/50">Demo steps</div>
          <ol className="mt-3 space-y-1">{u.steps.map((s, k) => (
            <li key={s}><button type="button" onClick={() => setStep(k)} className={`uc-step ${k === step ? "is-on" : ""} ${k < step ? "is-done" : ""}`} data-testid={`button-${u.id}-step-${k}`}><span className="mono text-[10px]">{k + 1}</span>{s}</button></li>
          ))}</ol>
          <button type="button" className="depot-btn depot-btn-ghost mt-3" onClick={() => setStep((v) => (v + 1) % u.steps.length)} data-testid={`button-${u.id}-next`}>{step === u.steps.length - 1 ? "Restart" : "Next step"}</button>
        </div>
        <div className="lg:col-span-4 grid gap-3">
          <div className="depot-card is-lime">
            <div className="eyebrow text-[#11110D]/60">Business value</div>
            <ul className="mt-2 space-y-1 text-sm font-medium">{u.value.map((v) => <li key={v}>{v}</li>)}</ul>
            <p className="mt-2 text-[11px] text-[#11110D]/55">Directional. Measure against the customer's baseline.</p>
          </div>
          <div className="depot-card">
            <div className="eyebrow flex items-center gap-1.5 text-[#11110D]/50"><CircleHelp className="h-3.5 w-3.5" aria-hidden />Discovery questions</div>
            <ul className="mt-2 space-y-1.5 text-sm text-[#11110D]/75">{u.questions.map((q) => <li key={q}>{q}</li>)}</ul>
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {u.docs.map((d) => { const r = RESOURCES.find((x) => x.id === d); return r ? <a key={d} href={r.url} target="_blank" rel="noopener noreferrer" className="room-tag is-link" data-testid={`link-${u.id}-doc-${d}`}>{r.title}<ExternalLink className="h-3 w-3" aria-hidden /><span className="sr-only">(opens in a new tab)</span></a> : null; })}
      </div>
    </RoomSection>
  );
}

export default function UseCases() {
  return (
    <RoomFrame id="use-cases" lede="Five scenarios structured as challenge, solution, architecture, demonstration, value, and discovery. Each carries its availability label.">
      {UCS.map((u) => <UseCase key={u.id} u={u} />)}
    </RoomFrame>
  );
}
