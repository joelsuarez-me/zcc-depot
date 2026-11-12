import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Phone, Workflow, FileText, Headset, RefreshCw, ThumbsUp, BookOpen } from "lucide-react";
import { Ext, Note, PageHero, Reveal, Section, SectionHead } from "@/components/kit";
import { CORE_COMPONENTS, FLOWS, FLOW_NODES, JOURNEY, LAMBDAS, LINKS, REGIONS } from "@/data/content";

const JICONS = [Phone, Workflow, FileText, Headset];

function Journey() {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();
  const s = JOURNEY[i];
  return (
    <div>
      <div role="tablist" aria-label="Call journey stages" className="relative grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="absolute left-[12%] right-[12%] top-9 hidden h-0.5 bg-[#203524]/15 md:block" aria-hidden>
          <div className="h-full bg-[#203524] transition-all duration-500" style={{ width: `${(i / 3) * 100}%` }} />
        </div>
        {JOURNEY.map((j, k) => {
          const I = JICONS[k];
          return (
            <button key={j.k} role="tab" aria-selected={i === k} onClick={() => setI(k)} data-testid={`tab-journey-${j.k}`} className="group relative flex flex-col items-center gap-3 rounded-2xl p-3 text-center">
              <span className={`relative z-10 grid h-14 w-14 place-items-center rounded-full transition-all ${k <= i ? "bg-[#203524] text-[#D1F470]" : "border border-[#11110D]/15 bg-[#F5F5F2] text-[#11110D]/50 group-hover:border-[#203524]"} ${k === i ? "scale-110 ring-4 ring-[#D1F470]" : ""}`}><I className="h-5 w-5" /></span>
              <span className="eyebrow text-[#11110D]/50">{j.k} · {j.label}</span>
              <span className="font-semibold">{j.t}</span>
            </button>
          );
        })}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={i} role="tabpanel" initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.3 }}
          className="mt-8 grid gap-6 rounded-[2rem] bg-[#203524] p-8 text-[#F5F5F2] md:grid-cols-2 md:p-10">
          <div>
            <h3 className="text-2xl font-semibold">{s.d}</h3>
            <p className="mt-3 text-[#F5F5F2]/70">{s.detail}</p>
            <div className="mt-5 flex flex-wrap gap-2">{s.chips.map((c) => <span key={c} className="mono rounded-full border border-[#D1F470]/40 px-3 py-1 text-xs text-[#D1F470]">{c}</span>)}</div>
          </div>
          <div className="rounded-2xl bg-[#F5F5F2] p-5 text-[#11110D]" aria-label="Illustrative Agent Workspace mock">
            <div className="flex items-center justify-between text-xs"><span className="font-semibold">Zendesk Agent Workspace</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#5a9b3c]" />Available</span></div>
            <div className="mt-4 rounded-xl border border-[#11110D]/10 bg-white/60 p-4">
              <div className="text-sm font-semibold">#4821 · Order status</div><div className="text-xs text-[#11110D]/55">Open · Priority normal</div>
              <div className={`mt-4 rounded-lg p-3 transition-colors ${i >= 3 ? "bg-[#D1F470]" : "bg-[#11110D]/5"}`}>
                <div className="mono text-[11px]">Zendesk Contact Center · 00:04</div>
                <div className="mt-1 text-sm font-medium">Jordan Rivera</div>
                <div className="text-sm italic text-[#11110D]/70">"I'm calling about my order..."</div>
                <div className="mt-3 flex gap-2 text-xs"><span className="rounded-full bg-[#11110D] px-3 py-1 text-[#F5F5F2]">Mute</span><span className="rounded-full border border-[#11110D]/20 px-3 py-1">Transfer</span></div>
              </div>
            </div>
            <p className="mono mt-3 text-[10px] text-[#11110D]/45">Illustrative mock. Not a product screenshot.</p>
          </div>
        </motion.div>
      </AnimatePresence>
      <Note>Amazon Connect + contact flow → Contact Center integration → Agent Workspace. Call attributes, recording writeback, and transcripts require configuration.</Note>
    </div>
  );
}

