import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2, Moon, Sun, X } from "lucide-react";
import { intervene, configureSupervisor, stepSupervisor } from "@/lib/supervisor-engine";
import { metrics, queueMetrics } from "@/lib/supervisor-metrics";
import { QUEUES, STATES, type ActionId, type ActionOptions, type Queue, type Scenario, type Snapshot } from "@/lib/supervisor-types";
import { useSupervisor } from "./supervisor-session";
import { ImpactCard, SimulationControls, eligibility } from "./Operations";
import { queueStatus } from "./CommandCenter";
import { STATE_COLOR, clockLabel, pct, secs } from "./shared";

type Choice = { label: string; run: (s: Snapshot) => Snapshot; check?: (s: Snapshot) => string | null; outcome: string };
const firstOn = (s: Snapshot, states: string[], q?: Queue) => s.agents.find((a) => states.includes(a.state) && (!q || !a.queues.includes(q)));
/** Idle agent whose team/profile qualifies as a specialist for the target queue but who is not yet assigned to it. */
const idleSpecialist = (s: Snapshot, q: Queue) => s.agents.find((a) => a.state === "Available" && a.enabled && !a.retiring && !a.queues.includes(q) && a.skills.includes(q));
const act = (id: ActionId, o: (s: Snapshot) => ActionOptions): Pick<Choice, "run" | "check"> => ({ run: (s) => intervene(s, id, o(s)), check: (s) => (["reassign", "overflow", "available", "escalate", "callback", "announcement", "staffing"].includes(id) ? eligibility(s, id, o(s)) : null) });
const PB: { id: string; name: string; scenario: Scenario; queue: Queue; situation: string; tech: string; value: string; recommended: number; choices: Choice[] }[] = [
  { id: "sl", name: "Service Level Crisis", scenario: "spike", queue: "General Support", situation: "Arrivals quadruple and General Support service level falls under target.", tech: "Native Service level X counts removals within X; overflow needs configured flow logic.", value: "Protects customer experience during unplanned peaks.", recommended: 0, choices: [
    { label: "Activate overflow to Sales", ...act("overflow", () => ({ queue: "General Support", targetQueue: "Sales" })), outcome: "Waiting contacts can move to the alternate queue when the configured threshold is met." },
    { label: "Add relief staffing", ...act("staffing", () => ({ queue: "General Support" })), outcome: "More eligible capacity; recovery depends on arrival rate." },
    { label: "Wait one minute without acting", run: (s) => Array.from({ length: 6 }).reduce<Snapshot>((x) => stepSupervisor(x), s), outcome: "Backlog keeps building; no intervention impact is recorded." } ] },
  { id: "short", name: "Agent Shortage", scenario: "shortage", queue: "Technical Support", situation: "Six agents leave eligible capacity at once.", tech: "Status changes are agent or permission driven; a supervisor dashboard does not arbitrarily override all states.", value: "Shows real cost of unplanned absence.", recommended: 1, choices: [
    { label: "Return an agent from break", ...act("available", (s) => ({ agentId: firstOn(s, ["Break", "Lunch", "Custom Status", "Offline"])?.id })), outcome: "One more agent available, modest relief." },
    { label: "Add shift staffing", ...act("staffing", () => ({ queue: "Technical Support" })), outcome: "Fictional extra capacity reduces backlog over several steps." },
    { label: "Offer callbacks", ...act("callback", () => ({ queue: "Technical Support" })), outcome: "Opted-in callers leave hold; no real callback is scheduled." } ] },
  { id: "vip", name: "VIP Customer Escalation", scenario: "vip", queue: "VIP Support", situation: "High-priority arrivals compete for limited VIP-eligible agents.", tech: "Routing-profile priority and queue membership determine eligibility.", value: "Keeps highest-value relationships protected.", recommended: 0, choices: [
    { label: "Add an idle qualified specialist to VIP Support", ...act("reassign", (s) => ({ agentId: idleSpecialist(s, "VIP Support")?.id, targetQueue: "VIP Support" })), check: (s) => idleSpecialist(s, "VIP Support") ? eligibility(s, "reassign", { agentId: idleSpecialist(s, "VIP Support")!.id, targetQueue: "VIP Support" }) : "No idle specialist-qualified agent right now; return or add specialist staffing first.", outcome: "Adds VIP coverage only if an idle, specialist-qualified agent exists; that agent's other queues lose some availability. Disabled when none qualifies." },
    { label: "Escalate a waiting VIP contact", ...act("escalate", (s) => ({ contactId: s.contacts.find((c) => c.queue === "VIP Support" && c.status === "Waiting")?.id, targetQueue: "Technical Support" })), outcome: "One contact moves to a specialist path." } ] },
  { id: "surge", name: "Unexpected Contact Surge", scenario: "incident", queue: "Technical Support", situation: "An outage drives Technical Support demand.", tech: "Announcements require a configured flow and published prompt.", value: "Deflects repeat questions and sets expectations.", recommended: 0, choices: [
    { label: "Play emergency announcement", ...act("announcement", () => ({ queue: "Technical Support" })), outcome: "Callers hear the known-issue message. This simulation does not assume it reduces demand or handle time." },
    { label: "Offer callbacks", ...act("callback", () => ({ queue: "Technical Support" })), outcome: "Opted-in callers leave the hold queue in this simulation. No real callback is scheduled and queue position retention is not modeled." } ] },
  { id: "int", name: "Integration Outage", scenario: "normal", queue: "General Support", situation: "The custom notification integration fails.", tech: "EventBridge and Lambda consumers are custom; native rules may still fire.", value: "Demonstrates monitoring the monitor.", recommended: 0, choices: [
    { label: "Inject integration failure", run: (s) => intervene(s, "integration-failure"), outcome: "Integration alert raised." },
    { label: "Recover integration", run: (s) => intervene(s, "integration-recover"), outcome: "Integration path healthy again." } ] },
  { id: "abn", name: "High Abandonment Rate", scenario: "spike", queue: "Billing", situation: "Long waits push customers to hang up.", tech: "Abandoned within X still counts in native Service level X numerator.", value: "Recovers revenue and satisfaction otherwise lost.", recommended: 0, choices: [
    { label: "Offer callbacks in Billing", ...act("callback", () => ({ queue: "Billing" })), outcome: "Opted-in callers leave hold; queue-position retention is not modeled." },
    { label: "Add Billing staffing", ...act("staffing", () => ({ queue: "Billing" })), outcome: "Shorter waits lower abandonment over time." } ] },
  { id: "aht", name: "Extended Handle Time", scenario: "acw", queue: "General Support", situation: "ACW quadruples and throughput falls.", tech: "AHT includes talk, hold and ACW; ACW reduces availability.", value: "Shows how wrap-up discipline frees capacity.", recommended: 0, choices: [
    { label: "Coach wrap-up: base ACW 10s (crisis 4x = 40s)", run: (s) => configureSupervisor(s, { acw: 10 }), outcome: "Applies to contacts that enter ACW from now on; agents already in ACW finish their current wrap-up. Effective ACW drops from 120s to 40s." },
    { label: "Add staffing", ...act("staffing", () => ({ queue: "General Support" })), outcome: "Compensates for lost throughput." } ] },
  { id: "imb", name: "Queue Imbalance", scenario: "overflow", queue: "General Support", situation: "General Support overflows while Spanish Support is idle.", tech: "Overflow only moves contacts with configured flow logic.", value: "Uses idle capacity without new hires.", recommended: 0, choices: [
    { label: "Activate overflow to Spanish Support", ...act("overflow", () => ({ queue: "General Support", targetQueue: "Spanish Support" })), outcome: "Contacts move once the threshold is reached." },
    { label: "Reassign agent to General Support", ...act("reassign", (s) => ({ agentId: firstOn(s, ["Available"], "General Support")?.id, targetQueue: "General Support" })), outcome: "General coverage rises." } ] },
];

