import { useState } from "react";
import { SimulationCaption } from "@/components/simulation-caption";
import { motion, useReducedMotion } from "framer-motion";
import { User, Globe, PhoneCall, Workflow, GitBranch, ListOrdered, Headset, Cpu, Database, Sparkles, CalendarClock, OctagonX, RotateCcw, LifeBuoy, type LucideIcon } from "lucide-react";
import type { CbConfig, CbResult } from "@/lib/callback-engine";
import { SYSTEMS } from "@/lib/callback-engine";
import type { Kind, Scenario } from "@/data/callback-scenarios";

export const KIND: Record<Kind, { Icon: LucideIcon; tab: string; pale: string; tag: string }> = {
  customer: { Icon: User, tab: "#5B6470", pale: "#EEF0F2", tag: "Customer" },
  channel: { Icon: Globe, tab: "#1F73B7", pale: "#E1EEF9", tag: "Channel" },
  connect: { Icon: PhoneCall, tab: "#3B7DD8", pale: "#E3EEFB", tag: "Connect" },
  flow: { Icon: Workflow, tab: "#3B7DD8", pale: "#E3EEFB", tag: "Flow" },
  decision: { Icon: GitBranch, tab: "#2F5FA8", pale: "#E2E9F6", tag: "Decide" },
  queue: { Icon: ListOrdered, tab: "#2A9192", pale: "#DDF0EF", tag: "Queue" },
  agent: { Icon: Headset, tab: "#3E9B57", pale: "#E2F2E6", tag: "Agent" },
  aws: { Icon: Cpu, tab: "#E8862A", pale: "#FCEBD9", tag: "AWS" },
  ext: { Icon: Database, tab: "#8457C9", pale: "#EEE6F8", tag: "External" },
  ai: { Icon: Sparkles, tab: "#7C3AED", pale: "#EFE7FD", tag: "AI" },
  schedule: { Icon: CalendarClock, tab: "#C2410C", pale: "#FBE6D9", tag: "Schedule" },
  retry: { Icon: RotateCcw, tab: "#B4561F", pale: "#F8E4D6", tag: "Retry" },
  fail: { Icon: OctagonX, tab: "#C2412A", pale: "#F8E1DC", tag: "Failure" },
  zendesk: { Icon: LifeBuoy, tab: "#17494D", pale: "#DCEBEA", tag: "Zendesk" },
};

const W = 172, H = 78;
const X = (x: number) => 112 + x * 192, Y = (y: number) => 62 + y * 112;
const titleLines = (label: string) => {
  const words = label.split(/\s+/);
  const lines: string[] = [];
  for (const word of words) {
    if (lines.length && `${lines.at(-1)} ${word}`.length <= 15) lines[lines.length - 1] += ` ${word}`;
    else if (word.length > 15) lines.push(...word.match(/.{1,15}/g)!);
    else lines.push(word);
  }
  return lines;
};
type S = "pending" | "lit" | "current" | "skip" | "bad";
const SL: Record<S, string> = { pending: "Not reached", lit: "Passed", current: "Active step", skip: "Not used in this run", bad: "Failure path" };

function fill(t: string, c: CbConfig) { return t.replace("{system}", SYSTEMS[c.system] ?? "External system").replace("{queue}", c.queue).replace("{mode}", c.mode); }