function DataFlow() {
  const [node, setNode] = useState("zcc");
  const [flow, setFlow] = useState<string | null>(null);
  const activeFlow = FLOWS.find((f) => f.id === flow);
  const n = FLOW_NODES.find((x) => x.id === node)!;
  const lit = (id: string) => (activeFlow ? activeFlow.path.includes(id) : id === node);
  const NodeBtn = ({ id }: { id: string }) => {
    const x = FLOW_NODES.find((y) => y.id === id)!;
    const step = activeFlow ? activeFlow.path.indexOf(id) : -1;
    return (
      <button onClick={() => { setNode(id); setFlow(null); }} aria-pressed={node === id && !flow} data-testid={`button-node-${id}`}
        className={`relative w-full rounded-2xl border p-4 text-left transition-all ${lit(id) ? "border-[#D1F470] bg-[#D1F470] text-[#11110D]" : "border-[#F5F5F2]/15 hover:border-[#D1F470]/60"}`}>
        {step >= 0 && <span className="mono absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-[#11110D] text-[10px] text-[#D1F470]">{step + 1}</span>}
        <div className="font-semibold">{x.t}</div><div className={`text-xs ${lit(id) ? "text-[#11110D]/65" : "text-[#F5F5F2]/50"}`}>{x.sub}</div>
      </button>
    );
  };
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_2fr]">
          <div className="rounded-3xl border border-[#F5F5F2]/15 p-4">
            <div className="eyebrow mb-3 text-[#D1F470]">Zendesk AWS Cloud</div>
            <NodeBtn id="zcc" />
          </div>
          <div className="hidden items-center md:flex" aria-hidden>
            <svg width="60" height="40"><line x1="0" y1="20" x2="60" y2="20" stroke="#D1F470" strokeWidth="2" className="dash-flow" /></svg>
          </div>
          <div className="rounded-3xl border border-dashed border-[#F5F5F2]/25 p-4">
            <div className="eyebrow mb-3 text-[#D1F470]">Customer AWS Cloud</div>
            <div className="grid gap-3 sm:grid-cols-2">{["connect", "lambda", "cognito", "internal", "records"].map((id) => <NodeBtn key={id} id={id} />)}</div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="eyebrow mr-2 text-[#F5F5F2]/50">Trace a flow</span>
          {FLOWS.map((f) => (
            <button key={f.id} onClick={() => setFlow(flow === f.id ? null : f.id)} aria-pressed={flow === f.id} data-testid={`button-flow-${f.id}`}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${flow === f.id ? "bg-[#D1F470] text-[#11110D]" : "border border-[#F5F5F2]/20 hover:border-[#D1F470]"}`}>{f.t}</button>
          ))}
        </div>
      </div>
      <div className="lg:col-span-4" aria-live="polite">
        <div className="h-full rounded-3xl bg-[#F5F5F2] p-7 text-[#11110D]">
          {activeFlow ? (
            <>
              <div className="eyebrow text-[#203524]">Flow</div>
              <h3 className="mt-3 text-2xl font-semibold">{activeFlow.t}</h3>
              <p className="mt-3 text-[#11110D]/70">{activeFlow.d}</p>
              <ol className="mt-5 space-y-2">{activeFlow.path.map((p, k) => <li key={p + k} className="flex gap-3 text-sm"><span className="mono text-[#203524]/50">{k + 1}</span>{FLOW_NODES.find((x) => x.id === p)!.t}</li>)}</ol>
            </>
          ) : (
            <>
              <div className="eyebrow text-[#203524]">{n.side}</div>
              <h3 className="mt-3 text-2xl font-semibold">{n.t}</h3>
              <p className="mt-3 text-[#11110D]/70">{n.d}</p>
              <div className="mt-5 flex flex-wrap gap-2">{n.chips.map((c) => <span key={c} className="rounded-full bg-[#203524]/8 px-3 py-1 text-xs">{c}</span>)}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Lambdas() {
  const [tab, setTab] = useState<"deployment" | "runtime">("runtime");
  const [q, setQ] = useState("");
  const list = LAMBDAS[tab].filter((l) => (l.n + l.d).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="mt-12 rounded-[2rem] border border-[#11110D]/10 bg-[#FBFBF8] p-6 md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div><h3 className="text-2xl font-semibold">AWS Lambda functions</h3><p className="mt-1 text-[#11110D]/60">Some prepare the environment during deployment. Others respond to calls, transcripts, recordings, analytics, or agent UI requests.</p></div>
        <div className="flex flex-wrap gap-2">
          <div role="tablist" className="flex rounded-full bg-[#11110D]/6 p-1">
            {(["deployment", "runtime"] as const).map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} data-testid={`tab-lambda-${t}`} className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${tab === t ? "bg-[#203524] text-[#D1F470]" : ""}`}>{t} ({LAMBDAS[t].length})</button>
            ))}
          </div>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter functions" aria-label="Filter Lambda functions" data-testid="input-lambda-filter" className="rounded-full border border-[#11110D]/15 bg-transparent px-4 py-1.5 text-sm" />
        </div>
      </div>
      <p className="mono mt-4 text-xs text-[#11110D]/50">{tab === "deployment" ? "Configure and discover resources" : "Process contact and app events"}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {list.map((l) => (
          <div key={l.n} className="rounded-2xl border border-[#11110D]/8 p-5 transition hover:border-[#203524]/40">
            <code className="mono text-sm font-medium text-[#203524]">λ {l.n}</code>
            <p className="mt-2 text-sm leading-relaxed text-[#11110D]/70">{l.d}</p>
          </div>
        ))}
        {list.length === 0 && <p className="text-sm text-[#11110D]/55">No functions match "{q}". <button className="underline" onClick={() => setQ("")}>Clear filter</button></p>}
      </div>
    </div>
  );
}

