import { useState } from "react";
import { SimulationCaption } from "@/components/simulation-caption";
import { motion, useReducedMotion } from "framer-motion";
import { User, Phone, Workflow, GitBranch, ListOrdered, Users, Headset, Cpu, Database, Timer, type LucideIcon } from "lucide-react";
import type { RoutingConfig, RoutingResult } from "@/lib/routing-engine";
import { txt, type Method, type DNode } from "@/data/routing-scenarios";

export type NState = "pending" | "lit" | "current" | "taken" | "rejected" | "eligible" | "ineligible" | "selected" | "waiting";

export function firstIdx(r: RoutingResult, node?: string) { return node ? r.events.findIndex((e) => e.node === node) : -1; }

/** Agent status at playback index, never revealing later events. */
export function agentView(r: RoutingResult, idx: number, id: string): { s: NState; reason: string } {
  let snap: { id: string; eligible: boolean; reason: string } | undefined;
  for (let i = Math.min(idx, r.events.length - 1); i >= 0; i--) {
    const el = r.events[i].eligibility;
    if (el) { snap = el.find((x) => x.id === id); break; }
  }
  if (!snap) return { s: "pending", reason: "Not evaluated yet" };
  const offer = r.events.findIndex((e) => e.state === "Offered");
  if (offer >= 0 && idx >= offer && r.selectedAgent === id) return { s: "selected", reason: snap.reason };
  return { s: snap.eligible ? "eligible" : "ineligible", reason: snap.reason };
}

function nodeState(n: DNode, c: RoutingConfig, r: RoutingResult, idx: number): NState {
  if (n.agent) return agentView(r, idx, n.agent).s;
  const cur = r.events[idx]?.node;
  let ri = firstIdx(r, n.on ?? n.after);
  if (ri < 0 && n.taken) ri = firstIdx(r, "queue");
  const reached = ri >= 0 && idx >= ri;
  if (n.taken) {
    if (!reached) return "pending";
    if (!n.taken(c, r)) return "rejected";
    return cur === (n.on ?? n.after) ? "current" : "taken";
  }
  if (!reached) return "pending";
  return cur === n.on ? (r.events[idx].state === "Fallback" ? "waiting" : "current") : "lit";
}

const W = 168, H = 78, VW = 1380, VH = 500;
const X = (x: number) => 30 + x * 1.4, Y = (y: number) => 18 + y * 1.06;

type Kind = "customer" | "entry" | "flow" | "decision" | "queue" | "eligibility" | "agent" | "aws" | "ext" | "fallback";
const KIND: Record<Kind, { Icon: LucideIcon; tab: string; pale: string; tag: string }> = {
  customer: { Icon: User, tab: "#6B7280", pale: "#EEF0F2", tag: "Caller" },
  entry: { Icon: Phone, tab: "#3B7DD8", pale: "#E3EEFB", tag: "Connect" },
  flow: { Icon: Workflow, tab: "#3B7DD8", pale: "#E3EEFB", tag: "Flow" },
  decision: { Icon: GitBranch, tab: "#3B7DD8", pale: "#E3EEFB", tag: "Decide" },
  queue: { Icon: ListOrdered, tab: "#2A9192", pale: "#DDF0EF", tag: "Queue" },
  eligibility: { Icon: Users, tab: "#2A9192", pale: "#DDF0EF", tag: "Match" },
  agent: { Icon: Headset, tab: "#3E9B57", pale: "#E2F2E6", tag: "Agent" },
  aws: { Icon: Cpu, tab: "#E8862A", pale: "#FCEBD9", tag: "AWS" },
  ext: { Icon: Database, tab: "#8457C9", pale: "#EEE6F8", tag: "Data" },
  fallback: { Icon: Timer, tab: "#B4561F", pale: "#F8E4D6", tag: "Fallback" },
};
function kindOf(n: DNode): Kind {
  if (n.agent) return "agent";
  if (n.tone) return n.tone;
  if (n.id === "customer" || n.id.startsWith("ch-") || n.id.startsWith("w-")) return n.id.startsWith("w-") ? "queue" : "customer";
  if (n.id === "entry") return "entry";
  if (n.on === "eligibility" || n.id === "elig") return "eligibility";
  if (n.on === "decision" || n.id === "ivr" || n.id.startsWith("l-") || n.id === "s1" || n.id === "s2") return "decision";
  if (n.on === "queue" || n.id.startsWith("q-") || n.after === "queue") return "queue";
  return "flow";
}
function wrap(t: string, max: number): string[] {
  const words = t.split(" "); const out: string[] = []; let cur = "";
  for (const w of words) { if ((cur + " " + w).trim().length > max && cur) { out.push(cur); cur = w; } else cur = (cur + " " + w).trim(); }
  if (cur) out.push(cur);
  return out.length > 2 ? [out[0], out.slice(1).join(" ")] : out;
}
/** Never clips: an overlong line is compressed to the available width. */
function Fit({ x, y, cls, t, max, w }: { x: number; y: number; cls: string; t: string; max: number; w: number }) {
  return t.length > max ? <text x={x} y={y} className={cls} textLength={w} lengthAdjust="spacingAndGlyphs">{t}</text> : <text x={x} y={y} className={cls}>{t}</text>;
}
const STATE_LABEL: Record<NState, string> = { pending: "Not reached", lit: "Passed", current: "Active step", taken: "Chosen path", rejected: "Not taken", eligible: "Eligible", ineligible: "Ineligible", selected: "Selected", waiting: "Timer running" };

