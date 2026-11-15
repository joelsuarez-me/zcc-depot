import { DiagramFrame, EdgeList } from "@/components/diagram-view-controls";
import { useMemo, useState } from "react";
import { SimulationCaption } from "@/components/simulation-caption";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download } from "lucide-react";
import { intervene } from "@/lib/supervisor-engine";
import { metrics, reportCsv, reportRows, serviceLevel } from "@/lib/supervisor-metrics";
import { BASE_TIME, QUEUES, type Channel, type Filter, type Queue } from "@/lib/supervisor-types";
import { METRIC_NOTES } from "@/data/supervisor-reference";
import { useSupervisor } from "./supervisor-session";
import { Badge, DASH, agentName, clockLabel, pct, secs, slug } from "./shared";

const C = ["#1F74AD", "#E98E2E", "#44986D", "#9267C6", "#61A9BD", "#D8524F"];
const BUCKET = 300;
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function HistoricalAnalytics() {
  const { snap } = useSupervisor();
  const [f, setF] = useState({ range: "today", queue: "", agent: "", team: "", channel: "", profile: "" });
  const filter: Filter = { from: f.range === "today" ? undefined : snap.clock - Number(f.range) * 60, to: snap.clock, queue: (f.queue || undefined) as Queue | undefined, agent: f.agent || undefined, team: f.team || undefined, channel: (f.channel || undefined) as Channel | undefined, profile: f.profile || undefined };
  const rows = useMemo(() => reportRows(snap, filter), [snap, JSON.stringify(filter)]); // eslint-disable-line react-hooks/exhaustive-deps
  const thr = snap.config.slThreshold;
  /** Contiguous 5-minute buckets (empty buckets kept) on a real UTC time axis. */
  const buckets = useMemo(() => {
    const first = Math.min(snap.frames[0]?.at ?? snap.clock, ...rows.map((r) => r.disconnect));
    const start = Math.floor((filter.from ?? first) / BUCKET) * BUCKET;
    const out = [];
    for (let k = start; k <= snap.clock; k += BUCKET) {
      const rs = rows.filter((r) => r.disconnect >= k && r.disconnect < k + BUCKET);
      const ans = rs.filter((r) => r.reason === "Answered");
      const occ = metrics(snap, { ...filter, from: Math.max(k, filter.from ?? k), to: Math.min(k + BUCKET, snap.clock) }).occupancy;
      out.push({ k, t: BASE_TIME + k * 1000, label: clockLabel(k).slice(0, 5), volume: new Set(rs.map((r) => r.contactId)).size, legs: rs.length, sl: serviceLevel(rs, thr).percentage, aht: avg(ans.map((r) => r.talk + r.hold + r.acw)), asa: avg(ans.map((r) => r.wait)), abandon: rs.length ? (rs.filter((r) => r.reason === "Abandoned").length / rs.length) * 100 : null, occupancy: occ });
    }
    return out;
  }, [rows, thr, snap, JSON.stringify(filter)]); // eslint-disable-line react-hooks/exhaustive-deps
  const occ = buckets;
  const byQueue = QUEUES.map((q) => { const rs = rows.filter((r) => r.queue === q); const ans = rs.filter((r) => r.reason === "Answered"); return { q, legs: rs.length, answered: ans.length, abandoned: rs.filter((r) => r.reason === "Abandoned").length, overflow: rs.filter((r) => r.reason === "Overflow").length, callback: rs.filter((r) => r.reason === "Callback").length, sl: serviceLevel(rs, thr).percentage, asa: avg(ans.map((r) => r.wait)), aht: avg(ans.map((r) => r.talk + r.hold + r.acw)) }; });
  const byAgent = [...new Set(rows.filter((r) => r.agent).map((r) => r.agent!))].map((id) => { const rs = rows.filter((r) => r.agent === id && r.reason === "Answered"); return { id, n: rs.length, aht: avg(rs.map((r) => r.talk + r.hold + r.acw)), talk: avg(rs.map((r) => r.talk)), acw: avg(rs.map((r) => r.acw)) }; }).sort((a, b) => b.n - a.n);
  const channels = (["Voice", "Chat", "Task"] as Channel[]).map((c) => ({ name: c, value: rows.filter((r) => r.channel === c).length }));
  const totalLegs = rows.length;
  const heat = QUEUES.map((q) => ({ q, cells: buckets.map((b) => rows.filter((r) => r.queue === q && r.disconnect >= b.k && r.disconnect < b.k + BUCKET).length) }));
  const heatMax = Math.max(1, ...heat.flatMap((h) => h.cells));
  const peak = buckets.reduce<typeof buckets[number] | null>((p, b) => (!p || b.legs > p.legs ? b : p), null);
  const exportCsv = () => {
    const blob = new Blob([`# ZCC Depot simulated supervisor export - fictional data, not Amazon Connect output\n# filters ${JSON.stringify(filter)}\n` + reportCsv(snap, filter)], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "supervisor-simulated-report.csv"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const Sel = (k: keyof typeof f, label: string, opts: [string, string][]) => <label className="sc-field"><span>{label}</span><select value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} data-testid={`select-report-${k}`}>{opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>;
  const uniq = (xs: string[]) => [...new Set(xs)].map((x) => [x, x] as [string, string]);
  const xa = { dataKey: "t", type: "number" as const, scale: "time" as const, domain: ["dataMin", "dataMax"] as [string, string], fontSize: 11, tickFormatter: (v: number) => new Date(v).toISOString().slice(11, 16) };
  const tt = { labelFormatter: (v: unknown) => typeof v === "number" ? `${new Date(v).toISOString().slice(11, 16)} UTC bucket` : String(v), contentStyle: { borderRadius: 10, border: "1px solid rgba(17,17,13,.15)", fontSize: 12 } };
  return (
    <div className="sc-hist" data-testid="panel-historical">
      <div className="sc-filters">
        {Sel("range", "Date range", [["15", "Last 15 min"], ["30", "Last 30 min"], ["60", "Last hour"], ["today", "Today (sim)"]])}
        {Sel("queue", "Queue", [["", "All"], ...QUEUES.map((q) => [q, q] as [string, string])])}
        {Sel("agent", "Agent", [["", "All"], ...snap.agents.map((a) => [a.id, a.name] as [string, string])])}
        {Sel("team", "Team", [["", "All"], ...uniq(snap.agents.map((a) => a.team))])}
        {Sel("channel", "Channel", [["", "All"], ["Voice", "Voice"], ["Chat", "Chat"], ["Task", "Task"]])}
        {Sel("profile", "Routing profile", [["", "All"], ...uniq(snap.agents.map((a) => a.profile))])}
        <button type="button" className="depot-btn depot-btn-ink self-end" onClick={exportCsv} disabled={!rows.length} data-testid="button-export-csv"><Download className="h-4 w-4" />Export simulated CSV</button>
      </div>
      <p className="sc-fine" data-testid="text-report-count">{totalLegs} closed queue legs from {new Set(rows.map((r) => r.contactId)).size} unique contacts. Legs are not unique customers: overflow and escalation create extra legs. <Badge kind="simulated" /></p>
      {rows.length === 0 ? <div className="sc-empty" data-testid="empty-report">No closed records match these filters. Run the simulation or widen the range.</div> : (
        <div className="sc-charts">
          <Card title="Contact volume" sub="Unique contacts vs queue legs per 5 min"><ResponsiveContainer width="100%" height={180}><BarChart data={buckets}><CartesianGrid strokeDasharray="2 4" vertical={false} /><XAxis {...xa} /><YAxis fontSize={11} allowDecimals={false} /><Tooltip {...tt} /><Legend wrapperStyle={{ fontSize: 11 }} /><Bar dataKey="volume" name="Unique contacts" fill={C[0]} maxBarSize={14} /><Bar dataKey="legs" name="Queue legs" fill={C[4]} maxBarSize={14} /></BarChart></ResponsiveContainer></Card>
          <Card title="Service level trend" sub={`Native SL ${thr}s per 5 min (%)`}><ResponsiveContainer width="100%" height={180}><LineChart data={buckets}><CartesianGrid strokeDasharray="2 4" vertical={false} /><XAxis {...xa} /><YAxis domain={[0, 100]} fontSize={11} /><Tooltip {...tt} formatter={(v: number) => pct(v)} /><Line dataKey="sl" name="Service level" stroke={C[0]} strokeWidth={2} dot={false} connectNulls={false} /></LineChart></ResponsiveContainer></Card>
          <Card title="AHT and ASA" sub="Seconds, answered legs"><ResponsiveContainer width="100%" height={180}><LineChart data={buckets}><CartesianGrid strokeDasharray="2 4" vertical={false} /><XAxis {...xa} /><YAxis fontSize={11} /><Tooltip {...tt} formatter={(v: number) => secs(v)} /><Legend wrapperStyle={{ fontSize: 11 }} /><Line dataKey="aht" name="AHT" stroke={C[1]} strokeWidth={2} dot={false} /><Line dataKey="asa" name="ASA" stroke={C[3]} strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></Card>
          <Card title="Abandonment rate" sub="% of closed legs abandoned"><ResponsiveContainer width="100%" height={180}><BarChart data={buckets}><CartesianGrid strokeDasharray="2 4" vertical={false} /><XAxis {...xa} /><YAxis fontSize={11} /><Tooltip {...tt} formatter={(v: number) => pct(v)} /><Bar dataKey="abandon" name="Abandonment" fill={C[5]} maxBarSize={18} /></BarChart></ResponsiveContainer></Card>
          <Card title="Agent occupancy" sub="Time-weighted activity occupancy per 5 min, all six filters"><ResponsiveContainer width="100%" height={180}><LineChart data={occ}><CartesianGrid strokeDasharray="2 4" vertical={false} /><XAxis {...xa} /><YAxis domain={[0, 100]} fontSize={11} /><Tooltip {...tt} formatter={(v: number) => pct(v)} /><Line dataKey="occupancy" name="Occupancy" stroke={C[2]} strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></Card>
          <Card title="Channel distribution" sub={`All ${totalLegs} legs, zero channels listed`}>
            <div className="flex items-center gap-3"><ResponsiveContainer width="55%" height={170}><PieChart><Pie data={channels.filter((c) => c.value)} dataKey="value" nameKey="name" innerRadius={42} outerRadius={70} paddingAngle={2}>{channels.filter((c) => c.value).map((c) => <Cell key={c.name} fill={C[["Voice", "Chat", "Task"].indexOf(c.name)]} />)}</Pie><Tooltip {...tt} /></PieChart></ResponsiveContainer>
              <ul className="text-sm">{channels.map((c, i) => <li key={c.name} data-testid={`text-channel-${c.name.toLowerCase()}`}><i className="sc-sw" style={{ background: C[i] }} />{c.name}: <b className="mono">{c.value}</b> ({totalLegs ? ((c.value / totalLegs) * 100).toFixed(1) : 0}%)</li>)}</ul></div>
          </Card>
          <Card title="Peak traffic periods" sub={peak && peak.legs ? `Peak ${peak.label} UTC with ${peak.legs} legs` : DASH} wide>
            <div className="sc-scroll"><table className="sc-heat-t" data-testid="chart-peak-heatmap"><thead><tr><th />{buckets.map((b) => <th key={b.k} className="mono text-[10px]">{b.label}</th>)}</tr></thead><tbody>{heat.map((h) => <tr key={h.q}><th scope="row">{h.q}</th>{h.cells.map((n, i) => <td key={i} title={`${h.q} ${buckets[i].label}: ${n}`} style={{ background: `rgba(233,142,46,${n / heatMax})` }}>{n || ""}</td>)}</tr>)}</tbody></table></div>
          </Card>
          <Card title="Queue performance" sub="Closed legs by queue" wide>
            <div className="sc-scroll"><table className="sc-table"><thead><tr><th>Queue</th><th>Legs</th><th>Answered</th><th>Abandoned</th><th>Callback</th><th>Overflow out</th><th>SL</th><th>ASA</th><th>AHT</th></tr></thead><tbody>{byQueue.map((q) => <tr key={q.q} data-testid={`row-report-queue-${slug(q.q)}`}><th scope="row">{q.q}</th><td>{q.legs}</td><td>{q.answered}</td><td>{q.abandoned}</td><td>{q.callback}</td><td>{q.overflow}</td><td>{pct(q.sl, 0)}</td><td>{secs(q.asa)}</td><td>{secs(q.aht)}</td></tr>)}</tbody></table></div>
          </Card>
          <Card title="Agent performance" sub="Answered legs attributed at disconnect" wide>
            <div className="sc-scroll max-h-64"><table className="sc-table"><thead><tr><th>Agent</th><th>Handled</th><th>AHT</th><th>Avg talk</th><th>Avg ACW</th></tr></thead><tbody>{byAgent.map((a) => <tr key={a.id}><th scope="row">{agentName(snap, a.id)}</th><td>{a.n}</td><td>{secs(a.aht)}</td><td>{secs(a.talk)}</td><td>{secs(a.acw)}</td></tr>)}</tbody></table></div>
          </Card>
        </div>
      )}
      <p className="sc-fine">{METRIC_NOTES.cohort} {METRIC_NOTES.aht} These charts are lab visualizations, not native Amazon Connect dashboards.</p>
    </div>
  );
}
function Card({ title, sub, children, wide }: { title: string; sub: string; children: React.ReactNode; wide?: boolean }) {
  return <figure className={`sc-chart ${wide ? "is-wide" : ""}`} data-testid={`chart-${slug(title)}`}><figcaption><b>{title}</b><span>{sub}</span></figcaption>{children}</figure>;
}

type ANode = { id: string; label: string[]; x: number; y: number; kind: "n" | "c"; detail: string };
type AArch = { name: string; nodes: ANode[]; edges: [string, string][]; text: string; src: string[] };
const N = (id: string, label: string[], x: number, y: number, kind: "n" | "c", detail: string): ANode => ({ id, label, x, y, kind, detail });
const CONNECT = N("connect", ["Amazon", "Connect"], 80, 150, "n", "Source of contacts, agent activity and metrics. Each downstream path below is configured independently.");
const ARCH: Record<"native" | "realtime" | "custom" | "bi", AArch> = {
  native: { name: "Native Reporting Architecture", text: "Real-time reports and historical reports are separate native surfaces read directly from Amazon Connect, not a pipeline from one into the other. Dashboards have surface-specific refresh rates; access requires security-profile permissions.", src: ["realtime", "historical", "dashboards", "permissions"],
    nodes: [CONNECT, N("rt", ["Real-time", "metrics reports"], 300, 60, "n", "Current queue and agent state, refreshed about every 15 seconds."), N("hist", ["Historical", "metrics reports"], 300, 150, "n", "Interval metrics; contact-record metrics attribute at disconnect."), N("dash", ["Native", "dashboards"], 300, 240, "n", "Dashboard widgets; time-series widgets can refresh every 15 minutes."), N("sup", ["Supervisor"], 540, 150, "n", "Uses whichever native surface their permissions allow.")],
    edges: [["connect", "rt"], ["connect", "hist"], ["connect", "dash"], ["rt", "sup"], ["hist", "sup"], ["dash", "sup"]] },
  realtime: { name: "Real-Time Event Architecture", text: "Three parallel, independently configured sources: agent event streams to Kinesis Data Streams, contact events to EventBridge, and a subset of instance metrics to CloudWatch. An optional custom consumer reads them and feeds a custom wallboard. None feeds another automatically.", src: ["agents", "events", "cloudwatch", "rules"],
    nodes: [CONNECT, N("kin", ["Agent event stream", "(Kinesis)"], 300, 50, "n", "Agent state change events streamed to a Kinesis data stream you configure."), N("eb", ["Contact events", "(EventBridge)"], 300, 150, "n", "Contact lifecycle events consumable through EventBridge rules."), N("cw", ["CloudWatch", "instance metrics"], 300, 250, "n", "A separate subset of instance metrics, not a mirror of every report metric."), N("fn", ["Custom consumer", "(e.g. Lambda)"], 540, 150, "c", "Customer-built code that reads one or more sources and aggregates state."), N("wall", ["Custom", "wallboard"], 760, 150, "c", "Customer-built display; freshness depends on the consumer.")],
    edges: [["connect", "kin"], ["connect", "eb"], ["connect", "cw"], ["kin", "fn"], ["eb", "fn"], ["cw", "fn"], ["fn", "wall"]] },
  custom: { name: "Custom Analytics Architecture", text: "Two independent record paths: a contact-record export to a customer S3 bucket, and the separately enabled analytics data lake (delayed analytical data). Customer S3 does not populate the data lake. Custom queries and models sit on either.", src: ["records", "lake"],
    nodes: [CONNECT, N("ctr", ["Contact", "records"], 270, 150, "n", "Per-contact records described by the contact record data model."), N("s3", ["Export to", "customer S3"], 480, 80, "n", "Configured data export into a customer-owned bucket."), N("lake", ["Analytics", "data lake"], 480, 220, "n", "Separately enabled, delayed analytical tables; not instantaneous telemetry."), N("q", ["Custom queries", "and models"], 720, 150, "c", "Customer-built SQL, cohorts or forecasts.")],
    edges: [["connect", "ctr"], ["ctr", "s3"], ["ctr", "lake"], ["s3", "q"], ["lake", "q"]] },
  bi: { name: "External BI Integration", text: "An external BI platform reads the data lake or exported records through a customer-built query layer. CloudWatch instance metrics are a separate operational path for alarms, not a reporting mirror.", src: ["lake", "cloudwatch", "regions"],
    nodes: [CONNECT, N("lake", ["Analytics", "data lake"], 300, 80, "n", "Delayed analytical data, separately enabled."), N("cw", ["CloudWatch", "instance metrics"], 300, 230, "n", "Operational subset suitable for alarms."), N("ql", ["Customer", "query layer"], 520, 80, "c", "Custom access layer with its own permissions."), N("bi", ["External", "BI tool"], 740, 80, "c", "Executive dashboards outside Amazon Connect."), N("ops", ["Ops alarms", "(optional)"], 520, 230, "c", "Custom alarms or notifications.")],
    edges: [["connect", "lake"], ["connect", "cw"], ["lake", "ql"], ["ql", "bi"], ["cw", "ops"]] },
};
export type ArchKey = keyof typeof ARCH;
export function ReportingArchitectureExplorer(props: { Sources: (p: { keys: string[] }) => React.ReactElement }) {
  return (
    <DiagramFrame testId="supervisor-reporting" text={(a) => (Object.keys(ARCH) as ArchKey[]).map((k) => { const x = ARCH[k]; const nm = (id: string) => x.nodes.find((n) => n.id === id)?.label.join(" ") ?? id; return (
      <div key={k}><h4>{x.name}</h4>{a === "technical" && <p className="mb-1 text-xs">{x.text}</p>}
        <EdgeList audience={a} items={x.edges.map(([f, t]) => ({ from: nm(f), to: nm(t), note: a === "technical" ? (x.nodes.find((n) => n.id === t)?.kind === "c" ? "custom" : "native") : undefined }))} /></div>); })}>
      <ReportingArchitectureArt {...props} />
    </DiagramFrame>
  );
}
function ReportingArchitectureArt({ Sources }: { Sources: (p: { keys: string[] }) => React.ReactElement }) {
  const [k, setK] = useState<ArchKey>("native");
  const [node, setNode] = useState("connect");
  const a = ARCH[k];
  const sel = a.nodes.find((n) => n.id === node) ?? a.nodes[0];
  const by = (id: string) => a.nodes.find((n) => n.id === id)!;
  return (
    <div className="sc-arch" data-testid="panel-architecture">
      <div className="flex flex-wrap gap-1.5" role="tablist">{(Object.keys(ARCH) as ArchKey[]).map((x) => <button key={x} type="button" role="tab" aria-selected={k === x} className={`room-pill ${k === x ? "is-on" : ""}`} onClick={() => { setK(x); setNode("connect"); }} data-testid={`tab-arch-${x}`}>{ARCH[x].name}</button>)}</div>
      <div className="sc-scroll">
        <svg viewBox="0 0 860 300" className="sc-arch-svg" role="img" aria-label={`${a.name}: parallel paths from Amazon Connect`}>
          <defs><marker id="sc-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#11110D" /></marker></defs>
          {a.edges.map(([f, t]) => { const A = by(f), B = by(t); const x1 = A.x + 70, x2 = B.x - 72, mx = (x1 + x2) / 2; return <path key={f + t} d={`M${x1} ${A.y} C${mx} ${A.y} ${mx} ${B.y} ${x2} ${B.y}`} className="sc-path is-anim" markerEnd="url(#sc-arrow)" />; })}
          {a.nodes.map((n) => (
            <g key={n.id} className={`sc-anode ${n.kind === "c" ? "is-custom" : ""} ${sel.id === n.id ? "is-sel" : ""}`} tabIndex={0} role="button" aria-label={`${n.label.join(" ")}, ${n.kind === "c" ? "custom" : "native"}`} onClick={() => setNode(n.id)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setNode(n.id)} data-testid={`node-arch-${n.id}`}>
              <rect x={n.x - 70} y={n.y - 32} width={140} height={64} rx={12} />
              {n.label.map((l, i) => <text key={i} x={n.x} y={n.y - 8 + i * 15} textAnchor="middle">{l}</text>)}
              <text x={n.x} y={n.y + 24} textAnchor="middle" className="sc-svg-s">{n.kind === "c" ? "custom" : "native"}</text>
            </g>
          ))}
        </svg>
      </div>
      <div className="sc-box"><p className="font-semibold">{sel.label.join(" ")} <Badge kind={sel.kind === "c" ? "custom" : "native"} /></p><p className="mt-1 text-sm">{sel.detail}</p><p className="mt-2 text-sm opacity-80">{a.text}</p></div>
      <Sources keys={a.src} />
    </div>
  );
}

const ESC = ["Customer enters Technical Support", "Contact waits in queue", "Agent accepts the contact", "Customer requests escalation", "Supervisor receives illustrative notification", "Supervisor reviews contact and ticket context", "Escalation handled by configured workflow", "Customer issue is resolved", "Interaction outcome is recorded"];
const ESC_KIND: ("native" | "custom" | "conceptual" | "config")[] = ["native", "native", "native", "conceptual", "custom", "conceptual", "config", "native", "custom"];
export function ZendeskSupervisorExperience() {
  const { snap, apply } = useSupervisor();
  const step = snap.escalation.step;
  const c = snap.escalation.contactId ? snap.contacts.find((x) => x.id === snap.escalation.contactId) : undefined;
  const [blocked, setBlocked] = useState<string | null>(null);
  const advance = () => {
    const before = snap.escalation.step; let after: typeof snap | null = null;
    const ok = apply((s) => { const n = intervene(s, "escalation-step"); after = n; return n; }, before >= 9 ? "Escalation walkthrough restarted" : `Escalation step ${before + 1}: ${ESC[before] ?? ""}`);
    const a = after as typeof snap | null;
    setBlocked(ok && a && a.escalation.step === before ? a.log[a.log.length - 1]?.text ?? "Step could not advance at this moment." : null);
  };
  const [disp, setDisp] = useState("Resolved after specialist escalation");
  return (
    <div className="sc-zd" data-testid="panel-zendesk">
      <ol className="sc-esc">{ESC.map((t, i) => <li key={t} className={i + 1 < step ? "is-past" : i + 1 === step ? "is-on" : ""} data-testid={`step-escalation-${i + 1}`}><span className="mono">{i + 1}</span><span>{t}</span><Badge kind={ESC_KIND[i]} /></li>)}</ol>
      <div className="sc-zd-main">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="depot-btn depot-btn-ink" onClick={advance} data-testid="button-escalation-next">{step === 0 ? "Start escalation" : step >= 9 ? "Run again" : `Advance to step ${step + 1}`}</button>
          <button type="button" className="depot-btn depot-btn-ghost" disabled={step === 0} onClick={() => { setBlocked(null); apply((s) => intervene(s, "escalation-reset"), "Escalation walkthrough reset"); }} data-testid="button-escalation-reset">Restart</button>
        </div>
        {blocked && <p className="sc-err" role="status" data-testid="text-escalation-blocked">Step {step + 1} did not advance: {blocked} The shared clock still moved 10 simulated seconds.</p>}
        <SimulationCaption title={step === 0 ? "Ready for escalation" : ESC[Math.min(step, ESC.length) - 1]} step={`Step ${step} of ${ESC.length}`}>{blocked ?? c?.timeline.at(-1)?.text ?? "Start escalation to follow the simulated agent workflow."}</SimulationCaption>
        <div className="sc-zd-ui">
          <div className="sc-zd-bar"><b>Support</b><span>Views</span><span>Contact center</span><span className="ml-auto mono text-xs">{clockLabel(snap.clock)}</span></div>
          {c ? (
            <div className="sc-zd-grid">
              <section><span className="eyebrow">Ticket {c.ticket}</span><h4 className="text-lg font-semibold">{c.intent}</h4><p className="text-sm">Channel {c.channel} · queue {c.queue} · status <b data-testid="text-escalation-status">{c.status}</b></p>
                <ol className="sc-log mt-2">{c.timeline.map((t, i) => <li key={i}><span className="mono">{clockLabel(t.at)}</span> {t.text}</li>)}</ol></section>
              <section><span className="eyebrow">Agent activity</span><p className="text-sm">{agentName(snap, c.agent)}{c.agent ? ` · ${snap.agents.find((a) => a.id === c.agent)?.state}` : ""}</p>
                <span className="eyebrow mt-3 block">Contact history</span><p className="text-sm">{c.legs.map((l) => `${l.queue}${l.reason ? ` (${l.reason})` : ""}`).join(" to ")}</p>
                <span className="eyebrow mt-3 block">Operational context</span><p className="text-sm">{snap.contacts.filter((x) => x.queue === "Technical Support" && x.status === "Waiting").length} waiting in Technical Support · alerts {snap.alerts.filter((a) => a.state === "Warning" || a.state === "Critical").length}</p>
                <span className="eyebrow mt-3 block">Quality insight (conceptual)</span><p className="text-sm">Hold {secs(c.hold)} · talk {secs(c.talk)}. Contact Lens and Zendesk QA are separate, optional products.</p>
                {step >= 8 && <div className="mt-3 grid gap-2"><label className="sc-field"><span>Disposition</span><input value={disp} onChange={(e) => setDisp(e.target.value)} data-testid="input-disposition" /></label>
                  <div className="flex flex-wrap gap-2"><button type="button" className="room-pill" onClick={() => apply((s) => intervene(s, "disposition", { contactId: c.id, value: disp }), "Disposition recorded")} data-testid="button-record-disposition">Record disposition</button>
                  <button type="button" className="room-pill" onClick={() => apply((s) => intervene(s, "follow-up", { contactId: c.id, value: "Follow up in 24 hours" }), "Follow-up created")} data-testid="button-follow-up">Create follow-up</button></div>
                  {(c.disposition || c.followUp) && <p className="text-xs">Recorded: {c.disposition ?? DASH} · {c.followUp ?? "No follow-up"}</p>}</div>}
              </section>
            </div>
          ) : <div className="sc-empty">Start the escalation to create a fictional Technical Support contact in the shared simulation.</div>}
        </div>
        <p className="sc-fine">The illustrated workspace is conceptual. Native Zendesk Contact Center, native Amazon Connect, supported integration features and custom patterns are labelled per step. The Zendesk Tickets API is a separate surface and does not prove automatic supervisor integration.</p>
      </div>
    </div>
  );
}
