import { DiagramFrame, EdgeList } from "@/components/diagram-view-controls";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Pause, Play, RotateCcw, SkipForward, Headset, Search, UserCheck, AudioWaveform, BarChart3, Webhook, KeyRound, PhoneCall, IdCard, Database, Cpu, Boxes, ScrollText, FileText, ListChecks, type LucideIcon } from "lucide-react";
import {
  CLOUDS, KIND_META, STAGE_MS, SYS_EDGES, SYS_FLOWS, SYS_NODES, VIEW,
  edgeById, edgesForNode, flowById, flowNodes, flowsForNode, nodeById, stepAt, timelineMs, elapsedFor,
  type EdgeKind,
} from "@/data/system-flow";
import "./system-data-flow.css";

const KC: Record<EdgeKind, string> = { auth: "var(--k-auth)", controls: "var(--k-controls)", context: "var(--k-context)", records: "var(--k-records)" };
const KH: Record<EdgeKind, string> = { auth: "#52665D", controls: "#2D683C", context: "#167567", records: "#986321" };
const TRAIL = [0, 0.05, 0.1];
const PAUSE_AT = 0.62;
const ICONS: Record<string, LucideIcon> = { zcc: Headset, ticket: Search, status: UserCheck, analysis: AudioWaveform, reporting: BarChart3, lambda: Webhook, cognito: KeyRound, connect: PhoneCall, profiles: IdCard, internal: Database, events: Cpu, direct: Boxes, logs: ScrollText, transcripts: FileText, ctr: ListChecks };

function useReduced() {
  const [r, setR] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const f = () => setR(m.matches);
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return r;
}

export function SystemDataFlow() {
  const name = (id: string) => SYS_NODES.find((n) => n.id === id)?.t ?? id;
  return (
    <DiagramFrame testId="system-data-flow" dark showMotion={false}
      text={(a) => <EdgeList audience={a} items={SYS_EDGES.map((e) => ({ from: name(e.from), to: name(e.to), label: e.label, note: e.optional ? "optional or configuration-dependent" : undefined }))} />}>
      <SystemDataFlowDiagram />
    </DiagramFrame>
  );
}

