import { useState } from "react";
import "./_group.css";
const FLOW_NODES = [
  { id: "zcc", side: "Zendesk AWS Cloud", t: "Zendesk Contact Center", sub: "Agent Workspace", d: "Call controls run in Zendesk Agent Workspace. The experience can read Amazon Connect Customer Profiles and custom contact attributes using the logged-in agent's permissions.", chips: ["Ticket search", "Agent status sync", "Call analysis", "Reporting + usage"] },
  { id: "connect", side: "Customer AWS Cloud", t: "Amazon Connect", sub: "Voice + contact flows", d: "Amazon Connect hosts the voice experience, contact flows, and routing foundation.", chips: ["Voice", "Contact flows", "Routing"] },
  { id: "lambda", side: "Customer AWS Cloud", t: "API Gateway + Lambda", sub: "Integration helpers", d: "Lambda functions and API Gateway carry call events, transcripts, recordings, and agent UI requests between Connect and Zendesk.", chips: ["Event handling", "API proxy"] },
  { id: "cognito", side: "Customer AWS Cloud", t: "AWS Cognito", sub: "Template component", d: "Cognito holds Contact Center user accounts for agents, supervisors, and admins, deployed by the CloudFormation template.", chips: ["User pool", "SAML 2.0"] },
  { id: "internal", side: "Customer AWS Cloud", t: "Internal systems", sub: "Data lake · CRM · other", d: "Customer-owned systems that contact flows and Lambda helpers can reach for lookups or data distribution, depending on configuration.", chips: ["Data lake", "CRM"] },
  { id: "records", side: "Customer AWS Cloud", t: "Call records", sub: "Logs · transcripts · CTRs", d: "Contact attributes, transcripts, and Contact Trace Records produced in the customer's AWS account.", chips: ["Contact attributes", "Transcripts", "Contact Trace Records"] },
];
const FLOWS = [
  { id: "controls", t: "Agent controls", path: ["zcc", "lambda", "connect"], d: "Agent actions in Workspace are proxied through API Gateway and Lambda to Amazon Connect." },
  { id: "context", t: "Customer context", path: ["connect", "lambda", "zcc"], d: "Caller lookup (ticket or contact search) and mapped attributes flow into the agent experience during the live call." },
  { id: "records", t: "Call records", path: ["connect", "records", "lambda", "zcc"], d: "After the call, Contact Trace Records, recordings, and transcripts are processed and sent to Zendesk where configured." },
];


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


export default function Current() { return <div className="zcc-flow-current min-h-screen"><DataFlow /></div>; }
