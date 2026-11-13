import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Compass, Network, PlayCircle } from "lucide-react";
import { DEMO_URL } from "@/data/content";
import { ROOMS } from "@/data/depot-rooms";

type HN = { id: string; t: string; sub: string; x: number; y: number; d: string; tone: "ch" | "ai" | "aws" | "zd" | "an" };
const NODES: HN[] = [
  { id: "cust", t: "Customer", sub: "Voice · digital", x: 70, y: 190, tone: "ch", d: "Customers call, message, or email. Voice enters through Amazon Connect; digital channels enter Zendesk." },
  { id: "connect", t: "Amazon Connect", sub: "Telephony · flows", x: 250, y: 110, tone: "aws", d: "Telephony, contact flows, and routing in the customer's AWS account." },
  { id: "digital", t: "Zendesk channels", sub: "Messaging · email", x: 250, y: 280, tone: "ch", d: "Digital conversations handled natively by Zendesk and stored on tickets." },
  { id: "ai", t: "AI layer", sub: "Self-service · assist", x: 430, y: 190, tone: "ai", d: "AI agents, IVR self-service, and Copilot suggestions. Availability depends on plan and configuration." },
  { id: "ws", t: "Agent Workspace", sub: "Calls + tickets", x: 600, y: 110, tone: "zd", d: "Agents handle calls, tickets, and customer context together." },
  { id: "an", t: "Analytics", sub: "Dashboards · QA", x: 600, y: 280, tone: "an", d: "Dashboards from call records; optional Zendesk QA for transcript review." },
];
const EDGES: [string, string][] = [["cust", "connect"], ["cust", "digital"], ["connect", "ai"], ["digital", "ai"], ["ai", "ws"], ["connect", "ws"], ["digital", "ws"], ["ws", "an"], ["ai", "an"]];
const pos = (id: string) => NODES.find((n) => n.id === id)!;

function HeroDiagram() {
  const [sel, setSel] = useState("ws");
  const reduce = useReducedMotion();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setTick((v) => v + 1), 2600);
    return () => clearInterval(t);
  }, [reduce]);
  const order = ["cust", "connect", "ai", "ws", "an"];
  const pulse = order[tick % order.length];
  const n = pos(sel);
  return (
    <div className="hh-diagram">
      <svg viewBox="0 0 680 380" className="w-full" role="group" aria-label="Conceptual Zendesk Contact Center overview. Select a node to learn more.">
        <defs>
          <pattern id="hh-grid" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#F5F5F2" opacity=".08" /></pattern>
        </defs>
        <rect width="680" height="380" fill="url(#hh-grid)" />
        <rect x="190" y="60" width="140" height="290" rx="20" className="hh-zone" />
        <text x="204" y="82" className="hh-zone-t">CUSTOMER AWS</text>
        <rect x="370" y="60" width="300" height="290" rx="20" className="hh-zone is-z" />
        <text x="384" y="82" className="hh-zone-t">ZENDESK</text>
        {EDGES.map(([a, b]) => {
          const A = pos(a), B = pos(b);
          const on = a === sel || b === sel;
          const d = `M${A.x} ${A.y} C${(A.x + B.x) / 2} ${A.y}, ${(A.x + B.x) / 2} ${B.y}, ${B.x} ${B.y}`;
          return <g key={a + b} className={`hh-edge ${on ? "on" : ""}`}><path d={d} /><path d={d} className="hh-flow" /></g>;
        })}
        {NODES.map((x) => (
          <g key={x.id} className={`hh-node t-${x.tone} ${sel === x.id ? "sel" : ""}`} tabIndex={0} role="button" aria-pressed={sel === x.id} aria-label={`${x.t}: ${x.d}`}
            onClick={() => setSel(x.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSel(x.id); } }} data-testid={`node-hero-${x.id}`}>
            {pulse === x.id && !reduce && <circle cx={x.x} cy={x.y} r="30" className="hh-pulse" />}
            <rect x={x.x - 70} y={x.y - 26} width="140" height="52" rx="12" />
            <text x={x.x} y={x.y - 3} textAnchor="middle" className="hh-t">{x.t}</text>
            <text x={x.x} y={x.y + 13} textAnchor="middle" className="hh-s">{x.sub}</text>
          </g>
        ))}
      </svg>
      <div className="hh-caption" aria-live="polite" data-testid="text-hero-node"><strong>{n.t}.</strong> {n.d}</div>
      <p className="mono mt-1 text-[10px] uppercase tracking-[0.14em] text-[#F5F5F2]/40">Conceptual overview · see Room 02 for the detailed architecture</p>
    </div>
  );
}

export function HomeHero() {
  const reduce = useReducedMotion();
  return (
    <section id="overview" data-section-nav aria-label="Overview" className="hh on-dark">
      <div className="hh-grid">
        <motion.div initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}>
          <div className="eyebrow text-[#D1F470]">Zendesk Contact Center</div>
          <h1 className="mt-3 text-[2.1rem] font-semibold leading-[1.02] tracking-[-0.035em] md:text-[3.1rem]">Platform Architect Depot</h1>
          <p className="mt-3 text-lg font-medium text-[#D1F470] md:text-xl">Architect the solution. Demonstrate the value. Accelerate the win.</p>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#F5F5F2]/72">An interactive solution engineering hub built by Zendesk Contact Center Platform Architects. Explore technical architectures, demonstrate real-world use cases, and connect product capabilities to measurable customer outcomes.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/rooms/architecture-integrations" className="depot-btn depot-btn-lime" data-testid="button-cta-architecture"><Network className="h-4 w-4" aria-hidden />Explore Architecture</Link>
            <a href={DEMO_URL} target="_blank" rel="noopener noreferrer" className="depot-btn depot-btn-outline" data-testid="button-cta-demo"><PlayCircle className="h-4 w-4" aria-hidden />Launch Demo Experience<span className="sr-only">(opens in a new tab)</span></a>
            <Link href="/rooms/use-cases" className="depot-btn depot-btn-outline" data-testid="button-cta-use-cases"><Compass className="h-4 w-4" aria-hidden />Discover Use Cases</Link>
          </div>
        </motion.div>
        <div><HeroDiagram /></div>
      </div>
    </section>
  );
}

export function RoomStrip() {
  return (
    <section aria-labelledby="rooms-title" className="rs" id="rooms" data-section-nav>
      <div className="flex items-end justify-between gap-4">
        <div><div className="eyebrow text-[#11110D]/55">Six demo rooms</div><h2 id="rooms-title" className="mt-1 text-2xl font-semibold tracking-[-0.02em]">Pick the conversation</h2></div>
        <p className="hidden max-w-sm text-sm text-[#11110D]/60 md:block">Each room is self-contained, presentable, and backed by documentation. Presenter Mode adds notes for signed-in teams.</p>
      </div>
      <ol className="rs-grid mt-5">
        {ROOMS.map((r) => (
          <li key={r.id}>
            <Link href={r.href} className="rs-card" data-testid={`card-room-${r.id}`}>
              <span className="rs-num">{r.n}</span>
              <span className="mt-6 block text-lg font-semibold leading-tight tracking-tight">{r.title}</span>
              <span className="mt-1.5 block text-sm leading-snug text-[#11110D]/62">{r.summary}</span>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold">Enter room<ArrowRight className="rs-arrow h-3.5 w-3.5" aria-hidden /></span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
