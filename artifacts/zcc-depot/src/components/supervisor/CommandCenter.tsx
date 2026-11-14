import { useMemo, useState } from "react";
import { intervene } from "@/lib/supervisor-engine";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Minus, Search, X } from "lucide-react";
import { metrics, queueMetrics, reportRows } from "@/lib/supervisor-metrics";
import { METRIC_NOTES } from "@/data/supervisor-reference";
import { QUEUES, STATES, type Agent, type AgentState, type Channel, type Metrics, type Queue, type Filter } from "@/lib/supervisor-types";
import { useSupervisor } from "./supervisor-session";
import { Badge, Counter, DASH, Gauge, STATE_CLASS, STATE_COLOR, clockLabel, pct, secs, slug } from "./shared";

export type Range = "15" | "30" | "60" | "today" | "custom";
export function rangeFilter(range: Range, clock: number, custom: { from: number; to: number }): Filter {
  if (range === "today") return {};
  if (range === "custom") return { from: custom.from * 60, to: custom.to * 60 };
  return { from: clock - Number(range) * 60, to: clock };
}

type K = { key: string; label: string; get: (m: Metrics) => number | null; fmt: (n: number | null) => string; good: "up" | "down" | "none"; live: boolean };
const n0 = (n: number | null) => (n == null ? DASH : Math.round(n).toLocaleString());
const KPIS: K[] = [
  { key: "offered", label: "Contacts offered", get: (m) => m.offered, fmt: n0, good: "none", live: false },
  { key: "handled", label: "Contacts handled", get: (m) => m.handled, fmt: n0, good: "up", live: false },
  { key: "abandoned", label: "Contacts abandoned", get: (m) => m.abandoned, fmt: n0, good: "down", live: false },
  { key: "waiting", label: "Contacts waiting", get: (m) => m.waiting, fmt: n0, good: "down", live: true },
  { key: "sl", label: "Service level (native X)", get: (m) => m.serviceLevel, fmt: (n) => pct(n), good: "up", live: false },
  { key: "asa", label: "Avg speed of answer", get: (m) => m.asa, fmt: secs, good: "down", live: false },
  { key: "aht", label: "Avg handle time", get: (m) => m.aht, fmt: secs, good: "down", live: false },
  { key: "oldest", label: "Longest wait", get: (m) => m.oldest, fmt: secs, good: "down", live: true },
  { key: "available", label: "Available agents", get: (m) => m.available, fmt: n0, good: "up", live: true },
  { key: "busy", label: "Busy agents", get: (m) => m.busy, fmt: n0, good: "none", live: true },
  { key: "acw", label: "In after contact work", get: (m) => m.acw, fmt: n0, good: "down", live: true },
  { key: "occ", label: "Occupancy", get: (m) => m.occupancy, fmt: (n) => pct(n), good: "none", live: false },
  { key: "abn", label: "Queue abandonment rate", get: (m) => m.abandonment, fmt: (n) => pct(n), good: "down", live: false },
];

