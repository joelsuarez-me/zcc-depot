import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { configureSupervisor } from "@/lib/supervisor-engine";
import { capacityModel, reportRows, serviceLevel } from "@/lib/supervisor-metrics";
import { METRIC_NOTES } from "@/data/supervisor-reference";
import { QUEUES, type Contact, type Queue, type SimConfig } from "@/lib/supervisor-types";
import { useSupervisor } from "./supervisor-session";
import { Badge, DASH, Gauge, STATE_COLOR, agentName, clockLabel, pct, secs } from "./shared";

const NODES = [
  { id: "cust", x: 50, label: "Customer" }, { id: "connect", x: 190, label: "Amazon Connect" }, { id: "flow", x: 330, label: "Contact flow / IVR" },
  { id: "queue", x: 470, label: "Queue" }, { id: "agent", x: 610, label: "Agent" }, { id: "done", x: 750, label: "Resolution" },
];
function pos(c: Contact, i: number): { x: number; y: number; tone: string } {
  const y = 70 + (i % 9) * 22;
  switch (c.status) {
    case "Incoming": return { x: 120, y, tone: "#61A9BD" };
    case "IVR": return { x: 330, y, tone: "#61A9BD" };
    case "Waiting": return { x: 470 + ((i % 3) - 1) * 18, y, tone: c.legs.length > 1 ? "#E98E2E" : "#1F74AD" };
    case "Connected": return { x: 610, y, tone: "#203524" };
    case "After Contact Work": return { x: 660, y, tone: "#b7791f" };
    case "Completed": return { x: 750, y, tone: "#44986D" };
    case "Abandoned": return { x: 500, y: 300, tone: "#D8524F" };
    case "Callback": return { x: 560, y: 300, tone: "#9267C6" };
  }
}

export function ContactFlowVisualizer() {
  const { snap, animate } = useSupervisor();
  const [sel, setSel] = useState<string | null>(null);
  const shown = useMemo(() => snap.contacts.filter((c) => !["Completed", "Abandoned", "Callback"].includes(c.status) || snap.clock - (c.disconnect ?? c.completed ?? c.since) < 90).slice(-48), [snap]);
  const active = new Set(shown.map((c) => c.status));
  const lit = (id: string) => ({ cust: active.has("Incoming"), connect: active.has("Incoming"), flow: active.has("IVR"), queue: active.has("Waiting"), agent: active.has("Connected") || active.has("After Contact Work"), done: active.has("Completed") }[id]);
  const c = sel ? snap.contacts.find((x) => x.id === sel) : undefined;
  const counts = ["Incoming", "IVR", "Waiting", "Connected", "After Contact Work", "Completed", "Abandoned", "Callback"].map((s) => [s, snap.contacts.filter((x) => x.status === s).length] as const);
  return (
    <div className="sc-flow" data-testid="panel-contact-flow">
      <div className="sc-flow-legend">{counts.map(([s, n]) => <span key={s}><b className="mono">{n}</b> {s}</span>)}{snap.overflow && <span className="is-ovf">Overflow active: {snap.overflowSource} to {snap.overflowTarget}</span>}</div>
      <div className="sc-flow-svg">
        <svg viewBox="0 0 800 330" role="img" aria-label="Animated contact flow: customer, Amazon Connect, contact flow, queue, agent, resolution">
          {NODES.slice(0, -1).map((n, i) => <path key={n.id} d={`M${n.x + 40} 40 L${NODES[i + 1].x - 40} 40`} className={`sc-path ${animate ? "is-anim" : ""}`} />)}
          <path d="M470 60 C470 260 500 280 500 300" className="sc-path is-exit" /><path d="M470 60 C480 250 560 270 560 300" className="sc-path is-exit" />
          {snap.overflow && <path d="M470 60 C520 110 520 140 470 150" className={`sc-path is-ovf ${animate ? "is-anim" : ""}`} />}
          {NODES.map((n) => <g key={n.id} className={`sc-node ${lit(n.id) ? "is-lit" : ""}`}><rect x={n.x - 52} y={20} width={104} height={40} rx={10} /><text x={n.x} y={45} textAnchor="middle">{n.label}</text></g>)}
          <text x={500} y={322} textAnchor="middle" className="sc-svg-s">Abandon</text><text x={560} y={322} textAnchor="middle" className="sc-svg-s">Callback</text>
          {shown.map((ct, i) => { const p = pos(ct, i); return (
            <motion.circle key={ct.id} r={sel === ct.id ? 8 : 6} fill={p.tone} stroke={sel === ct.id ? "#11110D" : "#FBFBF8"} strokeWidth={2}
              initial={animate ? { cx: 50, cy: p.y, opacity: 0 } : false} animate={{ cx: p.x, cy: p.y, opacity: 1 }} transition={{ duration: animate ? 0.7 : 0 }}
              tabIndex={0} role="button" aria-label={`Contact ${ct.id}, ${ct.status}, ${ct.queue}`} className="sc-dot"
              onClick={() => setSel(ct.id)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSel(ct.id)} data-testid={`dot-contact-${ct.id}`} />
          ); })}
        </svg>
      </div>
      <div className="sc-chiprow" aria-label="Contacts in flow">{shown.slice(-16).map((ct) => <button key={ct.id} type="button" className={`room-pill ${sel === ct.id ? "is-on" : ""}`} onClick={() => setSel(ct.id)} data-testid={`button-contact-${ct.id}`}>{ct.id} · {ct.status}</button>)}</div>
      {c ? (
        <div className="sc-inspect" data-testid="panel-contact-inspector">
          <div className="flex items-start justify-between"><div><span className="eyebrow">Contact inspector</span><h3 className="mono text-lg font-semibold">{c.id}</h3></div><button type="button" className="depot-icon-btn is-light" onClick={() => setSel(null)} aria-label="Close inspector" data-testid="button-close-inspector"><X className="h-4 w-4" /></button></div>
          <dl className="sc-dl">
            <div><dt>Channel</dt><dd>{c.channel}</dd></div><div><dt>Queue</dt><dd>{c.queue}</dd></div><div><dt>Customer intent</dt><dd>{c.intent}</dd></div>
            <div><dt>Queue wait</dt><dd>{secs((c.answer ?? c.legs[c.legs.length - 1]?.exit ?? snap.clock) - (c.legs[0]?.enqueue ?? c.arrived))}</dd></div>
            <div><dt>Assigned agent</dt><dd>{agentName(snap, c.agent)}</dd></div><div><dt>Status</dt><dd>{c.status}</dd></div>
            <div><dt>Routing decision</dt><dd className="text-xs">{c.legs.map((l) => `${l.queue}${l.reason ? ` (${l.reason})` : ""}`).join(" to ") || DASH}</dd></div>
            <div><dt>Ticket</dt><dd>{c.ticket}</dd></div>
          </dl>
          <ol className="sc-log mt-2">{c.timeline.map((t, i) => <li key={i}><span className="mono">{clockLabel(t.at)}</span> {t.text}</li>)}</ol>
        </div>
      ) : <p className="sc-fine">Select any moving contact to inspect its route and timeline. The 10-second entry/IVR period is modeled, not real network latency.</p>}
    </div>
  );
}