export function SupervisorPlaybooks() {
  const { snap, apply, selectScenario, scenario, error } = useSupervisor();
  const [id, setId] = useState(PB[0].id);
  const [chosen, setChosen] = useState<number | null>(null);
  const p = PB.find((x) => x.id === id)!;
  const qm = queueMetrics(snap, p.queue); const m = metrics(snap);
  return (
    <div className="sc-pb" data-testid="panel-playbooks">
      <div className="sc-int-list">{PB.map((x) => <button key={x.id} type="button" className={`sc-int-b ${id === x.id ? "is-on" : ""}`} onClick={() => { setId(x.id); setChosen(null); }} data-testid={`tab-playbook-${x.id}`}>{x.name}</button>)}</div>
      <div className="sc-int-body">
        <h3 className="text-xl font-semibold">{p.name}</h3>
        <p className="text-sm"><b>Scenario.</b> {p.situation}</p>
        {scenario !== p.scenario && <button type="button" className="room-pill mt-2" onClick={() => selectScenario(p.scenario)} data-testid="button-load-playbook-scenario">Load matching scenario</button>}
        <div className="sc-ind mt-3" data-testid="panel-playbook-indicators">
          <span>{p.queue} waiting <b className="mono">{qm.waiting}</b></span><span>Oldest <b className="mono">{secs(qm.oldest)}</b></span><span>Queue SL <b className="mono">{pct(qm.serviceLevel, 0)}</b></span><span>Available <b className="mono">{m.available}</b></span><span>Abandon <b className="mono">{pct(m.abandonment, 0)}</b></span><span>Integration <b>{snap.integrationHealthy ? "Healthy" : "Failed"}</b></span>
        </div>
        <span className="eyebrow mt-4 block">What would you do?</span>
        <div className="mt-2 grid gap-2 md:grid-cols-2">{p.choices.map((c, i) => { const why = c.check?.(snap) ?? null; return (
          <button key={c.label} type="button" disabled={!!why} className={`sc-choice ${chosen === i ? "is-on" : ""}`} onClick={() => { if (apply(c.run, `${p.name}: ${c.label}`)) setChosen(i); }} data-testid={`button-playbook-choice-${p.id}-${i}`}>
            <b>{c.label}{i === p.recommended && <span className="sc-pill is-ok ml-2">Recommended</span>}</b><small>Expected: {c.outcome}</small>{why && <small className="sc-warn-t">{why}</small>}
          </button>); })}</div>
        {error && <p className="sc-err mt-2" role="alert">{error}</p>}
        {chosen != null && <div className="mt-3"><ImpactCard impact={snap.impacts[snap.impacts.length - 1]} /><p className="mt-2 text-sm">{chosen === p.recommended ? "Recommended action applied." : `Recommended: ${p.choices[p.recommended].label}.`} Use Next step to watch recovery unfold.</p></div>}
        <div className="mt-3 grid gap-2 md:grid-cols-2 text-sm"><p><b>Technical explanation.</b> {p.tech}</p><p><b>Business value.</b> {p.value}</p></div>
      </div>
    </div>
  );
}

