import { useMemo, useState } from "react";
import { SimulationCaption } from "@/components/simulation-caption";
import { Link } from "wouter";
import { AlertTriangle, Bell, CheckCircle2, ChevronLeft, ChevronRight, Pause, Play, RefreshCcw, RotateCcw, ShieldCheck } from "lucide-react";
import { intervene, setAlertRules, acknowledgeAlert, resolveAlert } from "@/lib/supervisor-engine";
import { metrics } from "@/lib/supervisor-metrics";
import { ACTIONS, QUEUES, SCENARIOS, type ActionId, type ActionOptions, type AlertMetric, type AlertRule, type Impact, type Queue, type Snapshot } from "@/lib/supervisor-types";
import { METRIC_NOTES } from "@/data/supervisor-reference";
import { useSupervisor, type Speed } from "./supervisor-session";
import { Badge, DASH, clockLabel, pct, secs, slug } from "./shared";

function Spark({ data, color, label, max }: { data: (number | null)[]; color: string; label: string; max?: number }) {
  const vals = data.map((v) => v ?? 0); const m = max ?? Math.max(1, ...vals);
  const pts = vals.map((v, i) => `${(i / Math.max(1, vals.length - 1)) * 100},${30 - (v / m) * 28}`).join(" ");
  return <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="sc-spark" role="img" aria-label={label}><polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" /></svg>;
}