type Iv = "15" | "30" | "60" | "today";
export function ServiceLevelExplorer() {
  const { snap, apply } = useSupervisor();
  const [queue, setQueue] = useState<Queue | "">("");
  const [iv, setIv] = useState<Iv>("30");
  const cfg = snap.config;
  const set = (p: Partial<SimConfig>, l: string) => apply((s) => configureSupervisor(s, p), l);
  const from = iv === "today" ? undefined : snap.clock - Number(iv) * 60;
  const rows = useMemo(() => reportRows(snap, { from, to: snap.clock, queue: queue || undefined }), [snap, from, queue]);
  const native = serviceLevel(rows, cfg.slThreshold);
  const answered = serviceLevel(rows, cfg.slThreshold, true);
  const trend = useMemo(() => {
    const start = Math.floor((from ?? (snap.frames[0]?.at ?? 0)) / 60) * 60, out: { at: number; v: number | null }[] = [];
    for (let k = start; k <= snap.clock; k += 60) out.push({ at: k, v: serviceLevel(rows.filter((r) => r.disconnect >= k && r.disconnect < k + 60), cfg.slThreshold).percentage });
    return out;
  }, [rows, from, snap.clock, snap.frames, cfg.slThreshold]);
  const dots = rows.slice(-120);
  const preset = [15, 20, 25, 30, 45, 60, 90, 120, 180, 240, 300, 600].includes(cfg.slThreshold);
  return (
    <div className="sc-sl" data-testid="panel-sl-explorer">
      <div className="sc-sl-ctl">
        <Slider label="Service-level threshold" unit="s" min={5} max={120} step={5} value={cfg.slThreshold} onCommit={(v) => set({ slThreshold: v }, `SL threshold ${v}s`)} id="sl-threshold" />
        <Slider label="Target service level" unit="%" min={50} max={99} step={1} value={cfg.slTarget} onCommit={(v) => set({ slTarget: v }, `SL target ${v}%`)} id="sl-target" />
        <Slider label="Contact volume" unit="/min" min={1} max={30} step={0.5} value={cfg.arrivalRate} onCommit={(v) => set({ arrivalRate: v }, `Arrival rate ${v}/min`)} id="sl-volume" />
        <Slider label="Agent capacity" unit=" agents" min={6} max={60} step={1} value={cfg.agents} onCommit={(v) => set({ agents: v }, `Staffed agents ${v}`)} id="sl-agents" />
        <label className="sc-field"><span>Queue</span><select value={queue} onChange={(e) => setQueue(e.target.value as Queue | "")} data-testid="select-sl-queue"><option value="">All queues</option>{QUEUES.map((q) => <option key={q}>{q}</option>)}</select></label>
        <label className="sc-field"><span>Reporting interval</span><select value={iv} onChange={(e) => setIv(e.target.value as Iv)} data-testid="select-sl-interval"><option value="15">Last 15 min</option><option value="30">Last 30 min</option><option value="60">Last hour</option><option value="today">Today</option></select></label>
      </div>
      <div className="sc-sl-main">
        <div className="sc-formula" data-testid="panel-sl-formula">
          <Gauge value={native.percentage} target={cfg.slTarget} label={`Native Service level ${cfg.slThreshold}`} size={150} testId="gauge-sl-native" />
          <div>
            <p className="mono text-sm">Service level {cfg.slThreshold} = removed from queue within {cfg.slThreshold}s / contacts queued</p>
            <p className="mono text-2xl font-semibold" data-testid="text-sl-calc">{native.numerator} / {native.denominator} = {pct(native.percentage)}</p>
            <p className="text-sm">Target: {cfg.slTarget}% of eligible contacts within {cfg.slThreshold} seconds · <b className={native.percentage == null ? "" : native.percentage >= cfg.slTarget ? "sc-good" : "sc-bad"} data-testid="text-sl-attainment">{native.percentage == null ? "No closed records in interval" : native.percentage >= cfg.slTarget ? "Target met" : `${(cfg.slTarget - native.percentage).toFixed(1)} pts below target`}</b></p>
            <p className="mt-2 text-sm"><Badge kind="custom" /> Answered within {cfg.slThreshold}s / all queued legs: <b className="mono" data-testid="text-sl-answered">{answered.numerator} / {answered.denominator} = {pct(answered.percentage)}</b></p>
          </div>
        </div>
        <div className="sc-dots" role="img" aria-label={`${native.numerator} within threshold, ${native.denominator - native.numerator} beyond`} data-testid="chart-sl-dots">
          {dots.map((r) => { const ok = r.wait <= cfg.slThreshold && r.reason !== "Overflow"; return <i key={r.id} className={`${ok ? "is-ok" : "is-over"} ${r.reason !== "Answered" ? "is-alt" : ""}`} title={`${r.contactId} ${r.queue}: ${r.reason} after ${r.wait}s`} />; })}
          {dots.length === 0 && <span className="text-sm opacity-70">No closed queue legs in this interval yet.</span>}
        </div>
        <div className="sc-legend"><span><i className="sc-sw is-ok" />Within threshold</span><span><i className="sc-sw is-over" />Beyond threshold</span><span><i className="sc-sw is-alt" />Abandoned / callback (counts in native if within X) or overflow (never in numerator)</span></div>
        <p className="sc-fine mt-0" data-testid="text-sl-sampling">Showing the most recent {dots.length} of {rows.length} closed legs; the formula above uses all {rows.length}.</p>
        <p className="sc-fine mt-0" data-testid="text-sl-duration">{preset ? `${cfg.slThreshold}s matches a preset Service level duration in native reports.` : `${cfg.slThreshold}s is a non-preset duration: native reports need a custom service-level duration for it. The formula is unchanged.`}</p>
        <div className="sc-box mt-3"><span className="eyebrow">Historical trend · native SL at {cfg.slThreshold}s per minute · {queue || "all queues"} · selected interval</span>
          <svg viewBox="0 0 400 90" className="w-full" role="img" aria-label="Service level trend" data-testid="chart-sl-trend">
            <line x1="0" x2="400" y1={90 - cfg.slTarget * 0.85} y2={90 - cfg.slTarget * 0.85} stroke="#b5412b" strokeDasharray="4 4" />
            {trend.map((p, i) => p.v == null ? null : <circle key={p.at} cx={(i / Math.max(1, trend.length - 1)) * 400} cy={90 - p.v * 0.85} r={2.5} fill="#1F4E79"><title>{`${clockLabel(p.at)}: ${pct(p.v)}`}</title></circle>)}
            <polyline fill="none" stroke="#1F4E79" strokeWidth="1.5" points={trend.map((p, i) => p.v == null ? null : `${(i / Math.max(1, trend.length - 1)) * 400},${90 - p.v * 0.85}`).filter(Boolean).join(" ")} />
          </svg>
          <p className="text-xs opacity-75">Minutes with no closed legs are gaps, not 0% or 100%. Queue delays push contacts past the threshold; longer waits also raise abandonment, which native Service level X still counts in its numerator if it happens within X.</p>
        </div>
        <p className="sc-fine">{METRIC_NOTES.service} {METRIC_NOTES.cohort} A service-level target is an internal operating goal; a contractual SLA is a separate commercial commitment with its own measurement rules.</p>
      </div>
    </div>
  );
}

