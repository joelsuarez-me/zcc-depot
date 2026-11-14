import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { CC_ALL, CC_DATA, CC_DATES, CC_QUEUES, advanceCc, ccMetrics, dayLabel, filterCc, fmt12, type CcFilter } from "@/lib/callback-engine";
import { SCENARIOS, scenarioById } from "@/data/callback-scenarios";

function Count({ v, suffix = "" }: { v: number; suffix?: string }) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(v);
  const from = useRef(v);
  useEffect(() => {
    if (reduce) { setN(v); from.current = v; return; }
    const start = from.current; let raf = 0; const t0 = performance.now();
    const step = (t: number) => { const k = Math.min(1, (t - t0) / 600); setN(start + (v - start) * (1 - Math.pow(1 - k, 3))); if (k < 1) raf = requestAnimationFrame(step); else from.current = v; };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [v, reduce]);
  return <>{Number.isInteger(v) ? Math.round(n) : n.toFixed(1)}{suffix}</>;
}

export function CallbackCommandCenter() {
  const [f, setF] = useState<CcFilter>(CC_ALL);
  const [rows, setRows] = useState(CC_DATA);
  const [live, setLive] = useState(false);
  const [updates, setUpdates] = useState(0);
  useEffect(() => {
    if (!live) return;
    const timer = setInterval(() => { setRows(advanceCc); setUpdates(n => n + 1); }, 2500);
    return () => clearInterval(timer);
  }, [live]);
  const m = useMemo(() => ccMetrics(filterCc(f, rows)), [f, rows]);
  const set = (k: keyof CcFilter, v: string) => setF((x) => ({ ...x, [k]: v }));
  const maxT = Math.max(1, ...m.timeline.map((t) => t.scheduled + t.active + t.done + t.failed));
  const tiles: [string, number, string?][] = [["Pending", m.pending], ["Scheduled", m.scheduled], ["In queue", m.queued], ["In progress", m.progress], ["Completed", m.completed], ["Failed or expired", m.failed], ["Success rate", m.success, "%"], ["Avg callback delay", m.avgDelay, " min"]];
  return (
    <div className="cb-cc" data-testid="command-center">
      <div className="cb-cc-filters" role="group" aria-label="Filters">
        <Sel label="Type" v={f.type} on={(v) => set("type", v)} opts={SCENARIOS.map((s) => [s.id, s.title])} id="type" />
        <Sel label="Status" v={f.status} on={(v) => set("status", v)} opts={["Pending", "Scheduled", "Queued", "Dialing", "Connected", "Completed", "Failed", "Expired"].map((s) => [s, s])} id="status" />
        <Sel label="Queue" v={f.queue} on={(v) => set("queue", v)} opts={CC_QUEUES.map((q) => [q, q])} id="queue" />
        <Sel label="Date" v={f.date} on={(v) => set("date", v)} opts={CC_DATES.map((d) => [d, dayLabel(d)])} id="date" />
        <Sel label="Tier" v={f.tier} on={(v) => set("tier", v)} opts={["Standard", "Gold", "VIP"].map((t) => [t, t])} id="tier" />
        <button type="button" className="cb-link" onClick={() => setF(CC_ALL)} data-testid="button-cc-clear">Clear filters</button>
        <span className="cb-sim">Simulated demonstration data · {m.total} callbacks</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
        <button type="button" className="cb-link" aria-pressed={live} onClick={() => setLive(v => !v)} data-testid="button-cc-live">{live ? "Pause" : "Start"} simulated activity</button>
        <button type="button" className="cb-link" onClick={() => { setRows(advanceCc); setUpdates(n => n + 1); }} data-testid="button-cc-advance">Next activity</button>
        <button type="button" className="cb-link" onClick={() => { setLive(false); setRows(CC_DATA); setUpdates(0); }} data-testid="button-cc-reset">Reset activity</button>
        <span role="status" data-testid="text-cc-updates">{updates} simulated activity updates · no external systems connected</span>
      </div>
      <div className="cb-tiles">{tiles.map(([l, v, s]) => <div key={l} className="cb-tile" data-testid={`metric-${l.toLowerCase().replace(/\s+/g, "-")}`}><span>{l}</span><b><Count v={v} suffix={s} /></b></div>)}</div>
      <div className="cb-cc-grid">
        <div className="cb-cc-box"><h4 className="cb-mini">Lifecycle funnel</h4>
          {m.funnel.map(([l, v]) => <div key={l} className="cb-fun"><span>{l}</span><i style={{ transform: `scaleX(${m.total ? v / m.total : 0})` }} /><b className="mono">{v}</b></div>)}
        </div>
        <div className="cb-cc-box"><h4 className="cb-mini">Scheduling timeline (by request hour, ET)</h4>
          <div className="cb-tline">{m.timeline.map((t) => <div key={t.h} className="cb-tcol" title={`${fmt12(t.h * 60)}: ${t.scheduled} scheduled, ${t.active} active, ${t.done} done, ${t.failed} failed`}>
            <div className="cb-tstack" style={{ height: `${((t.scheduled + t.active + t.done + t.failed) / maxT) * 100}%` }}>{([["done", t.done], ["active", t.active], ["scheduled", t.scheduled], ["failed", t.failed]] as [string, number][]).map(([k, v]) => v ? <i key={k} className={`k-${k}`} style={{ flexGrow: v }} /> : null)}</div><span>{t.h > 12 ? t.h - 12 : t.h}</span></div>)}</div>
          <p className="cb-key"><i className="k-done" />Completed<i className="k-active" />Active<i className="k-scheduled" />Scheduled or pending<i className="k-failed" />Failed</p>
        </div>
        <div className="cb-cc-box"><h4 className="cb-mini">Activity feed</h4>
          <ol className="cb-feed" aria-live="polite">{m.feed.map((r) => <li key={r.id} data-testid={`feed-${r.id}`}><span className={`cb-dot d-${r.status}`} /><span className="mono text-[0.7rem]">{dayLabel(r.date)} {fmt12(r.requested)}</span><span className="min-w-0 truncate">{r.customer} · {scenarioById(r.type)?.title}</span><b>{r.status}</b></li>)}{!m.feed.length && <li className="opacity-60">No callbacks match these filters.</li>}</ol>
        </div>
      </div>
    </div>
  );
}

function Sel({ label, v, on, opts, id }: { label: string; v: string; on: (v: string) => void; opts: string[][]; id: string }) {
  return <label className="rt-field"><span className="text-[0.7rem] font-semibold">{label}</span><select value={v} onChange={(e) => on(e.target.value)} data-testid={`filter-${id}`}><option value="all">All</option>{opts.map(([a, b]) => <option key={a} value={a}>{b}</option>)}</select></label>;
}