export function ExecutiveKPIBar({ range, setRange, custom, setCustom }: { range: Range; setRange: (r: Range) => void; custom: { from: number; to: number }; setCustom: (c: { from: number; to: number }) => void }) {
  const { snap } = useSupervisor();
  const filter = rangeFilter(range, snap.clock, custom);
  const live = useMemo(() => metrics(snap), [snap]);
  const hist = useMemo(() => metrics(snap, filter), [snap, filter.from, filter.to]); // eslint-disable-line react-hooks/exhaustive-deps
  const prevFrame = snap.frames[Math.max(0, snap.frames.length - 7)];
  const prevLive: Partial<Record<string, number>> = prevFrame ? { waiting: prevFrame.waiting, available: Object.values(prevFrame.agents).filter((a) => a.available).length, busy: Object.values(prevFrame.agents).filter((a) => a.contact).length, acw: Object.values(prevFrame.agents).filter((a) => a.state === "After Contact Work").length } : {};
  /** Interval tiles: compare the same-length previous cohort. Live tiles: compare the frame one simulated minute ago. */
  const span = filter.from != null ? (filter.to ?? snap.clock) - filter.from : null;
  const prior = useMemo(() => (span != null && range !== "custom" ? metrics(snap, { from: filter.from! - span, to: filter.from }) : null), [snap, span, range, filter.from]); // eslint-disable-line react-hooks/exhaustive-deps
  const trend = (k: K, v: number | null) => {
    const pv = k.live ? prevLive[k.key] ?? null : prior ? k.get(prior) : null;
    if (pv == null || v == null) return null;
    const d = v - pv; if (Math.abs(d) < 0.05) return { dir: 0, tone: "flat" };
    const better = k.good === "none" ? null : (k.good === "up") === d > 0;
    return { dir: d > 0 ? 1 : -1, tone: better == null ? "flat" : better ? "good" : "bad" };
  };
  return (
    <div className="sc-kpis" data-testid="panel-kpi-bar">
      <div className="sc-kpis-head">
        <div className="flex flex-wrap items-center gap-2"><span className="eyebrow">Executive KPI bar</span><span className="sc-clock mono" data-testid="text-sim-clock">Sim clock {clockLabel(snap.clock)}</span></div>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Historical interval">
          {([["15", "Last 15 min"], ["30", "Last 30 min"], ["60", "Last hour"], ["today", "Today"], ["custom", "Custom range"]] as [Range, string][]).map(([r, l]) => (
            <button key={r} type="button" className={`room-pill ${range === r ? "is-on" : ""}`} aria-pressed={range === r} onClick={() => setRange(r)} data-testid={`button-range-${r}`}>{l}</button>
          ))}
          {range === "custom" && <span className="sc-custom">
            <label>From min <input type="number" value={custom.from} onChange={(e) => setCustom({ ...custom, from: Number(e.target.value) })} data-testid="input-range-from" /></label>
            <label>to min <input type="number" value={custom.to} onChange={(e) => setCustom({ ...custom, to: Number(e.target.value) })} data-testid="input-range-to" /></label>
            <small>simulated minutes from 14:00 UTC</small>
          </span>}
        </div>
      </div>
      <div className="sc-kpi-grid">
        {KPIS.map((k) => {
          const v = k.get(k.live ? live : hist); const t = trend(k, v);
          return (
            <div key={k.key} className={`sc-kpi ${t ? `is-${t.tone}` : ""}`} data-testid={`kpi-${k.key}`}>
              <span className="sc-kpi-tag">{k.live ? "Real-time" : "Interval"}</span>
              <b className="mono" data-testid={`text-kpi-${k.key}`}><Counter value={v} format={k.fmt} /></b>
              <span className="sc-kpi-l">{k.label}</span>
              {t && <span className="sc-kpi-t" aria-label={t.tone === "good" ? "improving" : t.tone === "bad" ? "worsening" : "steady"}>{t.dir > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : t.dir < 0 ? <ArrowDownRight className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}</span>}
            </div>
          );
        })}
      </div>
      <p className="sc-fine">Arrows: real-time tiles compare with one simulated minute earlier; interval tiles compare with the previous equal-length cohort (hidden for Today and Custom). Real-time tiles show the current state of the shared simulation. Interval tiles use completed-record disconnect cohorts in the selected range; an empty cohort shows a dash rather than a fabricated value. Not every metric appears on every native Amazon Connect report surface. <Badge kind="simulated" /></p>
    </div>
  );
}

/** Live backlog and historical SL cohort are evaluated independently; either can raise risk. */
export function queueStatus(m: Metrics, target: number) {
  const slCrit = m.serviceLevel != null && m.serviceLevel < target - 15, slWarn = m.serviceLevel != null && m.serviceLevel < target;
  const why = [m.waiting >= 5 ? "live backlog" : "", slWarn ? "interval SL below target" : ""].filter(Boolean).join(" + ");
  if (slCrit || m.waiting >= 10) return { t: "Critical", c: "is-crit", why };
  if (slWarn || m.waiting >= 5) return { t: "At risk", c: "is-warn", why };
  return { t: "Healthy", c: "is-ok", why: "" };
}