function Footprint() {
  const [sel, setSel] = useState<string | null>(null);
  const region = REGIONS.find((r) => r.pts.some((p) => p.n === sel));
  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <div className="relative aspect-[2/1] overflow-hidden rounded-[2rem] bg-[#203524]">
          <div className="grid-lines absolute inset-0" aria-hidden />
          {REGIONS.flatMap((r) => r.pts.map((p) => (
            <button key={p.n} onClick={() => setSel(p.n)} aria-pressed={sel === p.n} aria-label={`${p.n}, ${r.r}`} data-testid={`button-pod-${p.n.replace(/\W/g, "").toLowerCase()}`}
              className="group absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
              <span className="pulse-ring absolute inset-0 rounded-full bg-[#D1F470]/40" aria-hidden />
              <span className={`relative block h-3.5 w-3.5 rounded-full border-2 border-[#D1F470] transition ${sel === p.n ? "scale-150 bg-[#D1F470]" : "bg-[#203524] group-hover:bg-[#D1F470]"}`} />
              <span className="mono absolute left-1/2 top-5 -translate-x-1/2 whitespace-nowrap text-[10px] text-[#F5F5F2]/70">{p.n}</span>
            </button>
          )))}
          {["Americas", "Europe", "Asia Pacific"].map((t, k) => <span key={t} className="eyebrow absolute bottom-4 text-[#D1F470]/60" style={{ left: `${[8, 42, 74][k]}%` }}>{t}</span>)}
        </div>
      </div>
      <div className="space-y-4 lg:col-span-4">
        <div className="rounded-3xl bg-[#D1F470] p-6" aria-live="polite">
          <div className="eyebrow">Global delivery network</div>
          <p className="mt-3 text-2xl font-semibold">{sel ? `${sel}` : "Select a delivery point."}</p>
          <p className="mt-1 text-[#11110D]/70">{region ? `${region.r} · ${region.pts.map((p) => p.n).join(", ")}` : "Pins mark the regions shown in the supplied overview."}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[["15", "Global pods"], ["9", "Regions"], ["3", "AZs / pod"]].map(([v, l]) => <div key={l} className="rounded-2xl border border-[#11110D]/10 p-3"><div className="text-2xl font-semibold">{v}</div><div className="text-xs text-[#11110D]/55">{l}</div></div>)}
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[["3.3B", "Users"], ["2.8T", "Requests"], ["100,000+", "Customers"]].map(([v, l]) => <div key={l} className="rounded-2xl bg-[#203524] p-3 text-[#F5F5F2]"><div className="text-lg font-semibold text-[#D1F470]">{v}</div><div className="text-xs text-[#F5F5F2]/60">{l}</div></div>)}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:col-span-12 lg:grid-cols-4">
        {[["AWS-powered foundation", "Infrastructure designed to scale across service tiers."], ["Regional Points of Delivery", "Services delivered from geographically distributed locations."], ["Isolated service pods", "Designed to contain incidents and support resilience."], ["Data-location choice", "Customers can request a nearby or local data center."]].map(([t, d], k) => (
          <div key={t} className="rounded-2xl border border-[#11110D]/10 p-5"><div className="mono text-xs text-[#203524]/50">0{k + 1}</div><div className="mt-2 font-semibold">{t}</div><p className="mt-1 text-sm text-[#11110D]/60">{d}</p></div>
        ))}
      </div>
    </div>
  );
}

