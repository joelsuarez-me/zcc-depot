import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
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

const W = 150, H = 54;
/** Never clips: long strings are compressed to fit the node width. */
function Fit({ x, y, cls, t, max }: { x: number; y: number; cls: string; t: string; max: number }) {
  return t.length > max ? <text x={x} y={y} className={cls} textLength={W - 22} lengthAdjust="spacingAndGlyphs">{t}</text> : <text x={x} y={y} className={cls}>{t}</text>;
}
export function RoutingDiagram({ method, config, result, idx, running, still }: { method: Method; config: RoutingConfig; result: RoutingResult; idx: number; running: boolean; still: boolean }) {
  const reduce = useReducedMotion();
  const [pick, setPick] = useState<string | null>(null);
  const nodes = method.diagram.nodes;
  const st = Object.fromEntries(nodes.map((n) => [n.id, nodeState(n, config, result, idx)]));
  const pos = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const live = (s: NState) => s !== "pending" && s !== "rejected" && s !== "ineligible";
  const curNode = nodes.find((n) => st[n.id] === "current" || st[n.id] === "selected" || st[n.id] === "waiting") ?? nodes.find((n) => n.id === "customer") ?? nodes[0];
  const picked = nodes.find((n) => n.id === pick);
  const ev = result.events[idx];
  const agentIds = nodes.filter((n) => n.agent).map((n) => n.id);
  const srcs = Array.from(new Set(method.diagram.edges.filter(([, b]) => agentIds.includes(b)).map(([a]) => a)));
  const fbSrc = new Set(method.diagram.edges.filter(([, b, f]) => f && agentIds.includes(b)).map(([a]) => a));
  const edges: [string, string, ("fb")?][] = [...method.diagram.edges.filter(([, b]) => !agentIds.includes(b)), ...srcs.flatMap((a) => agentIds.map((b) => (fbSrc.has(a) ? [a, b, "fb"] : [a, b]) as [string, string, ("fb")?]))];
  return (
    <div className={`rt-diagram ${running && !still ? "is-running" : ""}`} data-testid="routing-diagram">
      <p className="rt-swipe md:hidden" data-testid="text-diagram-swipe-hint">Swipe sideways inside the diagram to see every node</p>
      <div className="rt-diagram-scroll">
        <svg viewBox="-20 -10 1040 470" role="img" aria-label={`${method.title} routing diagram. Current step: ${ev?.label}`}>
          <defs><pattern id="rtgrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="rgba(209,244,112,.07)" /></pattern></defs>
          <rect width="1000" height="440" fill="url(#rtgrid)" />
          {edges.map(([a, b, fb]) => {
            const A = pos[a], B = pos[b]; if (!A || !B) return null;
            const on = live(st[a]) && live(st[b]);
            const rej = st[a] === "rejected" || st[b] === "rejected" || st[b] === "ineligible";
            const mx = (A.x + B.x) / 2;
            return <path key={a + b} d={`M${A.x + W / 2} ${A.y} C${mx + 40} ${A.y} ${mx - 40} ${B.y} ${B.x - W / 2} ${B.y}`} className={`rt-edge ${on ? "is-on" : ""} ${rej ? "is-rej" : ""} ${fb ? "is-fb" : ""}`} />;
          })}
          {nodes.map((n) => {
            const s = st[n.id];
            return (
              <g key={n.id} transform={`translate(${n.x - W / 2} ${n.y - H / 2})`} className={`rt-node s-${s} ${n.tone ? "t-" + n.tone : ""} ${n.agent ? "is-agent" : ""}`} tabIndex={0} role="button" aria-label={`${txt(n.label, config, result)}: ${s}`} onClick={() => setPick(n.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setPick(n.id); } }} data-testid={`node-${n.id}`}>
                {(s === "current" || s === "selected" || s === "waiting") && <rect className="rt-halo" x={-6} y={-6} width={W + 12} height={H + 12} rx={16} />}
                <title>{`${txt(n.label, config, result)}. ${n.agent ? s : txt(n.sub, config, result)}. ${n.role}`}</title>
                <rect width={W} height={H} rx={12} className="rt-box" />
                <Fit x={12} y={22} cls="rt-t" max={21} t={txt(n.label, config, result)} />
                <Fit x={12} y={40} cls="rt-s" max={26} t={n.agent ? (s === "pending" ? "awaiting evaluation" : s) : txt(n.sub, config, result)} />
                {s === "rejected" && <path d={`M${W - 22} 10l10 10m0-10l-10 10`} className="rt-x" />}
                {s === "waiting" && <text x={W - 14} y={22} textAnchor="end" className="rt-timer">{config.timeout}s</text>}
              </g>
            );
          })}
          <motion.g initial={false} animate={{ x: curNode.x, y: curNode.y - H / 2 - 10 }} transition={reduce || still ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 18 }}>
            <circle r={7} className="rt-token" /><circle r={13} className="rt-token-ring" />
          </motion.g>
        </svg>
      </div>
      <div className="rt-node-detail" aria-live="polite" data-testid="text-node-detail">
        {picked ? <><strong>{txt(picked.label, config, result)}</strong>{!picked.agent && txt(picked.sub, config, result) && <span className="mono text-xs">{txt(picked.sub, config, result)}</span>} <span className="rt-pill">{st[picked.id]}</span> <span>{picked.role}</span></> : <span>Select any node to see its full label and role in this scenario.</span>}
      </div>
    </div>
  );
}