export function RoutingDiagram({ method, config, result, idx, running, still }: { method: Method; config: RoutingConfig; result: RoutingResult; idx: number; running: boolean; still: boolean }) {
  const reduce = useReducedMotion();
  const [pick, setPick] = useState<string | null>(null);
  const nodes = method.diagram.nodes;
  const st = Object.fromEntries(nodes.map((n) => [n.id, nodeState(n, config, result, idx)]));
  const pos = Object.fromEntries(nodes.map((n) => [n.id, { x: X(n.x), y: Y(n.y) }]));
  const live = (s: NState) => s !== "pending" && s !== "rejected" && s !== "ineligible";
  const curNode = nodes.find((n) => st[n.id] === "current" || st[n.id] === "selected" || st[n.id] === "waiting") ?? nodes.find((n) => n.id === "customer") ?? nodes[0];
  const picked = nodes.find((n) => n.id === pick);
  const ev = result.events[idx];
  const agentIds = nodes.filter((n) => n.agent).map((n) => n.id);
  const srcs = Array.from(new Set(method.diagram.edges.filter(([, b]) => agentIds.includes(b)).map(([a]) => a)));
  const fbSrc = new Set(method.diagram.edges.filter(([, b, f]) => f && agentIds.includes(b)).map(([a]) => a));
  const edges: [string, string, ("fb")?][] = [...method.diagram.edges.filter(([, b]) => !agentIds.includes(b)), ...srcs.flatMap((a) => agentIds.map((b) => (fbSrc.has(a) ? [a, b, "fb"] : [a, b]) as [string, string, ("fb")?]))];
  const mid = `rt-${method.id}`;
  const cp = pos[curNode.id];
  return (
    <div className={`rt-diagram ${running && !still ? "is-running" : ""}`} data-testid="routing-diagram">
      <div className="rt-dhead">
        <span className="rt-dlive"><i />{ev?.state}</span>
        <span className="rt-dlabel" data-testid="text-diagram-current">{ev?.label}</span>
        <span className="rt-legend" aria-hidden><b className="l-on" />Active path<b className="l-fb" />Fallback<b className="l-rej" />Not taken</span>
      </div>
      <div className="rt-rails" aria-label="Node categories">{Array.from(new Set(nodes.map(kindOf))).map((k) => <span key={k}><i style={{ background: KIND[k].tab }} />{KIND[k].tag}</span>)}</div>
      <p className="rt-swipe" data-testid="text-diagram-swipe-hint"><i />Swipe sideways inside the diagram to see every node</p>
      <SimulationCaption title={ev?.label ?? "Ready to start"} status={running ? "Playing" : idx >= result.events.length - 1 ? "Completed" : "Ready / paused"} step={`Step ${idx + 1} of ${result.events.length}`}>{ev?.detail}</SimulationCaption>
      <div className="rt-diagram-scroll">
        <svg viewBox={`0 0 ${VW} ${VH}`} role="group" aria-label={`${method.title} routing diagram. Current step: ${ev?.label}`}>
          <defs>
            <pattern id={`${mid}-dots`} width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#2B2F36" opacity=".12" /></pattern>
            <marker id={`${mid}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9z" fill="#2B2F36" /></marker>
            <marker id={`${mid}-arrow-on`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9z" fill="#111317" /></marker>
            <marker id={`${mid}-arrow-rej`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9z" fill="#B9BDC4" /></marker>
          </defs>
          <rect width={VW} height={VH} fill={`url(#${mid}-dots)`} />
          <g aria-hidden>
            {edges.map(([a, b, fb]) => {
              const A = pos[a], B = pos[b]; if (!A || !B) return null;
              const on = live(st[a]) && live(st[b]);
              const rej = st[a] === "rejected" || st[b] === "rejected" || st[b] === "ineligible";
              const sx = A.x + W / 2, ex = B.x - W / 2 - 4;
              const back = ex < sx;
              const d = back ? `M${A.x} ${A.y + H / 2} C${A.x} ${A.y + H / 2 + 60} ${B.x} ${B.y - H / 2 - 60} ${B.x} ${B.y - H / 2 - 4}` : `M${sx} ${A.y} C${(sx + ex) / 2} ${A.y} ${(sx + ex) / 2} ${B.y} ${ex} ${B.y}`;
              const cls = on ? "is-on" : rej ? "is-rej" : "";
              return (
                <g key={a + b} className={`rt-edge ${cls} ${fb ? "is-fb" : ""}`}>
                  <path d={d} markerEnd={`url(#${mid}-arrow${on ? "-on" : rej ? "-rej" : ""})`} />
                  {on && <circle r={4.4} className="rt-dot" style={{ offsetPath: `path('${d}')` }} />}
                </g>
              );
            })}
          </g>
          {nodes.map((n) => {
            const s = st[n.id]; const p = pos[n.id]; const k = KIND[kindOf(n)];
            const label = txt(n.label, config, result);
            const sub = n.agent ? STATE_LABEL[s] : txt(n.sub, config, result);
            const lines = wrap(label, 13);
            const x0 = p.x - W / 2, y0 = p.y - H / 2;
            const tx = x0 + 58;
            const hot = s === "current" || s === "selected" || s === "waiting";
            return (
              <g key={n.id} className={`rt-node s-${s} k-${kindOf(n)}`} tabIndex={0} role="button" aria-pressed={pick === n.id}
                aria-label={`${label}. ${sub}. State: ${STATE_LABEL[s]}. ${n.role}`}
                onClick={() => setPick(n.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setPick(n.id); } }} data-testid={`node-${n.id}`}>
                <title>{`${label}. ${sub}. ${n.role}`}</title>
                {hot && <rect className="rt-halo" x={x0 - 6} y={y0 - 6} width={W + 12} height={H + 12} rx={15} />}
                <rect x={x0} y={y0} width={W} height={H} rx={10} className="rt-node-card" />
                <path d={`M${x0 + 10} ${y0} h16 v${H} h-16 a10 10 0 0 1 -10 -10 v${-(H - 20)} a10 10 0 0 1 10 -10z`} fill={k.tab} className="rt-tab" />
                <text transform={`translate(${x0 + 17} ${y0 + H / 2}) rotate(-90)`} textAnchor="middle" className="rt-tag">{k.tag}</text>
                <path d={`M${x0 + 26} ${y0 + 52} H${x0 + W} V${y0 + H - 10} a10 10 0 0 1 -10 10 H${x0 + 26} Z`} fill={k.pale} className="rt-band" />
                <line x1={x0 + 26} x2={x0 + W} y1={y0 + 52} y2={y0 + 52} className="rt-rule" />
                <k.Icon x={x0 + 32} y={y0 + 15} width={20} height={20} strokeWidth={1.7} className="rt-icon" aria-hidden />
                {lines.map((l, i) => <Fit key={i} x={tx} y={(lines.length > 1 ? y0 + 22 : y0 + 31) + i * 15} cls={`rt-t ${lines.length > 1 ? "is-two" : ""}`} t={l} max={15} w={W - 66} />)}
                {sub && <Fit x={x0 + 34} y={y0 + 69} cls="rt-s" t={sub} max={21} w={W - 42} />}
                <rect x={x0} y={y0} width={W} height={H} rx={10} className="rt-outline" />
                {(s === "rejected" || s === "ineligible") && <g className="rt-x"><circle cx={x0 + W - 4} cy={y0 + 4} r={9} /><path d={`M${x0 + W - 8} ${y0} l8 8 m0 -8 l-8 8`} /></g>}
                {(s === "taken" || s === "selected") && <g className="rt-ok"><circle cx={x0 + W - 4} cy={y0 + 4} r={9} /><path d={`M${x0 + W - 8.5} ${y0 + 4} l3 3 l6 -6`} /></g>}
                {s === "waiting" && <g className="rt-timer"><rect x={x0 + W - 58} y={y0 - 11} width={50} height={20} rx={10} /><text x={x0 + W - 33} y={y0 + 3} textAnchor="middle">{config.timeout}s</text></g>}
              </g>
            );
          })}
          <motion.g initial={false} animate={{ x: cp.x, y: cp.y - H / 2 - 12 }} transition={reduce || still ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 18 }} aria-hidden>
            <circle r={13} className="rt-token-ring" /><circle r={6.5} className="rt-token" />
          </motion.g>
        </svg>
      </div>
      <div className="rt-node-detail" aria-live="polite" data-testid="text-node-detail">
        {picked ? <><strong>{txt(picked.label, config, result)}</strong><span className="rt-pill">{STATE_LABEL[st[picked.id]]}</span>{!picked.agent && txt(picked.sub, config, result) && <span className="mono text-xs">{txt(picked.sub, config, result)}</span>}<span className="basis-full">{picked.role}</span></> : <span>Select any node, or focus it and press Enter, to see its full label, state and role in this scenario.</span>}
      </div>
    </div>
  );
}
