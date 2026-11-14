import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Download, RotateCcw } from "lucide-react";
import { ALL, DAYS, DAY_LABEL, DEFAULT_DFILTERS, agentProductivity, byMode, channelDelivery, computeKpis, dataset, exclusions, filterRows, fmtKpi, funnel, geography, options, outcomes, overTime, toCsv, type DFilters } from "@/lib/outbound-dashboard";
import { FullscreenButton, Tag } from "./OutboundShared";

const C = ["#03363D", "#D1F470", "#E8A33D", "#8EC5C9", "#C2412A", "#9267C6", "#5FB37A"];
function Bars({ data, label }: { data: { k: string; v: number; tone?: string }[]; label: string }) {
  const max = Math.max(1, ...data.map((d) => d.v));
  return <svg viewBox={`0 0 320 ${data.length * 42 + 18}`} role="img" aria-label={label}>{data.map((d, i) => <g key={d.k} transform={`translate(0,${i * 42})`}><title>{d.k}: {d.v.toLocaleString()}</title><text x={0} y={13}>{d.k}</text><text x={315} y={13} textAnchor="end" fontWeight={700}>{d.v.toLocaleString()}</text><rect x={0} y={22} width={315} height={12} rx={4} fill="#E9ECE5" /><rect className="ob-bar-h" x={0} y={22} width={(d.v / max) * 315} height={12} rx={4} fill={d.tone ?? C[0]} /></g>)}<text x={0} y={data.length * 42 + 12}>0</text><text x={315} y={data.length * 42 + 12} textAnchor="end">{max.toLocaleString()}</text></svg>;
}
function OutcomeDonut({ data }: { data: ReturnType<typeof outcomes> }) {
  const sorted = [...data].sort((a, b) => b.count - a.count);
  const top = sorted.slice(0, 4);
  const other = sorted.slice(4).reduce((n, x) => n + x.count, 0);
  const slices = other ? [...top, { outcome: "Other outcomes", count: other }] : top;
  const total = data.reduce((n, x) => n + x.count, 0);
  let offset = 0;
  return <div data-testid="chart-outcome-donut">
    <svg viewBox="0 0 320 170" role="img" aria-label={`Contact outcome distribution, ${total.toLocaleString()} fictional contacts`}>
      <circle cx={160} cy={78} r={52} fill="none" stroke="#E9ECE5" strokeWidth={22} />
      {slices.map((slice, i) => {
        const length = total ? slice.count / total * 100 : 0;
        const start = offset; offset += length;
        return <circle key={slice.outcome} cx={160} cy={78} r={52} fill="none" stroke={C[i]} strokeWidth={22} pathLength={100} strokeDasharray={`${length} ${100 - length}`} strokeDashoffset={-start} transform="rotate(-90 160 78)"><title>{slice.outcome}: {slice.count.toLocaleString()} ({total ? (slice.count / total * 100).toFixed(1) : "0"}%)</title></circle>;
      })}
      <text x={160} y={78} textAnchor="middle" style={{ fontSize: 22, fill: "#11110D" }} fontWeight={700}>{total.toLocaleString()}</text>
      <text x={160} y={95} textAnchor="middle">contacts</text>
    </svg>
    <ul className="grid gap-1.5 text-xs">{slices.map((slice, i) => <li key={slice.outcome} className="flex items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded" style={{ background: C[i] }} /><span>{slice.outcome}</span><b className="ml-auto">{slice.count.toLocaleString()}</b></li>)}</ul>
    <details className="mt-3 text-xs"><summary className="cursor-pointer underline">Every outcome and count</summary><table className="mt-2 w-full"><tbody>{data.map((x) => <tr key={x.outcome}><th className="py-1 text-left font-normal">{x.outcome}</th><td className="text-right">{x.count.toLocaleString()}</td></tr>)}</tbody></table></details>
  </div>;
}
function Chart({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) { return <figure className="ob-chart"><figcaption className="mb-2 flex items-center gap-2 text-sm font-semibold">{title}<Tag k="custom">custom-derived</Tag></figcaption>{children}{note && <p className="mt-1 text-[0.66rem] opacity-60">{note}</p>}</figure>; }

export function OutboundCommandCenter() {
  const rows = useMemo(() => dataset(), []);
  const opts = useMemo(() => options(rows), [rows]);
  const [f, setF] = useState<DFilters>(DEFAULT_DFILTERS);
  const fr = useMemo(() => filterRows(rows, f), [rows, f]);
  const kpis = useMemo(() => computeKpis(fr, f.to - f.from + 1), [fr, f]);
  const ot = useMemo(() => overTime(fr, f), [fr, f]);
  const [notifyOn, setNotifyOn] = useState(false);
  const [threshold, setThreshold] = useState(3);
  const [alerts, setAlerts] = useState<string[]>([]);
  const abandon = kpis.find((k) => k.id === "abandon")!.value;
  const lastAlert = useRef("");
  useEffect(() => {
    if (abandon === null || abandon * 100 <= threshold) return;
    const msg = `Abandonment ${(abandon * 100).toFixed(1)}% exceeds ${threshold}% for the current filter`;
    if (lastAlert.current === msg) return; lastAlert.current = msg;
    setAlerts((a) => [msg, ...a].slice(0, 5));
  }, [abandon, threshold]);
  const download = () => { const b = new Blob([toCsv(fr, f)], { type: "text/csv" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "outbound-simulated-dashboard.csv"; a.click(); URL.revokeObjectURL(u); };
  const sel = (k: keyof DFilters, label: string, vals: string[]) => <label className="ob-field" htmlFor={`df-${k}`}><span>{label}</span><select id={`df-${k}`} className="ob-input !py-1 text-xs" value={String(f[k])} onChange={(e) => setF((x) => ({ ...x, [k]: e.target.value }))} data-testid={`select-df-${k}`}><option value={ALL}>All</option>{vals.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>;
  const maxOt = Math.max(1, ...ot.map((d) => d.attempts));
  const pts = (key: "attempts" | "answered" | "connected") => ot.map((d, i) => `${40 + (i * 260) / Math.max(1, ot.length - 1)},${130 - (d[key] / maxOt) * 110}`).join(" ");
  const ap = agentProductivity(fr, f.to - f.from + 1); const apMax = Math.max(1, ...ap.map((a) => a.talkMin + a.acwMin + a.availMin));
  const fn = funnel(fr); const geo = geography(fr);
  return (
    <div id="command-center-board" className="ob-fs grid gap-4">
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-9">
        {sel("campaign", "Campaign", opts.campaign)}
        <label className="ob-field" htmlFor="df-range"><span>Date range</span><select id="df-range" className="ob-input !py-1 text-xs" value={`${f.from}-${f.to}`} onChange={(e) => { const [a, b] = e.target.value.split("-").map(Number); setF((x) => ({ ...x, from: a, to: b })); }} data-testid="select-df-range"><option value={`0-${DAYS - 1}`}>All 14 days</option><option value={`${DAYS - 7}-${DAYS - 1}`}>Last 7 days</option><option value={`${DAYS - 1}-${DAYS - 1}`}>{DAY_LABEL(DAYS - 1)}</option></select></label>
        {sel("mode", "Dialing mode", opts.mode)}{sel("channel", "Channel", opts.channel)}{sel("queue", "Queue", opts.queue)}{sel("agent", "Agent", opts.agent)}{sel("segment", "Segment", opts.segment)}{sel("region", "Region", opts.region)}{sel("outcome", "Outcome", opts.outcome)}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs opacity-70" data-testid="text-dashboard-rows">{fr.length.toLocaleString()} fictional records</span>
        <button type="button" className="ob-btn" onClick={() => setF(DEFAULT_DFILTERS)} data-testid="button-df-reset"><RotateCcw className="h-3.5 w-3.5" aria-hidden />Reset filters</button>
        <button type="button" className="ob-btn" onClick={download} data-testid="button-df-csv"><Download className="h-3.5 w-3.5" aria-hidden />Export CSV</button>
        <button type="button" className="ob-btn" aria-pressed={notifyOn} onClick={() => setNotifyOn((v) => !v)} data-testid="button-df-notify"><Bell className="h-3.5 w-3.5" aria-hidden />{notifyOn ? "Hide simulated web notification" : "Preview simulated web notification"}</button>
        <label className="flex items-center gap-1 text-xs">Alert when abandonment &gt;<input type="number" className="ob-input !w-16 !py-1" min={0} max={50} step={0.5} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} data-testid="input-df-threshold" />%</label>
        <span className="ml-auto"><FullscreenButton target="command-center-board" testid="command-center" /></span>
      </div>
      {notifyOn && <div className="ml-auto w-full max-w-sm rounded-2xl border border-[#11110D]/15 bg-[#FBFBF8] p-3 shadow-lg" role="status" data-testid="preview-web-notification"><span className="ob-h">Web notification channel · simulated preview</span><b className="block text-sm">Meridian Mutual · Renewal reminder</b><p className="text-xs opacity-75">Your policy renews in 21 days. Review options or request a call.</p><p className="mt-1 text-[0.66rem] opacity-60">Rendered inline only. No browser permission is requested and nothing is sent. {alerts[0] ? `Latest ops alert: ${alerts[0]}.` : ""}</p></div>}
      {alerts.length > 0 && <ul className="ob-warnbox text-xs" aria-live="polite" data-testid="list-df-alerts">{alerts.map((a, i) => <li key={i}>{a}</li>)}</ul>}
      <div className="ob-kpis">{kpis.map((k) => <div key={k.id} className="ob-kpi" data-testid={`kpi-${k.id}`}><span className="lbl">{k.label}</span><b>{fmtKpi(k)}</b><span className="der">{k.derivation}{k.native ? ` · ref: ${k.native}` : " · custom-derived"}</span></div>)}</div>
      <div id="campaign-charts" className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-4">
        <Chart title="Progress over time"><svg viewBox="0 0 320 155" role="img" aria-label="Voice attempts, answered and connected per day">{[0, .5, 1].map((part) => <g key={part}><line x1={40} x2={300} y1={130 - part * 110} y2={130 - part * 110} stroke="#DCE1D8" /><text x={35} y={134 - part * 110} textAnchor="end">{Math.round(part * maxOt)}</text></g>)}{(["attempts", "answered", "connected"] as const).map((k, i) => <polyline key={k} points={pts(k)} fill="none" stroke={C[i === 1 ? 3 : i === 2 ? 6 : 0]} strokeWidth={2.2} />)}<text x={40} y={150}>{ot[0]?.label}</text><text x={300} y={150} textAnchor="end">{ot[ot.length - 1]?.label}</text></svg><p className="text-[0.66rem] opacity-60">Daily voice counts · kale attempts · sky answered · green connected</p></Chart>
        <Chart title="Performance by dialing mode"><Bars label="Dials by mode" data={byMode(fr).map((m, i) => ({ k: `${m.mode} ${m.humanRate === null ? "" : (m.humanRate * 100).toFixed(0) + "%"}`, v: m.dials, tone: C[i] }))} /></Chart>
        <Chart title="Outcome distribution"><OutcomeDonut data={outcomes(fr)} /></Chart>
        <Chart title="Agent productivity" note="Minutes: kale talk · amber ACW · sky modeled availability. Assumes a dedicated 8h/day across the selected range, not observed agent availability."><svg viewBox={`0 0 320 ${ap.length * 42 + 6}`} role="img" aria-label="Connected calls and agent productivity">{ap.map((a, i) => { const w = (v: number) => (v / apMax) * 315; return <g key={a.agent} transform={`translate(0,${i * 42})`}><title>{a.agent}: {a.connected} connected calls; {a.talkMin.toFixed(1)} talk, {a.acwMin.toFixed(1)} ACW, {a.availMin.toFixed(1)} modeled available minutes</title><text x={0} y={13}>{a.agent}</text><text x={315} y={13} textAnchor="end">{a.connected} calls</text><rect x={0} y={22} width={w(a.talkMin)} height={12} fill={C[0]} /><rect x={w(a.talkMin)} y={22} width={w(a.acwMin)} height={12} fill={C[2]} /><rect x={w(a.talkMin + a.acwMin)} y={22} width={w(a.availMin)} height={12} fill={C[3]} /></g>; })}</svg></Chart>
        <Chart title="Campaign funnel"><Bars label="Funnel" data={fn.map((x) => ({ k: x.k, v: x.v }))} /></Chart>
        <Chart title="Channel delivery"><Bars label="Channel success" data={channelDelivery(fr).map((c, i) => ({ k: `${c.channel} ${c.rate === null ? "—" : (c.rate * 100).toFixed(0) + "%"}`, v: c.success, tone: C[(i + 1) % C.length] }))} /></Chart>
        <Chart title="Exclusions and suppression"><Bars label="Exclusions" data={exclusions(fr).map((e) => ({ k: e.reason, v: e.count, tone: e.suppression ? C[4] : C[2] }))} /></Chart>
        <Chart title="Geography and time zones"><Bars label="Completions by region" data={geo.map((g) => ({ k: `${g.region} · ${g.tz}`, v: g.completed, tone: C[3] }))} /></Chart>
      </div>
      <p className="text-xs opacity-60">All tiles and charts read one fictional dataset. Metrics are custom-derived teaching values; reference names point to native dashboard or GetMetricDataV2 concepts where verified.</p>
    </div>
  );
}