function Slider({ label, unit, min, max, step, value, onCommit, id }: { label: string; unit: string; min: number; max: number; step: number; value: number; onCommit: (v: number) => void; id: string }) {
  const [v, setV] = useState<number | null>(null);
  const shown = v ?? value;
  const commit = () => { if (v != null && v !== value) onCommit(v); setV(null); };
  return (
    <label className="sc-slider"><span>{label} <b className="mono">{shown}{unit}</b></span>
      <input type="range" min={min} max={max} step={step} value={shown} onChange={(e) => setV(Number(e.target.value))} onPointerUp={commit} onKeyUp={commit} onBlur={commit} data-testid={`slider-${id}`} />
    </label>
  );
}

export function AgentOccupancyLab() {
  const { snap, apply } = useSupervisor();
  const cfg = snap.config;
  const set = (p: Partial<SimConfig>, l: string) => apply((s) => configureSupervisor(s, p), l);
  const cap = capacityModel(cfg, snap.agents);
  const fr = snap.frames.slice(-30);
  const ids = snap.agents.map((a) => a.id);
  return (
    <div className="sc-occ" data-testid="panel-occupancy-lab">
      <div className="sc-sl-ctl">
        <Slider label="Number of agents" unit="" min={6} max={60} step={1} value={cfg.agents} onCommit={(v) => set({ agents: v }, `Agents ${v}`)} id="occ-agents" />
        <Slider label="Average handle (talk) time" unit="s" min={60} max={900} step={15} value={cfg.talk} onCommit={(v) => set({ talk: v }, `Talk ${v}s`)} id="occ-talk" />
        <Slider label="After contact work" unit="s" min={0} max={600} step={15} value={cfg.acw} onCommit={(v) => set({ acw: v }, `ACW ${v}s`)} id="occ-acw" />
        <Slider label="Break duration" unit="s" min={0} max={1800} step={60} value={cfg.breakSeconds} onCommit={(v) => set({ breakSeconds: v }, `Break ${v}s`)} id="occ-break" />
        <Slider label="Contact arrival rate" unit="/min" min={1} max={30} step={0.5} value={cfg.arrivalRate} onCommit={(v) => set({ arrivalRate: v }, `Arrivals ${v}/min`)} id="occ-arrival" />
        <Slider label="Chat/task concurrency" unit="x" min={1} max={4} step={1} value={cfg.concurrency} onCommit={(v) => set({ concurrency: v }, `Concurrency ${v}`)} id="occ-concurrency" />
      </div>
      <div className="sc-occ-main">
        <div className="sc-occ-top">
          <Gauge value={cap.occupancy} label="Modeled occupancy" size={170} testId="gauge-occupancy" />
          <dl className="sc-dl">
            <div><dt>Capacity / min</dt><dd>{cap.capacityPerMinute.toFixed(2)}</dd></div>
            <div><dt>Demand / capacity ratio</dt><dd>{cap.load.toFixed(2)}</dd></div>
            <div><dt>Required agents</dt><dd data-testid="text-required-agents">{cap.requiredAgents}</dd></div>
            <div><dt>Throughput / min</dt><dd>{cap.throughput.toFixed(2)}</dd></div>
            <div><dt>Estimated wait</dt><dd>{cap.waitSeconds == null ? "Unbounded (load exceeds capacity)" : secs(cap.waitSeconds)}</dd></div>
            <div><dt>Available now (live)</dt><dd>{snap.agents.filter((a) => a.state === "Available").length}</dd></div>
          </dl>
        </div>
        <div className="sc-box" data-testid="chart-capacity-heatmap">
          <span className="eyebrow">Capacity heatmap · each agent across the last {fr.length} steps</span>
          <div className="sc-cap" style={{ gridTemplateColumns: `7rem repeat(${Math.max(1, fr.length)}, 1fr)` }}>
            {ids.map((id) => [<span key={id} className="sc-cap-n">{agentName(snap, id)}</span>, ...fr.map((f) => { const a = f.agents[id]; return <i key={id + f.at} style={{ background: a ? STATE_COLOR[a.state] : "transparent" }} title={a ? `${agentName(snap, id)} ${a.state} at ${clockLabel(f.at)}` : "Not staffed"} />; })])}
          </div>
        </div>
        <p className="sc-fine">{METRIC_NOTES.occupancy} This steady-state planning estimate uses the staffed channel mix; only chat gains parallel slots, never voice. Skills, queue imbalance and the crisis multiplier can create backlog even when aggregate demand is below capacity. It is not Erlang C, a live occupancy reading or Amazon Connect's internal routing algorithm. <Badge kind="simulated" /></p>
      </div>
    </div>
  );
}