function SystemDataFlowDiagram() {
  const reduced = useReduced();
  const [flow, setFlow] = useState<string | null>(null);
  const [node, setNode] = useState<string | null>(null);
  const [playing, setPlaying] = useState(!reduced);
  const [stepIdx, setStepIdx] = useState(0);
  const elapsed = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pathRefs = useRef<Record<string, SVGPathElement | null>>({});
  const pktRefs = useRef<Record<string, SVGGElement | null>>({});
  const [live, setLive] = useState(true);
  const flowRef = useRef(flow); flowRef.current = flow;
  const playRef = useRef(playing); playRef.current = playing;
  const lastIdx = useRef(-1);

  useEffect(() => {
    const pane = scrollRef.current;
    const workspace = nodeById("zcc")!;
    if (pane && window.matchMedia("(max-width: 767px)").matches) {
      pane.scrollLeft = Math.max(0, workspace.x + workspace.w / 2 - pane.clientWidth / 2);
    }
  }, []);

  useEffect(() => { if (reduced) setPlaying(false); }, [reduced]);

  const paint = () => {
    const s = stepAt(flowRef.current, elapsed.current);
    if (s.index !== lastIdx.current) { lastIdx.current = s.index; setStepIdx(s.index); }
    const p = s.progress;
    SYS_EDGES.forEach((e) => {
      const g = pktRefs.current[e.id]; const path = pathRefs.current[e.id];
      if (!g || !path) return;
      const on = s.edges.includes(e.id);
      g.style.opacity = on ? "1" : "0";
      if (!on) return;
      const L = path.getTotalLength();
      Array.from(g.children).forEach((c, i) => {
        const q = Math.max(0, Math.min(1, p - TRAIL[i])) * L;
        const pt = path.getPointAtLength(q);
        const pt2 = path.getPointAtLength(Math.min(L, q + 1));
        const a = (Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * 180) / Math.PI;
        c.setAttribute("transform", `translate(${pt.x} ${pt.y}) rotate(${a})`);
      });
    });
  };
  const paintRef = useRef(paint); paintRef.current = paint;

  // Visibility + viewport tracking: the loop only exists while both are true.
  useEffect(() => {
    let vis = !document.hidden; let inView = true;
    const sync = () => setLive(vis && inView);
    const onVis = () => { vis = !document.hidden; sync(); };
    const io = new IntersectionObserver(([en]) => { inView = en.isIntersecting; sync(); }, { threshold: 0.05 });
    if (rootRef.current) io.observe(rootRef.current);
    document.addEventListener("visibilitychange", onVis);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  useEffect(() => {
    if (!playing || reduced || !live) return;
    let raf = 0; let last = 0; // fresh baseline on every (re)start: hidden time never advances
    const tick = (now: number) => {
      if (last) elapsed.current += Math.min(64, now - last);
      last = now;
      paintRef.current();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, reduced, live]);

  const resetTo0 = () => { elapsed.current = playRef.current && !reduced ? 0 : elapsedFor(0, PAUSE_AT); lastIdx.current = -1; paintRef.current(); };
  useEffect(() => { resetTo0(); }, [flow]); // eslint-disable-line react-hooks/exhaustive-deps

  const s = stepAt(flow, stepIdx * STAGE_MS);
  const activeEdges = s.edges;
  const curFlow = flowById(s.flow)!;
  const nodeEdges = useMemo(() => (node ? edgesForNode(node).map((e) => e.id) : []), [node]);
  const litNodes = useMemo(() => new Set(activeEdges.flatMap((id) => { const e = edgeById(id)!; return [e.from, e.to]; })), [activeEdges]);
  const flowSet = useMemo(() => (flow ? new Set(flowNodes(flowById(flow)!)) : null), [flow]);

  const replay = () => { elapsed.current = reduced ? elapsedFor(0, PAUSE_AT) : 0; lastIdx.current = -1; paint(); if (!reduced) setPlaying(true); };
  const step = () => { const i = (stepAt(flow, elapsed.current).index + 1) % s.count; elapsed.current = elapsedFor(i, PAUSE_AT); setPlaying(false); paint(); };
  const pickNode = (id: string) => setNode((n) => (n === id ? null : id));
  const onKey = (id: string) => (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pickNode(id); } };

  const nd = node ? nodeById(node)! : null;
  const total = Math.round(timelineMs(flow) / 1000);

  return (
    <div ref={rootRef} className={`sdf on-dark ${playing && live ? "" : "paused"}`} data-testid="system-data-flow">
      <div className="mb-5 flex flex-wrap items-center gap-2" role="group" aria-label="Trace a flow">
        <button className="sdf-pill" aria-pressed={flow === null} onClick={() => setFlow(null)} data-testid="button-flow-overview">Overview tour</button>
        {SYS_FLOWS.map((f) => (
          <button key={f.id} className="sdf-pill" aria-pressed={flow === f.id} onClick={() => setFlow(flow === f.id ? null : f.id)} data-testid={`button-flow-${f.id}`}>
            <span className="sdf-dot" style={{ background: KH[f.kind] }} aria-hidden />{f.t}{f.optional && <span className="mono text-[10px] opacity-60">optional</span>}
          </button>
        ))}
      </div>

      <div className="grid gap-6">
        <div className="min-w-0">
          <div className="sdf-stage">
            <div ref={scrollRef} className="sdf-scroll" tabIndex={0} aria-label="Architecture diagram, scrolls horizontally on small screens">
              <svg className="sdf-svg" viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} role="group" aria-label="Zendesk Contact Center system and data flow diagram">
                <defs>
                  <linearGradient id="sdf-g-primary" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stopColor="#2E4A33" /><stop offset="1" stopColor="#17281B" /></linearGradient>
                  <linearGradient id="sdf-g-card" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#F1F6EE" /></linearGradient>
                  <linearGradient id="sdf-g-lit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F4FBEA" /><stop offset="1" stopColor="#DDEED8" /></linearGradient>
                  <linearGradient id="sdf-g-cz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E3F0E2" /><stop offset="1" stopColor="#EDF5EB" /></linearGradient>
                  <linearGradient id="sdf-g-cc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FBFDF8" /><stop offset="1" stopColor="#F2F6EE" /></linearGradient>
                  <linearGradient id="sdf-g-sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity="0.22" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" /></linearGradient>
                  <filter id="sdf-f-lift" x="-20%" y="-20%" width="140%" height="170%"><feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#16301C" floodOpacity="0.16" /><feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#16301C" floodOpacity="0.14" /></filter>
                  <filter id="sdf-f-hero" x="-20%" y="-20%" width="140%" height="180%"><feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#0E1F12" floodOpacity="0.32" /><feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#0E1F12" floodOpacity="0.25" /></filter>
                  <filter id="sdf-f-cloud" x="-5%" y="-5%" width="110%" height="120%"><feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#203524" floodOpacity="0.08" /></filter>
                  <radialGradient id="sdf-g-glow"><stop offset="0" stopColor="#D1F470" stopOpacity="0.9" /><stop offset="1" stopColor="#D1F470" stopOpacity="0" /></radialGradient>
                  <pattern id="sdf-p-grid" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#203524" opacity="0.09" /></pattern>
                  {(Object.keys(KH) as EdgeKind[]).map((k) => (
                    <marker key={k} id={`sdf-arrow-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M0 1 L9 5 L0 9 z" fill={KH[k]} />
                    </marker>
                  ))}
                </defs>
                <rect x="0" y="0" width={VIEW.w} height={VIEW.h} fill="url(#sdf-p-grid)" aria-hidden />
                {CLOUDS.map((c) => (
                  <g key={c.id} aria-hidden filter="url(#sdf-f-cloud)">
                    <rect x={c.x} y={c.y} width={c.w} height={c.h} rx={26} className={c.id === "zendesk" ? "sdf-cloud-z" : "sdf-cloud-c"} />
                    <rect x={c.x + 14} y={c.y + 14} width={4} height={36} rx={2} fill={c.id === "zendesk" ? "#203524" : "#8BAA43"} />
                    <text x={c.x + 28} y={c.y + 30} className="sdf-cloud-label">{c.t}</text>
                    <text x={c.x + 28} y={c.y + 46} className="sdf-cloud-note">{c.note}</text>
                  </g>
                ))}
                <g aria-hidden>
                  {SYS_EDGES.map((e) => {
                    const on = activeEdges.includes(e.id);
                    const rel = nodeEdges.includes(e.id);
                    const dim = !on && !rel && (node !== null || flow !== null);
                    return (
                      <g key={e.id}>
                        <path d={e.d} className={`sdf-edge-case ${dim ? "dim" : ""}`} />
                        <path ref={(el) => { pathRefs.current[e.id] = el; }} d={e.d} stroke={KC[e.kind]} markerEnd={`url(#sdf-arrow-${e.kind})`}
                          className={`sdf-edge-base ${e.optional ? "opt" : ""} ${on || rel ? "lit" : ""} ${dim ? "dim" : ""}`} />
                        <path d={e.d} stroke={KC[e.kind]} className={`sdf-edge-run ${on && !reduced ? "on" : ""}`} />
                      </g>
                    );
                  })}
                </g>
                {SYS_NODES.map((n) => {
                  const sel = node === n.id;
                  const lit = litNodes.has(n.id);
                  const dim = flowSet ? !flowSet.has(n.id) : false;
                  const st = flowSet ? flowNodes(flowById(flow!)!).indexOf(n.id) : -1;
                  return (
                    <g key={n.id} className={`sdf-node ${n.tier} ${sel ? "sel" : ""} ${lit ? "lit" : ""} ${dim ? "dim" : ""}`} tabIndex={0} role="button"
                      aria-pressed={sel} aria-label={`${n.t}, ${n.sub}. ${n.cloud === "zendesk" ? "Zendesk AWS Cloud" : "Customer AWS Cloud"}`}
                      onClick={() => pickNode(n.id)} onKeyDown={onKey(n.id)} data-testid={`button-node-${n.id}`}>
                      <rect className="ring" x={n.x - 5} y={n.y - 5} width={n.w + 10} height={n.h + 10} rx={20} />
                      <rect className="slab" x={n.x} y={n.y + (n.tier === "primary" ? 7 : 4)} width={n.w} height={n.h} rx={n.tier === "primary" ? 18 : 12} filter={`url(#${n.tier === "primary" ? "sdf-f-hero" : "sdf-f-lift"})`} />
                      <rect className="card" x={n.x} y={n.y} width={n.w} height={n.h} rx={n.tier === "primary" ? 18 : 12} />
                      <rect className="sheen" x={n.x + 1} y={n.y + 1} width={n.w - 2} height={n.h / 2} rx={n.tier === "primary" ? 17 : 11} fill="url(#sdf-g-sheen)" pointerEvents="none" />
                      {(() => {
                        const Icon = ICONS[n.id];
                        const prim = n.tier === "primary";
                        const isz = prim ? 30 : 22;
                        const lines = n.tl ?? [n.t];
                        const fs = prim ? 16 : 13; const lh = fs + 3;
                        const block = lines.length * lh + 14;
                        const top = n.y + (n.h - block) / 2 + fs - 2;
                        const tx = n.x + 14 + isz + 14;
                        return (
                          <>
                            <rect className="icon-bg" x={n.x + 10} y={n.y + n.h / 2 - isz / 2 - 4} width={isz + 8} height={isz + 8} rx={prim ? 12 : 9} />
                            {Icon && <Icon x={n.x + 14} y={n.y + n.h / 2 - isz / 2} width={isz} height={isz} strokeWidth={1.6} className="sdf-icon" aria-hidden />}
                            {lines.map((l, i) => <text key={i} className="sdf-t" x={tx} y={top + i * lh}>{l}</text>)}
                            <text className="sdf-s" x={tx} y={top + lines.length * lh - 2}>{n.sub}</text>
                          </>
                        );
                      })()}
                      {st >= 0 && (
                        <g aria-hidden>
                          <circle cx={n.x + n.w - 4} cy={n.y + 4} r={11} fill="#11110D" stroke="#D1F470" />
                          <text className="sdf-badge" x={n.x + n.w - 4} y={n.y + 7.5} textAnchor="middle" fill="#D1F470">{st + 1}</text>
                        </g>
                      )}
                    </g>
                  );
                })}
                <g aria-hidden style={{ pointerEvents: "none" }}>
                  {SYS_EDGES.map((e) => (
                    <g key={e.id} ref={(el) => { pktRefs.current[e.id] = el; }} style={{ opacity: 0 }}>
                      <circle r={4} fill={KH[e.kind]} opacity={0.3} />
                      <circle r={5} fill={KH[e.kind]} opacity={0.55} />
                      <g><circle r={13} fill="url(#sdf-g-glow)" /><path d="M-7 -6 L8 0 L-7 6 L-4 0 z" fill={KH[e.kind]} stroke="#FFFFFF" strokeWidth={1.5} strokeLinejoin="round" /></g>
                    </g>
                  ))}
                </g>
              </svg>
            </div>
            <span className="sdf-cue" aria-hidden>Scroll to explore</span>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button className="sdf-ctl" onClick={() => setPlaying((p) => !p)} disabled={reduced} aria-label={playing ? "Pause animation" : "Play animation"} data-testid="button-flow-playpause">
                {playing ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}<span>{playing ? "Pause" : "Play"}</span>
              </button>
              <button className="sdf-ctl" onClick={replay} aria-label="Replay from the start" data-testid="button-flow-replay"><RotateCcw className="h-4 w-4" aria-hidden /><span>Replay</span></button>
              <button className="sdf-ctl" onClick={step} aria-label="Next step" data-testid="button-flow-step"><SkipForward className="h-4 w-4" aria-hidden /><span>Step</span></button>
            </div>
            <div className="mono text-xs text-[#F5F5F2]/60" data-testid="text-flow-step">
              Step {s.index + 1}/{s.count} · {curFlow.t} · ~{total}s loop{reduced ? " · motion reduced" : ""}
            </div>
          </div>
          <div className="sdf-legend mt-4 flex flex-wrap gap-x-5 gap-y-2 rounded-2xl p-4 text-xs">
            {(Object.keys(KIND_META) as EdgeKind[]).map((k) => (
              <span key={k} className="inline-flex items-center gap-2"><span className="h-0.5 w-6" style={{ background: KH[k] }} aria-hidden /><strong className="font-medium text-[#203524]">{KIND_META[k].t}</strong>{KIND_META[k].d}</span>
            ))}
            <span className="inline-flex items-center gap-2"><svg width="24" height="4" aria-hidden><line x1="0" y1="2" x2="24" y2="2" stroke="#52665D" strokeDasharray="3 4" /></svg>Optional or configuration-dependent</span>
          </div>
        </div>

        <aside aria-live={playing ? "off" : "polite"}>
          <div className="rounded-3xl bg-[#F5F5F2] p-7 text-[#11110D] md:p-9" data-testid="panel-flow-detail"><div className="grid gap-6 md:grid-cols-2">
            {nd ? (
              <>
                <div>
                <div className="eyebrow text-[#203524]">{nd.cloud === "zendesk" ? "Zendesk AWS Cloud" : "Customer AWS Cloud"}</div>
                <h3 className="mt-3 text-2xl font-semibold">{nd.t}</h3>
                <p className="mono mt-1 text-xs text-[#11110D]/55">{nd.sub}</p>
                <p className="mt-3 text-[#11110D]/72">{nd.d}</p>
                <div className="mt-4 flex flex-wrap gap-2">{nd.chips.map((c) => <span key={c} className="rounded-full bg-[#203524]/8 px-3 py-1 text-xs">{c}</span>)}</div>
                </div><div>
                <div className="eyebrow text-[#203524]/70">Connections</div>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {edgesForNode(nd.id).map((e) => (
                    <li key={e.id} className="flex gap-2"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: KH[e.kind] === "#E9E4D4" ? "#9b9480" : KH[e.kind] === "#D1F470" ? "#7d9a2a" : KH[e.kind] === "#8FD6B4" ? "#2f8a63" : "#c07a1d" }} />
                      <span>{e.from === nd.id ? "To" : "From"} {nodeById(e.from === nd.id ? e.to : e.from)!.t}: {e.label}{e.optional ? " (optional)" : ""}</span></li>
                  ))}
                </ul>
                <div className="mt-5 flex flex-wrap gap-2">
                  {flowsForNode(nd.id).map((f) => <button key={f.id} onClick={() => { setFlow(f.id); setNode(null); }} className="rounded-full border border-[#203524]/25 px-3 py-1 text-xs hover:bg-[#D1F470]" data-testid={`button-node-flow-${f.id}`}>Trace {f.t}</button>)}
                </div>
                </div>
              </>
            ) : (
              <>
                <div>
                <div className="eyebrow text-[#203524]">{flow ? "Flow" : "Overview tour"} · {KIND_META[curFlow.kind].t}</div>
                <h3 className="mt-3 text-2xl font-semibold">{curFlow.t}</h3>
                <p className="mt-3 text-[#11110D]/72">{curFlow.d}</p>
                </div><div>
                <ol className="space-y-2">
                  {curFlow.stages.map((st, k) => (
                    <li key={k} className={`flex gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${k === s.stage ? "bg-[#D1F470]" : ""}`}>
                      <span className="mono text-[#203524]/55">{k + 1}</span>
                      <span>{st.map((id) => { const e = edgeById(id)!; return `${nodeById(e.from)!.t} to ${nodeById(e.to)!.t}${e.optional ? " (optional)" : ""}`; }).join("; ")}</span>
                    </li>
                  ))}
                </ol>
                <p className="mt-5 text-xs text-[#11110D]/50">Select any component in the diagram to inspect its connections.</p>
                </div>
              </>
            )}
          </div></div>
        </aside>
      </div>
    </div>
  );
}

export default SystemDataFlow;