export function CallbackDiagram({ sc, config, result, idx, running, still }: { sc: Scenario; config: CbConfig; result: CbResult; idx: number; running: boolean; still: boolean }) {
  const reduce = useReducedMotion();
  const [pick, setPick] = useState<string | null>(null);
  const ev = result.events[idx];
  const done = idx >= result.events.length - 1;
  const first = (id: string) => result.events.findIndex((e) => e.node === id);
  const st: Record<string, S> = {};
  for (const n of sc.nodes) {
    const f = first(n.id);
    st[n.id] = ev?.node === n.id ? "current" : f >= 0 && f <= idx ? (n.kind === "fail" ? "bad" : "lit") : done ? "skip" : "pending";
  }
  const pos = Object.fromEntries(sc.nodes.map((n) => [n.id, { x: X(n.x), y: Y(n.y) }]));
  const maxY = Math.max(...sc.nodes.map((n) => n.y));
  const VW = Math.max(1380, X(Math.max(...sc.nodes.map((n) => n.x))) + W / 2 + 26);
  const VH = Y(maxY) + H / 2 + 34;
  const reached = (id: string) => st[id] !== "pending" && st[id] !== "skip";
  const cur = pos[ev?.node ?? sc.nodes[0].id] ?? pos[sc.nodes[0].id];
  const picked = sc.nodes.find((n) => n.id === pick);
  const mid = `cb-${sc.id}`;
  return (
    <div className={`rt-diagram cb-diagram ${running && !still ? "is-running" : ""}`} data-testid="callback-diagram" style={{ ["--cb-accent" as string]: sc.accent }}>
      <div className="rt-dhead">
        <span className="rt-dlive"><i />{ev?.life}</span>
        <span className="rt-dlabel" data-testid="text-diagram-current">{ev?.label}</span>
        {ev?.custom && <span className="cb-custom">Custom pattern</span>}
        <span className="rt-legend" aria-hidden><b className="l-on" />Active path<b className="l-fb" />Retry loop<b className="cb-l-fail" />Failure path</span>
      </div>
      <div className="rt-rails" aria-label="Node categories">{Array.from(new Set(sc.nodes.map((n) => n.kind))).map((k) => <span key={k}><i style={{ background: KIND[k].tab }} />{KIND[k].tag}</span>)}</div>
      <p className="rt-swipe"><i />Swipe sideways inside the diagram to see every node</p>
      <SimulationCaption title={ev?.label ?? "Ready to start"} status={running ? "Playing" : done ? "Completed" : "Ready / paused"} step={`Step ${idx + 1} of ${result.events.length}`}>{ev?.detail}</SimulationCaption>
      <div className="rt-diagram-scroll">
        <svg viewBox={`0 0 ${VW} ${VH}`} role="group" aria-label={`${sc.title} diagram. Current step: ${ev?.label}`}>
          <defs>
            <pattern id={`${mid}-dots`} width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#17494D" opacity=".14" /></pattern>
            {["", "-on", "-retry", "-fail"].map((v) => <marker key={v} id={`${mid}-arrow${v}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9z" fill={v === "-on" ? "#111317" : v === "-retry" ? "#B4561F" : v === "-fail" ? "#C2412A" : "#9AA1AA"} /></marker>)}
          </defs>
          <rect width={VW} height={VH} fill={`url(#${mid}-dots)`} />
          <g aria-hidden>
            {sc.edges.map(([a, b, k]) => {
              const A = pos[a], B = pos[b]; if (!A || !B) return null;
              let d: string;
              if (Math.abs(A.x - B.x) < 40) { const dn = B.y > A.y; d = `M${A.x} ${A.y + (dn ? H / 2 : -H / 2)} L${B.x} ${B.y + (dn ? -H / 2 - 4 : H / 2 + 4)}`; }
              else if (B.x > A.x) { const sx = A.x + W / 2, ex = B.x - W / 2 - 4; d = `M${sx} ${A.y} C${(sx + ex) / 2} ${A.y} ${(sx + ex) / 2} ${B.y} ${ex} ${B.y}`; }
              else { const sx = A.x - W / 2, ex = B.x + W / 2 + 4; d = A.y === B.y ? `M${A.x} ${A.y + H / 2} C${A.x} ${A.y + H / 2 + 46} ${B.x} ${B.y + H / 2 + 46} ${B.x} ${B.y + H / 2 + 4}` : `M${sx} ${A.y} C${(sx + ex) / 2} ${A.y} ${(sx + ex) / 2} ${B.y} ${ex} ${B.y}`; }
              const on = reached(a) && reached(b) && first(b) > first(a) - (k === "retry" ? 999 : 0);
              const cls = `${on ? "is-on" : ""} ${k === "retry" ? "is-fb" : ""} ${k === "fail" ? "cb-fail" : ""} ${k === "opt" ? "cb-opt" : ""}`;
              return (
                <g key={a + b} className={`rt-edge ${cls}`}>
                  <path d={d} markerEnd={`url(#${mid}-arrow${on ? (k === "retry" ? "-retry" : k === "fail" ? "-fail" : "-on") : ""})`} />
                  {on && !reduce && <circle r={4.4} className="rt-dot" style={{ offsetPath: `path('${d}')` }} />}
                </g>
              );
            })}
          </g>
          {sc.nodes.map((n) => {
            const s = st[n.id]; const p = pos[n.id]; const k = KIND[n.kind];
            const label = fill(n.label, config); const sub = fill(n.sub ?? "", config);
            const x0 = p.x - W / 2, y0 = p.y - H / 2;
            return (
              <g key={n.id} className={`rt-node cb-s-${s} ${s === "current" ? "s-current" : s === "lit" ? "s-lit" : s === "bad" ? "s-rejected" : s === "pending" ? "s-pending" : "cb-skip"}`} tabIndex={0} role="button" aria-pressed={pick === n.id}
                aria-label={`${label}. ${sub}. State: ${SL[s]}. ${n.role}`} onClick={() => setPick(n.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setPick(n.id); } }} data-testid={`node-${n.id}`}>
                <title>{`${label}. ${n.role}`}</title>
                {s === "current" && <rect className="rt-halo" x={x0 - 6} y={y0 - 6} width={W + 12} height={H + 12} rx={15} />}
                <rect x={x0} y={y0} width={W} height={H} rx={10} className="rt-node-card" />
                <path d={`M${x0 + 10} ${y0} h16 v${H} h-16 a10 10 0 0 1 -10 -10 v${-(H - 20)} a10 10 0 0 1 10 -10z`} fill={k.tab} className="rt-tab" />
                <text transform={`translate(${x0 + 17} ${y0 + H / 2}) rotate(-90)`} textAnchor="middle" className="rt-tag">{k.tag.length > 8 ? k.tag.slice(0, 8) : k.tag}</text>
                <path d={`M${x0 + 26} ${y0 + 52} H${x0 + W} V${y0 + H - 10} a10 10 0 0 1 -10 10 H${x0 + 26} Z`} fill={k.pale} className="rt-band" />
                <line x1={x0 + 26} x2={x0 + W} y1={y0 + 52} y2={y0 + 52} className="rt-rule" />
                <k.Icon x={x0 + 33} y={y0 + 16} width={20} height={20} strokeWidth={1.7} className="rt-icon" aria-hidden />
                <text x={x0 + 60} y={y0 + (titleLines(label).length > 1 ? 22 : 31)} className="rt-t">
                  {titleLines(label).map((line, i) => <tspan key={i} x={x0 + 60} dy={i ? 15 : 0}>{line}</tspan>)}
                </text>
                {sub && <text x={x0 + 34} y={y0 + 69} className="rt-s" textLength={sub.length > 22 ? W - 42 : undefined} lengthAdjust="spacingAndGlyphs">{sub}</text>}
                <rect x={x0} y={y0} width={W} height={H} rx={10} className="rt-outline" />
                {s === "lit" && <g className="rt-ok"><circle cx={x0 + W - 4} cy={y0 + 4} r={9} /><path d={`M${x0 + W - 8.5} ${y0 + 4} l3 3 l6 -6`} /></g>}
                {s === "bad" && <g className="rt-x"><circle cx={x0 + W - 4} cy={y0 + 4} r={9} /><path d={`M${x0 + W - 8} ${y0} l8 8 m0 -8 l-8 8`} /></g>}
                {s === "current" && ev?.life === "Dialing" && <g className="cb-ring" aria-hidden><circle cx={x0 + W - 4} cy={y0 + 4} r={10} /><circle cx={x0 + W - 4} cy={y0 + 4} r={10} className="cb-ring-2" /></g>}
              </g>
            );
          })}
          <motion.g initial={false} animate={{ x: cur.x, y: cur.y - H / 2 - 12 }} transition={reduce || still ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 18 }} aria-hidden>
            <circle r={13} className="rt-token-ring" /><circle r={6.5} className="rt-token" />
          </motion.g>
        </svg>
      </div>
      <div className="rt-node-detail" aria-live="polite" data-testid="text-node-detail">
        {picked ? <><strong>{fill(picked.label, config)}</strong><span className="rt-pill">{SL[st[picked.id]]}</span><span className="mono text-xs">{KIND[picked.kind].tag}</span><span className="basis-full">{picked.role}</span></> : <span>Select any node, or focus it and press Enter, to see its role in this scenario.</span>}
      </div>
    </div>
  );
}