export function LiveWallboard() {
  const { snap, playing, resume, pause, animate } = useSupervisor();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(true);
  const [q, setQ] = useState<Queue | "">("");
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") { close(); return; }
      if (e.key !== "Tab" || !wallRef.current) return;
      const f = [...wallRef.current.querySelectorAll<HTMLElement>("button, select, [tabindex]:not([tabindex='-1'])")].filter((x) => !x.hasAttribute("disabled"));
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!wallRef.current.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    };
    const prevOverflow = document.body.style.overflow;
    const fs = () => { if (!document.fullscreenElement && entered.current) { entered.current = false; setOpen(false); } };
    window.addEventListener("keydown", k); document.addEventListener("fullscreenchange", fs); document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.removeEventListener("fullscreenchange", fs); document.body.style.overflow = prevOverflow; launchRef.current?.focus(); };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const entered = useRef(false);
  const launchRef = useRef<HTMLButtonElement>(null);
  const wallRef = useRef<HTMLDivElement>(null);
  const launch = () => { setOpen(true); document.documentElement.requestFullscreen?.().then(() => { entered.current = true; }).catch(() => undefined); if (!playing) resume(); };
  const close = () => { entered.current = false; setOpen(false); if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined); };
  const m = useMemo(() => (q ? queueMetrics(snap, q) : metrics(snap)), [snap, q]);
  const ag = q ? snap.agents.filter((a) => a.queues.includes(q)) : snap.agents;
  const fr = snap.frames.slice(-40);
  const series = fr.map((f) => (q ? snap.contacts.filter((c) => c.legs.some((l) => l.queue === q && l.enqueue <= f.at && (l.exit == null || l.exit > f.at))).length : f.waiting));
  const maxW = Math.max(1, ...series);
  const vol = fr.map((f, i) => { const p = fr[i - 1]?.at ?? f.at - 10; return snap.contacts.filter((c) => c.arrived > p && c.arrived <= f.at && (!q || (c.legs[0]?.queue ?? c.queue) === q)).length; });
  const maxV = Math.max(1, ...vol);
  const line = (xs: number[], mx: number) => xs.map((w, i) => `${(i / Math.max(1, xs.length - 1)) * 200},${38 - (w / mx) * 34}`).join(" ");
  const firing = snap.alerts.filter((a) => a.state === "Warning" || a.state === "Critical");
  return (
    <>
      <button ref={launchRef} type="button" className="depot-btn depot-btn-ink" onClick={launch} data-testid="button-open-wallboard"><Maximize2 className="h-4 w-4" />Open Contact Center Live Wallboard</button>
      {open && createPortal(
        <div className={`sc-wall ${dark ? "is-dark" : ""} ${animate ? "" : "sc-noanim"}`} ref={wallRef} role="dialog" aria-modal="true" aria-label="Contact Center Live Wallboard" data-testid="panel-wallboard">
          <header><h2>Contact Center Live Wallboard</h2><span className="mono">{clockLabel(snap.clock)} · simulated · Esc to exit</span>
            <select value={q} onChange={(e) => setQ(e.target.value as Queue | "")} aria-label="Queue filter" data-testid="select-wallboard-queue"><option value="">All queues</option>{QUEUES.map((x) => <option key={x}>{x}</option>)}</select>
            <button type="button" onClick={() => (playing ? pause() : resume())} data-testid="button-wallboard-play">{playing ? "Pause" : "Resume"}</button>
            <button type="button" onClick={() => setDark(!dark)} aria-label="Toggle light or dark" data-testid="button-wallboard-theme">{dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</button>
            <button type="button" className="is-exit" onClick={close} autoFocus data-testid="button-exit-wallboard"><X className="h-5 w-5" />Exit full screen</button></header>
          <div className="sc-wall-kpis">
            {[["Service level (today cohort)", pct(m.serviceLevel, 0), m.serviceLevel != null && m.serviceLevel < snap.config.slTarget], ["Live waiting", String(m.waiting), m.waiting > 10], ["Longest wait", secs(m.oldest), m.oldest > 120], ["Active contacts", String(m.active), false], ["Available", String(ag.filter((a) => a.state === "Available").length), false], ["Abandon rate (today)", pct(m.abandonment, 0), (m.abandonment ?? 0) > 8]].map(([l, v, bad]) => <div key={l as string} className={bad ? "is-bad" : ""} data-testid={`wall-kpi-${String(l).toLowerCase().replace(/ /g, "-")}`}><span>{l}</span><b className="mono">{v}</b></div>)}
          </div>
          <div className="sc-wall-grid">
            <section><h3>Queue health</h3>{(q ? [q] : QUEUES).map((x) => { const qm = queueMetrics(snap, x); const st = queueStatus(qm, snap.config.slTarget); return <div key={x} className="sc-wall-q"><span>{x}</span><b className="mono">{qm.waiting}</b><span className={`sc-pill ${st.c}`}>{st.t}</span></div>; })}</section>
            <section><h3>Trends · {q || "all queues"} · last {fr.length * 10}s</h3>
              <span className="sc-wall-tl">Waiting · peak {maxW}</span><svg viewBox="0 0 200 40" preserveAspectRatio="none" className="sc-wall-spark" role="img" aria-label={`Waiting trend, peak ${maxW}`} data-testid="chart-wallboard-waiting"><polyline fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" points={line(series, maxW)} /></svg>
              <span className="sc-wall-tl">Call volume · arrivals per 10s · peak {maxV} · total {vol.reduce((x, y) => x + y, 0)}</span><svg viewBox="0 0 200 40" preserveAspectRatio="none" className="sc-wall-spark" role="img" aria-label={`Call volume trend, peak ${maxV}`} data-testid="chart-wallboard-volume"><polyline fill="none" stroke="#E98E2E" strokeWidth="2" vectorEffect="non-scaling-stroke" points={line(vol, maxV)} /></svg></section>
            <section><h3>Agent status</h3>{STATES.map((s) => { const n = ag.filter((a) => a.state === s).length; return <div key={s} className="sc-wall-st"><i style={{ background: STATE_COLOR[s], width: `${(n / Math.max(1, ag.length)) * 100}%` }} /><span>{s}</span><b className="mono">{n}</b></div>; })}</section>
            <section><h3>Alerts · contact-center wide</h3>{firing.length ? firing.slice(-5).map((a) => <p key={a.id} className={`sc-alert-line is-${a.state.toLowerCase()}`}>{a.state}: {a.name}</p>) : <p>No active alerts</p>}</section>
          </div>
        </div>, document.body)}
    </>
  );
}

export { SimulationControls };