export function SimulationControls({ compact }: { compact?: boolean }) {
  const s = useSupervisor();
  return (
    <div className={`sc-controls ${compact ? "is-compact" : ""}`} data-testid="panel-sim-controls">
      {!compact && <label className="sc-field"><span>Scenario</span><select value={s.scenario} onChange={(e) => s.selectScenario(e.target.value as typeof s.scenario)} data-testid="select-scenario">{SCENARIOS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>}
      <div className="sc-btnrow" role="toolbar" aria-label="Simulation controls">
        <button type="button" className="depot-btn depot-btn-ink" onClick={() => s.start()} data-testid="button-sim-start"><Play className="h-4 w-4" />Start</button>
        {s.playing ? <button type="button" className="depot-btn depot-btn-ghost" onClick={s.pause} data-testid="button-sim-pause"><Pause className="h-4 w-4" />Pause</button>
          : <button type="button" className="depot-btn depot-btn-ghost" onClick={s.resume} disabled={!s.started} data-testid="button-sim-resume"><Play className="h-4 w-4" />Resume</button>}
        <button type="button" className="depot-btn depot-btn-ghost" onClick={s.prev} disabled={s.index === 0} data-testid="button-sim-prev"><ChevronLeft className="h-4 w-4" />Previous step</button>
        <button type="button" className="depot-btn depot-btn-ghost" onClick={s.next} data-testid="button-sim-next">Next step<ChevronRight className="h-4 w-4" /></button>
        <button type="button" className="depot-btn depot-btn-ghost" onClick={s.reset} data-testid="button-sim-reset"><RotateCcw className="h-4 w-4" />Reset</button>
        <button type="button" className="depot-btn depot-btn-ghost" onClick={s.replay} data-testid="button-sim-replay"><RefreshCcw className="h-4 w-4" />Replay</button>
        <div className="depot-mode is-light" role="group" aria-label="Speed">{([0.5, 1, 2] as Speed[]).map((v) => <button key={v} type="button" className={s.speed === v ? "is-on" : ""} aria-pressed={s.speed === v} onClick={() => s.setSpeed(v)} data-testid={`button-speed-${v}`}>{v}x</button>)}</div>
        <label className="sc-toggle"><input type="checkbox" checked={s.animate} onChange={(e) => s.setAnimate(e.target.checked)} data-testid="toggle-animations" />Animations</label>
      </div>
      <p className="sc-fine" data-testid="text-sim-status">{s.playing ? "Running" : s.started ? "Paused" : "Ready"} · step {s.index + 1} of {s.depth} in history · tick {s.snap.tick} · {clockLabel(s.snap.clock)} · each step = 10 simulated seconds · {s.label}</p>
      <SimulationCaption title={s.label} status={s.playing ? "Running" : s.started ? "Paused" : "Ready"} step={`${clockLabel(s.snap.clock)} · Tick ${s.snap.tick}`}>{s.snap.log.at(-1)?.text ?? "Start the fictional contact center simulation to follow operational changes."}</SimulationCaption>
    </div>
  );
}

export function OperationsSimulator() {
  const { snap, scenario, selectScenario, start } = useSupervisor();
  const m = useMemo(() => metrics(snap), [snap]);
  const fr = snap.frames.slice(-60);
  const sc = SCENARIOS.find((x) => x.id === scenario)!;
  const firing = snap.alerts.filter((a) => a.state === "Warning" || a.state === "Critical");
  return (
    <div className="sc-sim" data-testid="panel-simulator">
      <div className="sc-scen">
        {SCENARIOS.map((x, i) => (
          <button key={x.id} type="button" className={`sc-scen-b ${scenario === x.id ? "is-on" : ""}`} onClick={() => selectScenario(x.id)} onDoubleClick={() => start(x.id)} aria-pressed={scenario === x.id} data-testid={`button-scenario-${x.id}`}>
            <span className="mono">{String(i).padStart(2, "0")}</span><b>{x.name}</b><small>{x.detail}</small>
          </button>
        ))}
      </div>
      <div className="sc-sim-stage">
        <div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="text-xl font-semibold">{sc.name}</h3><Badge kind="simulated" /></div>
        <SimulationControls />
        <div className="sc-sim-grid">
          {[
            { k: "Queue depth", v: m.waiting.toString(), d: fr.map((f) => f.waiting), c: "#1F4E79" },
            { k: "Available agents", v: m.available.toString(), d: fr.map((f) => Object.values(f.agents).filter((a) => a.available).length), c: "#3f8f5b" },
            { k: "Service level", v: pct(m.serviceLevel, 0), d: fr.map((f) => f.serviceLevel), c: "#b5412b", max: 100 },
            { k: "Avg speed of answer", v: secs(m.asa), d: fr.map((f) => f.asa), c: "#b7791f" },
            { k: "Occupancy", v: pct(m.occupancy, 0), d: fr.map((f) => f.occupancy), c: "#6b4fa0", max: 100 },
            { k: "Longest wait", v: secs(m.oldest), d: fr.map((f) => f.waiting), c: "#11110D" },
          ].map((x) => (
            <div key={x.k} className="sc-sim-tile" data-testid={`sim-tile-${slug(x.k)}`}><span>{x.k}</span><b className="mono">{x.v}</b><Spark data={x.d} color={x.c} max={x.max} label={`${x.k} trend`} /></div>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="sc-box"><span className="eyebrow">Operational alerts</span>{firing.length ? firing.slice(-4).map((a) => <p key={a.id} className={`sc-alert-line is-${a.state.toLowerCase()}`}><AlertTriangle className="h-4 w-4" />{a.name} · {a.value} vs {a.threshold}</p>) : <p className="text-sm opacity-70">No active alerts at this step.</p>}</div>
          <div className="sc-box"><span className="eyebrow">Event log</span><ol className="sc-log is-short">{snap.log.slice(-6).reverse().map((l, i) => <li key={i}><span className="mono">{clockLabel(l.at)}</span> {l.text}</li>)}</ol></div>
        </div>
        {(m.waiting > 5 || firing.length > 0) && <p className="sc-opportunity" data-testid="text-intervention-opportunity">Intervention opportunity: {m.waiting} contacts waiting and {m.available} agents available. <a href="#interventions" className="underline">Open the intervention center</a>.</p>}
      </div>
    </div>
  );
}

const EST = (i: Impact) => i.recoverySeconds == null ? "Not estimable from current state" : `about ${secs(i.recoverySeconds)} (simulated)`;
export function ImpactCard({ impact }: { impact: Impact | undefined }) {
  if (!impact) return <div className="sc-empty" data-testid="empty-impact">Run an intervention to see before and after metrics from the shared simulation.</div>;
  const b = impact.before, a = impact.after;
  const row = (l: string, x: string, y: string, d: string) => <tr><th scope="row">{l}</th><td className="mono">{x}</td><td className="mono">{y}</td><td className="mono">{d}</td></tr>;
  const dn = (x: number | null, y: number | null, f = (n: number) => n.toFixed(1)) => x == null || y == null ? DASH : `${y - x >= 0 ? "+" : ""}${f(y - x)}`;
  const cx = a.waiting < b.waiting || (a.available > b.available) ? "Fewer customers are expected to keep waiting." : a.waiting > b.waiting ? "Waiting customers increased; consider another action." : "Minimal immediate customer-facing change; effects appear over the next steps.";
  return (
    <div className="sc-impact" data-testid="panel-impact">
      <div className="flex flex-wrap items-center justify-between gap-2"><b>{impact.label}</b><span className="flex gap-1"><Badge kind="simulated" /><span className="mono text-xs">{clockLabel(impact.at)}</span></span></div>
      <table className="sc-table mt-2"><thead><tr><th>Metric</th><th>Before</th><th>After</th><th>Change</th></tr></thead><tbody>
        {row("Queue depth", String(b.waiting), String(a.waiting), dn(b.waiting, a.waiting, (n) => n.toFixed(0)))}
        {row("Service level", pct(b.serviceLevel), pct(a.serviceLevel), dn(b.serviceLevel, a.serviceLevel))}
        {row("Available agents", String(b.available), String(a.available), dn(b.available, a.available, (n) => n.toFixed(0)))}
        {row("Longest wait", secs(b.oldest), secs(a.oldest), dn(b.oldest, a.oldest, (n) => `${n.toFixed(0)}s`))}
      </tbody></table>
      <p className="mt-2 text-sm"><b>Estimated recovery:</b> {EST(impact)}. <b>Customer experience:</b> {cx}</p>
      <p className="text-xs opacity-75">{impact.explanation} Values are simulated estimates, not predictions of a live Amazon Connect instance.</p>
    </div>
  );
}

type Need = { queue?: boolean; target?: boolean; agent?: boolean; contact?: boolean };
const NEEDS: Record<string, Need> = { reassign: { agent: true, target: true }, overflow: { queue: true, target: true }, available: { agent: true }, escalate: { contact: true, target: true }, announcement: { queue: true }, callback: { queue: true }, staffing: { queue: true }, alert: {} };

export function eligibility(snap: Snapshot, id: string, o: ActionOptions): string | null {
  const ag = o.agentId ? snap.agents.find((a) => a.id === o.agentId) : undefined;
  switch (id) {
    case "reassign": if (!ag) return "Select an agent."; if (!o.targetQueue) return "Select a target queue."; if (ag.queues.includes(o.targetQueue)) return `${ag.name} already serves ${o.targetQueue}.`; if (!ag.enabled || ag.retiring || ag.state !== "Available") return "Choose an idle, staffed agent; active work must finish first."; if (!ag.skills.includes(o.targetQueue)) return `${ag.name} is not qualified for ${o.targetQueue}.`; return null;
    case "overflow": if (!o.queue || !o.targetQueue) return "Select source and alternate queues."; if (o.queue === o.targetQueue) return "Source and alternate queue must differ."; return null;
    case "available": if (!ag) return "Select an agent."; if (!["Break", "Lunch", "Custom Status", "Offline"].includes(ag.state)) return `${ag.name} is ${ag.state}; only agents on break, lunch, a custom status or offline can return.`; return null;
    case "escalate": { const c = snap.contacts.find((x) => x.id === o.contactId); if (!c) return "Select a waiting contact."; if (c.status !== "Waiting") return `Contact is ${c.status}; this intervention moves waiting contacts. Use the Zendesk walkthrough for active handling.`; if (!o.targetQueue || o.targetQueue === c.queue) return "Select a different specialized destination queue."; if (!snap.agents.some(a => a.enabled && !a.retiring && a.queues.includes(o.targetQueue!) && a.channel === c.channel)) return "The destination has no staffed agents for this channel."; return null; }
    case "callback": if (!o.queue) return "Select a queue."; if (snap.callback && snap.callbackQueue === o.queue) return null; if (!snap.contacts.some((c) => c.queue === o.queue && c.status === "Waiting" && c.channel === "Voice")) return `No waiting voice contacts in ${o.queue} to offer a callback.`; return null;
    case "staffing": if (snap.agents.length >= 60) return "The simulation limit is 60 agents."; return o.queue ? null : "Select a queue.";
    case "announcement": return o.queue ? null : "Select a queue.";
    default: return null;
  }
}

export function SupervisorInterventionCenter() {
  const { snap, apply, error, clearError } = useSupervisor();
  const [act, setAct] = useState<string>("reassign");
  const [o, setO] = useState<ActionOptions>({ queue: "General Support", targetQueue: "Technical Support" });
  const need = NEEDS[act];
  const def = ACTIONS.find((a) => a.id === act)!;
  const reason = eligibility(snap, act, o);
  const eligibleAgents = act === "available" ? snap.agents.filter((a) => ["Break", "Lunch", "Custom Status", "Offline"].includes(a.state)) : snap.agents.filter((a) => a.state !== "Offline");
  const contacts = snap.contacts.filter((c) => c.status === "Waiting");
  const last = snap.impacts[snap.impacts.length - 1];
  const run = () => { if (reason) return; apply((s) => intervene(s, act as ActionId, o), `${def.name}${o.queue && need.queue ? ` · ${o.queue}` : ""}`); };
  const toggleState = act === "overflow" ? snap.overflow : act === "announcement" ? snap.announcement && snap.announcementQueue === o.queue : act === "callback" ? snap.callback && snap.callbackQueue === o.queue : null;
  return (
    <div className="sc-int" data-testid="panel-interventions">
      <div className="sc-int-list" role="tablist" aria-label="Interventions">
        {ACTIONS.map((a, i) => <button key={a.id} type="button" role="tab" aria-selected={act === a.id} className={`sc-int-b ${act === a.id ? "is-on" : ""}`} onClick={() => { setAct(a.id); clearError(); }} data-testid={`tab-action-${a.id}`}><span className="mono">{String.fromCharCode(65 + i)}</span>{a.name}</button>)}
      </div>
      <div className="sc-int-body">
        <h3 className="text-lg font-semibold">{def.name}</h3>
        <p className="sc-boundary"><ShieldCheck className="h-4 w-4 shrink-0" />{def.boundary}</p>
        <div className="sc-filters mt-3">
          {need.queue && <label className="sc-field"><span>{act === "overflow" ? "Source queue" : "Queue"}</span><select value={o.queue ?? ""} onChange={(e) => setO({ ...o, queue: e.target.value as Queue })} data-testid="select-action-queue">{QUEUES.map((q) => <option key={q}>{q}</option>)}</select></label>}
          {need.agent && <label className="sc-field"><span>Eligible agent</span><select value={o.agentId ?? ""} onChange={(e) => setO({ ...o, agentId: e.target.value || undefined })} data-testid="select-action-agent"><option value="">Select agent</option>{eligibleAgents.map((a) => <option key={a.id} value={a.id}>{a.name} · {a.state}</option>)}</select></label>}
          {need.contact && <label className="sc-field"><span>Contact</span><select value={o.contactId ?? ""} onChange={(e) => setO({ ...o, contactId: e.target.value || undefined })} data-testid="select-action-contact"><option value="">Select contact</option>{contacts.map((c) => <option key={c.id} value={c.id}>{c.id} · {c.queue} · {c.status}</option>)}</select></label>}
          {need.target && <label className="sc-field"><span>{act === "reassign" ? "Reassign to queue" : act === "escalate" ? "Specialized destination" : "Alternate queue"}</span><select value={o.targetQueue ?? ""} onChange={(e) => setO({ ...o, targetQueue: e.target.value as Queue })} data-testid="select-action-target">{QUEUES.map((q) => <option key={q}>{q}</option>)}</select></label>}
        </div>
        {toggleState != null && <p className="text-sm">Currently: <b data-testid="text-action-state">{toggleState ? "Active" : "Inactive"}</b>{act === "overflow" && ` · ${snap.overflowSource} to ${snap.overflowTarget} when waiting exceeds ${snap.overflowThreshold}`}</p>}
        {act === "callback" && <p className="text-sm">Builds on the patterns in the <Link href="/resources/callback" className="underline" data-testid="link-callback-page">Callback lab</Link>.</p>}
        {act === "alert" && <p className="text-sm">Threshold rules are configured in the <a href="#alerts" className="underline">alert center</a>. This action raises an inline alert now.</p>}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" className="depot-btn depot-btn-ink" disabled={!!reason} onClick={run} data-testid="button-run-action">Apply simulated action</button>
          {reason && <span className="sc-warn-t" role="status" data-testid="text-action-blocked">{reason}</span>}
        </div>
        {error && <p className="sc-err" role="alert" data-testid="text-action-error">{error} <button type="button" className="underline" onClick={clearError}>Dismiss</button></p>}
        <div className="mt-4"><ImpactCard impact={last} /></div>
        {snap.impacts.length > 1 && <details className="mt-3"><summary className="cursor-pointer text-sm font-semibold" data-testid="button-impact-history">Intervention history ({snap.impacts.length})</summary><ul className="sc-log">{snap.impacts.slice().reverse().map((i) => <li key={i.id}><span className="mono">{clockLabel(i.at)}</span> {i.label}: waiting {i.before.waiting} to {i.after.waiting}</li>)}</ul></details>}
      </div>
    </div>
  );
}

const METRIC_LABEL: Record<AlertMetric, string> = { waiting: "Contacts waiting", serviceLevel: "Service level (%)", oldest: "Longest wait (s)", available: "Available agents", abandonment: "Abandonment rate (%)", acw: "Agents in ACW", volume: "Contact volume", overflow: "Overflow activated", integration: "Integration failure", incident: "Operational incident" };
export function SupervisorAlertCenter() {
  const { snap, apply } = useSupervisor();
  const [draft, setDraft] = useState<AlertRule[] | null>(null);
  const rules = draft ?? snap.rules;
  const edit = (id: string, p: Partial<AlertRule>) => setDraft(rules.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const save = () => { if (draft && apply((s) => setAlertRules(s, draft), "Alert rules updated")) setDraft(null); };
  const stages = ["Normal", "Warning", "Critical", "Acknowledged", "Resolved"];
  return (
    <div className="sc-alerts" data-testid="panel-alerts">
      <div className="sc-box">
        <div className="flex flex-wrap items-center justify-between gap-2"><span className="eyebrow">Threshold rules</span><span className="flex gap-2"><button type="button" className="depot-btn depot-btn-ghost" disabled={!draft} onClick={() => setDraft(null)} data-testid="button-rules-discard">Discard</button><button type="button" className="depot-btn depot-btn-ink" disabled={!draft} onClick={save} data-testid="button-rules-save">Save rules to simulation</button></span></div>
        <div className="sc-scroll"><table className="sc-table"><thead><tr><th>On</th><th>Rule</th><th>Metric</th><th>Threshold</th><th>Interval</th><th>Severity</th><th>Notification</th><th>Escalate to</th></tr></thead><tbody>
          {rules.map((r) => (
            <tr key={r.id} data-testid={`row-rule-${r.id}`}>
              <td><input type="checkbox" checked={r.enabled} onChange={(e) => edit(r.id, { enabled: e.target.checked })} aria-label={`Enable ${r.name}`} data-testid={`toggle-rule-${r.id}`} /></td>
              <td>{r.name}</td>
              <td><select value={r.metric} onChange={(e) => edit(r.id, { metric: e.target.value as AlertMetric })} data-testid={`select-rule-metric-${r.id}`}>{Object.entries(METRIC_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></td>
              <td><input type="number" value={r.threshold} onChange={(e) => edit(r.id, { threshold: Number(e.target.value) })} className="w-20" aria-label={`${r.name} threshold`} data-testid={`input-rule-threshold-${r.id}`} /></td>
              <td><select value={r.interval} onChange={(e) => edit(r.id, { interval: Number(e.target.value) })} data-testid={`select-rule-interval-${r.id}`}>{[10, 30, 60, 300].map((v) => <option key={v} value={v}>{v}s</option>)}</select></td>
              <td><select value={r.severity} onChange={(e) => edit(r.id, { severity: e.target.value as AlertRule["severity"] })} data-testid={`select-rule-severity-${r.id}`}><option>Warning</option><option>Critical</option></select></td>
              <td><select value={r.notification} onChange={(e) => edit(r.id, { notification: e.target.value as AlertRule["notification"] })} data-testid={`select-rule-notify-${r.id}`}><option>Inline</option><option>Email concept</option><option>EventBridge concept</option></select></td>
              <td><input value={r.destination} onChange={(e) => edit(r.id, { destination: e.target.value })} className="w-36" aria-label={`${r.name} destination`} data-testid={`input-rule-destination-${r.id}`} /></td>
            </tr>
          ))}
        </tbody></table></div>
        {draft && <p className="sc-warn-t mt-2">Unsaved rule changes. Saved rules are evaluated by the shared simulation at the next step.</p>}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="sc-box">
          <div className="flex flex-wrap items-center justify-between gap-2"><span className="eyebrow">Alert lifecycle</span>
            <span className="flex flex-wrap gap-2">
              <button type="button" className="depot-btn depot-btn-ghost" onClick={() => apply((s) => intervene(s, snap.integrationHealthy ? "integration-failure" : "integration-recover"), snap.integrationHealthy ? "Integration failure injected" : "Integration recovered")} data-testid="button-toggle-integration">{snap.integrationHealthy ? "Inject integration failure" : "Recover integration"}</button>
              {snap.incident && <button type="button" className="depot-btn depot-btn-ghost" onClick={() => apply((s) => intervene(s, "resolve-incident"), "Incident resolved")} data-testid="button-resolve-incident">Resolve incident</button>}
            </span></div>
          <ol className="sc-stages">{stages.map((s) => <li key={s} className={`is-${s.toLowerCase()}`}>{s}<b className="mono">{s === "Normal" ? rules.filter((r) => r.enabled).length - snap.alerts.filter((a) => a.state !== "Resolved").length : snap.alerts.filter((a) => a.state === s).length}</b></li>)}</ol>
          {snap.alerts.length === 0 ? <div className="sc-empty" data-testid="empty-alerts"><CheckCircle2 className="h-5 w-5" />All enabled rules are within threshold. Start the spike scenario or lower a threshold to trigger one.</div> : (
            <ul className="sc-alert-list">{snap.alerts.slice().reverse().slice(0, 12).map((a) => (
              <li key={a.id} className={`is-${a.state.toLowerCase()}`} data-testid={`row-alert-${a.id}`}>
                <Bell className="h-4 w-4 shrink-0" />
                <div className="min-w-0 flex-1"><b>{a.name}</b><p className="text-xs">{METRIC_LABEL[a.metric]} {a.value} vs threshold {a.threshold} · {a.notification} · to {a.destination} · since {clockLabel(a.since)}</p></div>
                <span className="sc-pill" data-testid={`status-alert-${a.id}`}>{a.state}</span>
                {(a.state === "Warning" || a.state === "Critical") && <button type="button" className="room-pill" onClick={() => apply((s) => acknowledgeAlert(s, a.id), `Acknowledged ${a.name}`)} data-testid={`button-ack-${a.id}`}>Acknowledge</button>}
                {a.state !== "Resolved" && <button type="button" className="room-pill" onClick={() => apply((s) => resolveAlert(s, a.id), `Resolved ${a.name}`)} data-testid={`button-resolve-${a.id}`}>Resolve</button>}
              </li>
            ))}</ul>
          )}
        </div>
        <div className="sc-box">
          <span className="eyebrow">Native versus custom alerting</span>
          <p className="mt-2 text-sm"><Badge kind="native" /> {METRIC_NOTES.alerts}</p>
          <ol className="sc-pattern mt-3" aria-label="Custom integration pattern">
            {["Connect rules or contact events", "Amazon EventBridge", "AWS Lambda", "Notification system (paging, chat, ticket)"].map((x, i) => <li key={x} className={i === 0 ? "is-native" : "is-custom"}>{x}</li>)}
          </ol>
          <p className="mt-2 text-xs opacity-75">Agent event streams are delivered through Kinesis Data Streams. CloudWatch publishes a separate subset of instance metrics. The lab performs no external notifications. <Badge kind="custom" /></p>
          {!snap.integrationHealthy && <p className="sc-err mt-2" data-testid="text-integration-down">Integration path degraded: custom notifications would queue or fail in this simulation.</p>}
        </div>
      </div>
    </div>
  );
}