export default function Architecture() {
  return (
    <>
      <PageHero eyebrow="Architecture · Interactive explanations" title={<>Two clouds. <span className="serif italic text-[#D1F470]">Connected service paths.</span></>}
        lede="Amazon Connect handles the call and routing. Zendesk Contact Center brings call controls and customer context into the agent workspace. Here is how to explain everything in between.">
        {[["#journey", "Call journey"], ["#ai-suggestions", "AI suggestions"], ["#data-flow", "Data flow"], ["#components", "Components"], ["#footprint", "Global footprint"], ["#collaboration", "A2A collaboration"]].map(([h, l]) => (
          <a key={h} href={h} className="rounded-full border border-[#F5F5F2]/20 px-4 py-2 text-sm hover:border-[#D1F470] hover:text-[#D1F470]" data-testid={`link-jump-${h.slice(1)}`}>{l}</a>
        ))}
      </PageHero>

      <Section>
        <SectionHead id="journey" num="01" eyebrow="How it works" title="From caller to Zendesk agent" lede="Select a stage to see what it does. Illustrative architecture." />
        <Journey />
      </Section>

      <Section tone="white">
        <SectionHead id="ai-suggestions" num="02" eyebrow="Agent knowledge" title={<>Live transcript in. <span className="hl">Relevant knowledge out.</span></>}
          lede="Give agents call-specific guidance from your Zendesk help center while a customer conversation is still in progress." />
        <div className="grid gap-6 lg:grid-cols-12">
          <Reveal className="rounded-[2rem] bg-[#203524] p-8 text-[#F5F5F2] lg:col-span-5">
            <div className="eyebrow text-[#D1F470]">Prerequisites</div>
            <ul className="mt-5 space-y-4">
              {["Live voice transcripts enabled in Contact Center", "Zendesk Copilot available on the account", "A help center that covers the topics customers call about"].map((p) => (
                <li key={p} className="flex gap-3"><span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-sm bg-[#D1F470]" />{p}</li>
              ))}
            </ul>
            <p className="mt-8 text-sm leading-relaxed text-[#F5F5F2]/70">Generative AI analyzes the live transcript, identifies the customer's reason for calling, and searches the help center. Suggested answers appear in the Knowledge tab, supported by one or more relevant articles.</p>
            <div className="mono mt-6 flex flex-wrap items-center gap-2 text-xs text-[#D1F470]"><span>Live call transcript</span>→<span>AI finds guidance</span>→<span>Knowledge panel</span></div>
          </Reveal>
          <div className="grid gap-4 lg:col-span-7">
            {[[BookOpen, "Open suggestions", "During an active phone conversation in Agent Workspace, select View knowledge suggestions in the ticket. Suggestions open in the Knowledge panel."], [ThumbsUp, "Review and give feedback", "Mark a suggestion Helpful or Not helpful based on its accuracy and relevance. Feedback may inform future model improvements, which might not appear immediately."], [RefreshCw, "Regenerate as the call changes", "If the customer changes topics or the conversation takes a new direction, select Regenerate to request updated suggestions."]].map(([I, t, d], k) => {
              const Icon = I as typeof BookOpen;
              return (
                <Reveal key={t as string} delay={k * 0.07} className="flex gap-5 rounded-3xl border border-[#11110D]/10 p-6 transition hover:border-[#203524]/40">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#D1F470]"><Icon className="h-5 w-5" /></span>
                  <div><div className="mono text-xs text-[#11110D]/45">0{k + 1}</div><h3 className="text-lg font-semibold">{t as string}</h3><p className="mt-1 text-[#11110D]/65">{d as string}</p></div>
                </Reveal>
              );
            })}
            <div className="rounded-3xl border-2 border-dashed border-[#203524]/25 p-6">
              <h3 className="font-semibold">Prepare your help center for better suggestions</h3>
              <p className="mt-1 text-[#11110D]/65">Make sure your help center covers the common topics customers call about. If the source articles are missing or out of date, AI suggestions may not be useful to agents.</p>
            </div>
          </div>
        </div>
        <Note>Based on <Ext href={LINKS.aiSuggestions} className="underline">Using real-time AI suggestions in Contact Center</Ext>. Requires live voice transcripts and Zendesk Copilot; availability depends on account configuration.</Note>
      </Section>

      <Section tone="forest">
        <SectionHead id="data-flow" num="03" eyebrow="System + data flow" dark title="Detailed system overview" lede="Explore the service boundary between Zendesk and the customer-managed AWS environment. Select a component, or trace a flow end to end." />
        <DataFlow />
        <p className="mt-8 text-xs text-[#F5F5F2]/50">Conceptual architecture. Confirm deployment-specific services, regions, and integration behavior with current product guidance.</p>
      </Section>

      <Section>
        <SectionHead id="components" num="04" eyebrow="Components" title="How the pieces fit together" lede="Each Contact Center environment connects to one Amazon Connect instance and uses supporting services deployed in the customer's AWS account." />
        <div className="mb-8 grid items-stretch gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
          {[["Agent experience", "Zendesk Contact Center app", "Omnichannel inbox, AI tools, dashboards, and agent workflows"], ["Voice + routing", "Amazon Connect", "Calls, chats, queues, contact flows, and routing"], ["Integration layer", "AWS services", "CloudFormation, Lambda, Cognito, and event or streaming connections"]].map(([e, t, d], k) => (
            <div key={t} className="contents">
              <div className={`rounded-3xl p-6 ${k === 0 ? "bg-[#D1F470]" : "bg-[#203524] text-[#F5F5F2]"}`}><div className="eyebrow opacity-60">{e}</div><div className="mt-3 text-lg font-semibold">{t}</div><p className="mt-1 text-sm opacity-70">{d}</p></div>
              {k < 2 && <div className="hidden items-center justify-center text-2xl text-[#203524]/40 md:flex" aria-hidden>↔</div>}
            </div>
          ))}
        </div>
        <div className="mb-8 rounded-3xl border-2 border-[#203524] p-6">
          <div className="eyebrow text-[#203524]">Customer data boundary</div>
          <p className="mt-2 text-lg">Contact Center is deployed in the customer's AWS environment. Zendesk's guide says call recordings, customer information, and other Contact Center data stay in that AWS account.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {CORE_COMPONENTS.map((c, k) => (
            <Reveal key={c.n} delay={k * 0.05} className="rounded-3xl border border-[#11110D]/10 bg-[#FBFBF8] p-7">
              <div className="mono text-sm text-[#203524]/50">{c.n}</div>
              <h3 className="mt-3 text-xl font-semibold">{c.t}</h3>
              <p className="mt-2 leading-relaxed text-[#11110D]/70">{c.d}</p>
              <div className="mt-4 flex flex-wrap gap-2">{c.chips.map((x) => <span key={x} className="rounded-full bg-[#203524]/8 px-3 py-1 text-xs">{x}</span>)}</div>
            </Reveal>
          ))}
        </div>
        <Lambdas />
        <div className="mt-6 flex gap-5 rounded-3xl bg-[#203524] p-7 text-[#F5F5F2]">
          <RefreshCw className="h-6 w-6 shrink-0 text-[#D1F470]" aria-hidden />
          <div><h3 className="text-lg font-semibold">Upgrades use a parallel stack</h3><p className="mt-1 text-[#F5F5F2]/70">Zendesk's guide describes creating a new CloudFormation stack alongside the existing one, switching Contact Center after the new stack is ready, validating it, and then removing the old stack. Keeping the old stack until validation provides a rollback point.</p></div>
        </div>
        <Note>Source: <Ext href={LINKS.components} className="underline">Understanding Contact Center components</Ext>. Exact resources and behavior depend on the deployed version and configuration.</Note>
      </Section>

      <Section tone="white">
        <SectionHead id="footprint" num="05" eyebrow="Global platform" title="One global platform, resilient regional infrastructure" lede="Select a delivery point to explore Zendesk's global footprint." />
        <Footprint />
        <Note>Scale figures and locations reproduced from the supplied Zendesk architecture overview image. Map positions are approximate.</Note>
      </Section>

      <Section tone="ink">
        <SectionHead id="collaboration" num="06" eyebrow="Latest news · per internal briefing" dark title={<>Agent-to-Agent collaboration <span className="serif italic text-[#D1F470]">in Amazon Connect</span></>}
          lede="Per the source briefing, AWS launched A2A collaboration (GA, Customer tier), bringing specialist AI agents into live customer contacts under a Connect orchestrator." />
        <p className="mb-8 rounded-2xl border border-[#D1F470]/30 p-4 text-sm text-[#F5F5F2]/75"><strong className="text-[#D1F470]">Terminology:</strong> A2A here means AI-agent collaboration, not a human agent-to-agent transfer. Connect adds voice streaming, session continuity, and built-in observability to the open A2A protocol.</p>
        <div className="grid gap-3 md:grid-cols-4">
          {[["Live contact", "Customer calls Amazon Connect"], ["Connect AI orchestrator", "Chooses whether and when to involve a specialist"], ["Specialist collaborator", "Connect, Bedrock AgentCore, or a compliant external agent"], ["Resolution path", "Return to orchestrator or escalate through the contact flow"]].map(([t, d], k) => (
            <div key={t} className="relative rounded-2xl border border-[#F5F5F2]/12 p-5"><div className="mono text-xs text-[#D1F470]">0{k + 1}</div><div className="mt-2 font-semibold">{t}</div><p className="mt-1 text-sm text-[#F5F5F2]/60">{d}</p></div>
          ))}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {[["Mode 01", "Delegate behind the scenes", "The orchestrator stays with the customer while a specialist handles a focused task, such as a fraud risk assessment, then returns a result."], ["Mode 02", "Hand off to a specialist", "The collaborator speaks with the customer for a multi-turn task, then returns control with a completion or escalation outcome."]].map(([m, t, d]) => (
            <div key={m} className="rounded-3xl bg-[#203524] p-7"><div className="eyebrow text-[#D1F470]">{m}</div><h3 className="mt-3 text-xl font-semibold">{t}</h3><p className="mt-2 text-[#F5F5F2]/70">{d}</p></div>
          ))}
        </div>
        <div className="mt-8 rounded-3xl bg-[#F5F5F2] p-7 text-[#11110D]">
          <div className="eyebrow text-[#203524]">What it means for Zendesk Contact Center</div>
          <p className="mt-3 text-lg">ZCC runs on Amazon Connect, so A2A could fit its voice foundation. Open design questions: account tier, API configuration ownership, context transfer, reporting, and commercial model.</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[["Availability", "Confirm Connect Customer tier eligibility and regional rollout."], ["Orchestration", "Decide which agent leads and whether Zendesk AI or Forethought should be explored as a collaborator."], ["Context + controls", "Design ticket-data access, trace reporting, human escalation, and combined AI-cost visibility."]].map(([t, d]) => <div key={t} className="rounded-2xl border border-[#11110D]/10 p-4"><div className="font-semibold">{t}</div><p className="mt-1 text-sm text-[#11110D]/65">{d}</p></div>)}
          </div>
        </div>
        <p className="mt-6 text-xs text-[#F5F5F2]/50">Based on an internal A2A briefing; dates and tiers as stated there. Zendesk AI and Forethought collaborator paths require product and technical validation and are not presented as current integrations.</p>
      </Section>
    </>
  );
}