export function RealTimeQueueDashboard({ selected, onSelect, filter, rangeLabel }: { selected: Queue | null; onSelect: (q: Queue | null) => void; filter: Filter; rangeLabel: string }) {
  const { snap, animate } = useSupervisor();
  const rows = useMemo(() => QUEUES.map((q) => {
    const m = queueMetrics(snap, q, filter);
    const ag = snap.agents.filter((a) => a.queues.includes(q));
    const waiting = snap.contacts.filter((c) => c.queue === q && c.status === "Waiting");
    return { q, m, avail: ag.filter((a) => a.state === "Available").length, handling: ag.filter((a) => a.state === "On Contact").length, waitingIds: waiting.map((c) => c.id) };
  }), [snap, filter.from, filter.to]); // eslint-disable-line react-hooks/exhaustive-deps
  const maxW = Math.max(1, ...rows.map((r) => r.m.waiting));
  const detail = selected ? rows.find((r) => r.q === selected) : null;
  const recent = snap.frames.slice(-24);
  return (
    <div className="sc-queues" data-testid="panel-queues">
      <div className="sc-qgrid">
        {rows.map((r) => { const st = queueStatus(r.m, snap.config.slTarget); return (
          <button key={r.q} type="button" className={`sc-q ${st.c} ${selected === r.q ? "is-sel" : ""}`} onClick={() => onSelect(selected === r.q ? null : r.q)} aria-pressed={selected === r.q} data-testid={`button-queue-${slug(r.q)}`}>
            <span className="sc-q-head"><b>{r.q}</b><span className={`sc-pill ${st.c}`} title={st.why} data-testid={`status-queue-${slug(r.q)}`}>{st.t}</span></span>
            {st.why && <small className="sc-why" data-testid={`text-queue-risk-${slug(r.q)}`}>{st.why}</small>}
            <span className="sc-q-depth" aria-label={`${r.m.waiting} contacts waiting`}>
              {r.waitingIds.slice(0, 24).map((id) => <motion.i key={id} layout={animate} initial={animate ? { scale: 0 } : false} animate={{ scale: 1 }} />)}
              {r.waitingIds.length > 24 && <em>+{r.waitingIds.length - 24}</em>}
            </span>
            <dl>
              <div className="sc-q-live"><dt>Live waiting</dt><dd className="mono">{r.m.waiting}</dd></div>
              <div className="sc-q-live"><dt>Live oldest</dt><dd className="mono">{secs(r.m.oldest)}</dd></div>
              <div className="sc-q-live"><dt>Live avail.</dt><dd className="mono">{r.avail}</dd></div>
              <div className="sc-q-live"><dt>Live handling</dt><dd className="mono">{r.handling}</dd></div>
              <div><dt>SL · {rangeLabel}</dt><dd className="mono">{pct(r.m.serviceLevel, 0)}</dd></div>
              <div><dt>ASA · {rangeLabel}</dt><dd className="mono">{secs(r.m.asa)}</dd></div>
              <div><dt>Aband. · {rangeLabel}</dt><dd className="mono">{pct(r.m.abandonment, 0)}</dd></div>
            </dl>
          </button>
        ); })}
      </div>
      <div className="sc-heat" data-testid="chart-queue-heatmap">
        <p className="sc-fine mt-0 mb-2" data-testid="text-queue-coverage-note">Agent counts per queue are qualified memberships. One agent can serve several queues under priority dispatch, so coverage is not additive across cards; the KPI bar counts each agent once.</p>
        <div className="flex items-baseline justify-between"><span className="eyebrow">Demand heatmap · waiting per queue, last 4 simulated minutes</span><span className="text-xs opacity-70">Darker = more waiting. Peak {maxW}</span></div>
        <table className="sc-heat-t"><tbody>
          {rows.map((r) => (
            <tr key={r.q}><th scope="row">{r.q}</th>
              {recent.map((f) => { const n = Object.values(f.agents).length ? snap.contacts.filter((c) => c.queue === r.q && c.legs.some((l) => l.queue === r.q && l.enqueue <= f.at && (l.exit == null || l.exit > f.at))).length : 0; return <td key={f.at} title={`${r.q} ${clockLabel(f.at)}: ${n} waiting`} style={{ background: `rgba(31,78,121,${Math.min(1, n / Math.max(4, maxW))})` }} />; })}
              <td className="mono sc-heat-n">{r.m.waiting}</td>
            </tr>
          ))}
        </tbody></table>
      </div>
      {detail && (
        <div className="sc-qdetail" data-testid="panel-queue-detail">
          <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">{detail.q} analytics</h3><button type="button" className="depot-icon-btn is-light" onClick={() => onSelect(null)} aria-label="Close queue analytics" data-testid="button-close-queue-detail"><X className="h-4 w-4" /></button></div>
          <div className="mt-3 grid gap-4 md:grid-cols-[auto_1fr]">
            <Gauge value={detail.m.serviceLevel} target={snap.config.slTarget} label={`Historical SL ${snap.config.slThreshold}s · ${rangeLabel} cohort`} testId="gauge-queue-sl" />
            <dl className="sc-dl">
              <div><dt>Live waiting</dt><dd>{detail.m.waiting}</dd></div><div><dt>Live oldest</dt><dd>{secs(detail.m.oldest)}</dd></div>
              <div><dt>Offered ({rangeLabel})</dt><dd>{detail.m.offered}</dd></div><div><dt>Handled</dt><dd>{detail.m.handled}</dd></div>
              <div><dt>Abandoned</dt><dd>{detail.m.abandoned}</dd></div><div><dt>Callbacks</dt><dd>{detail.m.callbacks}</dd></div>
              <div><dt>Within threshold</dt><dd>{detail.m.within}</dd></div><div><dt>Over threshold</dt><dd>{detail.m.over}</dd></div>
              <div><dt>Answered-only SL (custom)</dt><dd>{pct(detail.m.answeredServiceLevel)}</dd></div><div><dt>AHT</dt><dd>{secs(detail.m.aht)}</dd></div>
              <div><dt>Staffed members</dt><dd>{snap.agents.filter((a) => a.queues.includes(detail.q) && a.state !== "Offline").length}</dd></div>
              <div><dt>Waiting contacts</dt><dd className="text-xs">{detail.waitingIds.join(", ") || "None"}</dd></div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}

const DUR = [["any", "Any duration"], ["lt2", "Under 2 min"], ["2to10", "2 to 10 min"], ["gt10", "Over 10 min"]] as const;
export function AgentMonitoringPanel({ queueFilter }: { queueFilter: Queue | null }) {
  const { snap } = useSupervisor();
  const [f, setF] = useState({ q: "", team: "", profile: "", state: "", channel: "", dur: "any", text: "" });
  const [open, setOpen] = useState<string | null>(null);
  const q = f.q || queueFilter || "";
  const teams = [...new Set(snap.agents.map((a) => a.team))];
  const profiles = [...new Set(snap.agents.map((a) => a.profile))];
  const list = snap.agents.filter((a) => {
    const d = snap.clock - a.since;
    return (!q || a.queues.includes(q as Queue)) && (!f.team || a.team === f.team) && (!f.profile || a.profile === f.profile) && (!f.state || a.state === f.state) && (!f.channel || a.channel === f.channel)
      && (f.dur === "any" || (f.dur === "lt2" ? d < 120 : f.dur === "2to10" ? d >= 120 && d <= 600 : d > 600)) && (!f.text || a.name.toLowerCase().includes(f.text.toLowerCase()));
  });
  const dist = STATES.map((s) => ({ s, n: snap.agents.filter((a) => a.state === s).length }));
  const sel = open ? snap.agents.find((a) => a.id === open) ?? null : null;
  const S = (k: keyof typeof f, label: string, opts: string[]) => (
    <label className="sc-field"><span>{label}</span><select value={k === "q" ? q : f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} data-testid={`select-agent-${k}`}><option value="">All</option>{opts.map((o) => <option key={o}>{o}</option>)}</select></label>
  );
  return (
    <div data-testid="panel-agents">
      <div className="sc-statebar" role="img" aria-label={dist.map((d) => `${d.s} ${d.n}`).join(", ")}>
        {dist.filter((d) => d.n).map((d) => <span key={d.s} style={{ flexGrow: d.n, background: STATE_COLOR[d.s] }} title={`${d.s}: ${d.n}`} />)}
      </div>
      <div className="sc-legend">{dist.map((d) => <span key={d.s}><i style={{ background: STATE_COLOR[d.s] }} />{d.s} <b className="mono">{d.n}</b></span>)}</div>
      <div className="sc-filters">
        <label className="sc-field sc-search"><span>Search directory</span><span className="relative"><Search className="pointer-events-none absolute left-2 top-2 h-4 w-4 opacity-50" aria-hidden /><input value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} placeholder="Agent name" data-testid="input-agent-search" /></span></label>
        {S("q", "Queue", [...QUEUES])}{S("team", "Team", teams)}{S("profile", "Routing profile", profiles)}{S("state", "Status", [...STATES])}{S("channel", "Channel", ["Voice", "Chat", "Task"])}
        <label className="sc-field"><span>Duration</span><select value={f.dur} onChange={(e) => setF({ ...f, dur: e.target.value })} data-testid="select-agent-dur">{DUR.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
      </div>
      <p className="mb-2 text-xs opacity-70" data-testid="text-agent-count">{list.length} of {snap.agents.length} agents shown</p>
      {list.length === 0 ? <div className="sc-empty" data-testid="empty-agents">No agents match these filters. <button type="button" className="underline" onClick={() => setF({ q: "", team: "", profile: "", state: "", channel: "", dur: "any", text: "" })} data-testid="button-clear-agent-filters">Clear filters</button></div> : (
        <div className="sc-agents">
          {list.map((a) => <AgentTile key={a.id} a={a} clock={snap.clock} onOpen={() => setOpen(a.id)} />)}
        </div>
      )}
      {sel && <AgentDetailDrawer agent={sel} onClose={() => setOpen(null)} />}
    </div>
  );
}

/** Activity occupancy: (contact + ACW) / (contact + ACW + idle). Concurrency never multiplies time. */
function perf(a: Agent) {
  const busy = a.contactSeconds + a.acwSeconds, tot = busy + a.availableSeconds;
  return tot > 0 ? (busy / tot) * 100 : null;
}
function eligibleNow(a: Agent, concurrency: number) {
  if (!a.enabled || a.retiring) return { ok: false, why: "Not in staffed routing capacity" };
  if (a.state === "Available") return { ok: true, why: `Idle, ${a.channel}` };
  if (a.state === "On Contact" && a.channel === "Chat" && a.contacts.length < concurrency) return { ok: true, why: `Chat slot ${a.contacts.length + 1} of ${concurrency}` };
  return { ok: false, why: a.state === "On Contact" ? "All channel slots in use" : `${a.state}: not routable` };
}

function AgentTile({ a, clock, onOpen }: { a: Agent; clock: number; onOpen: () => void }) {
  const { snap } = useSupervisor();
  const c = a.contacts.length ? snap.contacts.find((x) => x.id === a.contacts[a.contacts.length - 1]) : undefined;
  const active = c && (c.status === "Connected" || c.status === "After Contact Work") ? c : undefined;
  return (
    <button type="button" className={`sc-agent ${STATE_CLASS[a.state]}`} onClick={onOpen} data-testid={`button-agent-${a.id}`}>
      <span className="sc-agent-top"><span className="sc-av" aria-hidden>{a.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}</span><span className="min-w-0 text-left"><b className="block truncate">{a.name}</b><small className="block truncate">{a.profile}</small></span></span>
      <span className="sc-state" data-testid={`status-agent-${a.id}`}><i />{a.state}<span className="mono ml-auto">{secs(clock - a.since)}</span></span>
      <span className="sc-agent-meta"><span>{active ? `${active.id} · ${active.channel}` : "No active contact"}</span><span>{active ? active.queue : a.queues[0]}</span></span>
      <span className="sc-agent-meta"><span>Handle {active ? secs(clock - (active.answer ?? clock)) : DASH}</span><span>Occ {pct(perf(a), 0)}</span></span>
    </button>
  );
}

export function AgentDetailDrawer({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const { snap } = useSupervisor();
  const legs = reportRows(snap, { agent: agent.id }).filter((r) => r.reason === "Answered");
  const ids = [...new Set([...legs.map((r) => r.contactId), ...snap.contacts.filter((c) => c.agent === agent.id).map((c) => c.id)])];
  const history = ids.map((id) => snap.contacts.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => !!c).slice(-8).reverse();
  const cur = snap.contacts.find((c) => c.agent === agent.id && (c.status === "Connected" || c.status === "After Contact Work"));
  const el = eligibleNow(agent, snap.config.concurrency);
  const trans = agent.transitions.slice(-10);
  const span = Math.max(60, snap.clock - (trans[0]?.at ?? snap.clock - 60));
  return (
    <div className="sc-drawer-wrap" role="dialog" aria-modal="true" aria-label={`${agent.name} details`} onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <button type="button" className="sc-scrim" aria-label="Close agent details" onClick={onClose} data-testid="button-agent-scrim" />
      <motion.aside className="sc-drawer" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} data-testid="panel-agent-detail">
        <div className="flex items-start justify-between gap-3">
          <div><span className="eyebrow">Agent profile</span><h3 className="text-2xl font-semibold">{agent.name}</h3><p className="text-sm opacity-75">{agent.team} · {agent.profile}</p></div>
          <button type="button" className="depot-icon-btn is-light" onClick={onClose} autoFocus aria-label="Close" data-testid="button-close-agent"><X className="h-4 w-4" /></button>
        </div>
        <StatusControl agent={agent} />
        <div className={`sc-state mt-3 ${STATE_CLASS[agent.state]}`}><i />{agent.state} for {secs(snap.clock - agent.since)}{agent.returnAt != null && <span className="ml-2 text-xs">returns {clockLabel(agent.returnAt)}</span>}</div>
        <dl className="sc-dl mt-4">
          <div><dt>Queue membership</dt><dd className="text-xs">{agent.queues.join(", ")}</dd></div>
          <div><dt>Channel</dt><dd>{agent.channel}</dd></div>
          <div><dt>Contact time</dt><dd>{secs(agent.contactSeconds)}</dd></div>
          <div><dt>Available time</dt><dd>{secs(agent.availableSeconds)}</dd></div>
          <div><dt>ACW time</dt><dd>{secs(agent.acwSeconds)}</dd></div>
          <div><dt>Occupancy (contact+ACW)</dt><dd>{pct(perf(agent))}</dd></div>
          <div><dt>Legs handled (incl. transferred)</dt><dd>{legs.length}</dd></div>
          <div><dt>Eligible for routing now</dt><dd className="text-xs">{el.ok ? "Yes" : "No"} · {el.why}</dd></div>
        </dl>
        <h4 className="sc-h4">Activity timeline</h4>
        <div className="sc-tl-bar" data-testid="chart-agent-timeline">
          {trans.map((t, i) => { const end = trans[i + 1]?.at ?? snap.clock; return <motion.span key={t.at + t.state} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} style={{ left: `${((t.at - (snap.clock - span)) / span) * 100}%`, width: `${((end - t.at) / span) * 100}%`, background: STATE_COLOR[t.state] }} title={`${t.state} at ${clockLabel(t.at)}`} />; })}
        </div>
        <h4 className="sc-h4">Recent state transitions</h4>
        <ol className="sc-log">{trans.slice().reverse().map((t) => <li key={t.at + t.state}><span className="mono">{clockLabel(t.at)}</span> {t.text}</li>)}</ol>
        <h4 className="sc-h4">Current contact timeline</h4>
        {cur ? <ol className="sc-log">{cur.timeline.map((t, i) => <li key={i}><span className="mono">{clockLabel(t.at)}</span> {t.text}</li>)}</ol> : <p className="text-sm opacity-70">Not on a contact right now.</p>}
        <h4 className="sc-h4">Contact history</h4>
        {history.length ? <ul className="sc-log">{history.map((c) => <li key={c.id}><b>{c.id}</b> {c.channel} · {c.legs.map((l) => l.queue).join(" to ") || c.queue} · {c.status}{c.agent !== agent.id ? " · transferred onward" : ""} · talk {secs(c.talk)}</li>)}</ul> : <p className="text-sm opacity-70">No contacts yet in this simulation.</p>}
      </motion.aside>
    </div>
  );
}

const SETTABLE: AgentState[] = ["Available", "Break", "Lunch", "Custom Status", "Offline"];
/** Simulated status change for idle agents only; active handling or ACW is never overwritten. */
function StatusControl({ agent }: { agent: Agent }) {
  const { apply, error } = useSupervisor();
  const [v, setV] = useState<AgentState>(agent.state === "Available" ? "Break" : "Available");
  const busy = agent.state === "On Contact" || agent.state === "After Contact Work";
  const why = busy ? `${agent.name} is ${agent.state}; status can change only after active work ends.` : v === agent.state ? `Already ${v}.` : null;
  return (
    <div className="sc-statusctl" data-testid="panel-agent-status-control">
      <label className="sc-field"><span>Simulated agent status</span><select value={v} onChange={(e) => setV(e.target.value as AgentState)} disabled={busy} data-testid="select-agent-status">{SETTABLE.map((s) => <option key={s}>{s}</option>)}</select></label>
      <button type="button" className="depot-btn depot-btn-ink" disabled={!!why} onClick={() => apply((s) => intervene(s, "agent-state", { agentId: agent.id, value: v }), `${agent.name} set to ${v}`)} data-testid="button-apply-agent-status">Apply status</button>
      {why && <small className="sc-warn-t" data-testid="text-agent-status-blocked">{why}</small>}
      {error && <small className="sc-err" role="alert">{error}</small>}
      <small className="sc-fine" data-testid="text-agent-status-note">{(METRIC_NOTES as Record<string, string>).status ?? "Native supervisors with the required permissions can change agent activity state from real-time metrics; a change on an agent who is on a contact becomes their next activity rather than ending the contact."} This lab simplifies that: it only applies changes to idle agents. That is a simulation restriction, not a native limitation.</small>
    </div>
  );
}
