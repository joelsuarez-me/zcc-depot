import { useState } from "react";
import { DOCS, INDUSTRIES, MODES, REPORT_EDGES, REPORT_NODES, ZD_KIND, ZD_STEPS } from "@/data/outbound-content";
import { INDUSTRY_CASES } from "@/data/outbound-industry-cases";
import type { DialMode } from "@/lib/outbound-dialer";
import { PlayBar, Tag, WhatJustHappened, useMotionPaused, useStepper } from "./OutboundShared";
import { OutboundWorkspace } from "./OutboundWorkspace";

export function OutboundReporting() {
  const [sel, setSel] = useState("dash");
  const [view, setView] = useState<"all" | "native" | "custom">("all");
  const n = REPORT_NODES.find((x) => x.id === sel)!;
  const P = (id: string) => { const r = REPORT_NODES.find((x) => x.id === id)!; return { x: 20 + r.col * 235, y: 30 + r.row * 95 }; };
  const dim = (native: boolean) => (view === "all" ? 1 : (view === "native") === native ? 1 : 0.2);
  return (
    <div className="grid gap-3">
      <div className="flex gap-1.5" role="radiogroup" aria-label="Reporting view">{(["all", "native", "custom"] as const).map((v) => <button key={v} type="button" role="radio" aria-checked={view === v} className={`room-pill ${view === v ? "is-on" : ""}`} onClick={() => setView(v)} data-testid={`button-report-${v}`}>{v === "all" ? "Everything" : v === "native" ? "Native reporting" : "Custom analytics"}</button>)}</div>
      <div className="ob-stage"><svg viewBox="0 0 960 300" role="img" aria-label="Reporting data flow, native and custom">
        <rect x={700} y={10} width={250} height={280} rx={14} fill="none" stroke="rgba(146,103,198,.6)" strokeDasharray="5 5" /><text x={712} y={28} fill="#c2a8ea" fontSize={10} fontWeight={700}>CUSTOM</text>
        {REPORT_EDGES.map(([a, b]) => { const p = P(a), q = P(b); const on = sel === a || sel === b; return <path key={a + b} className={`ob-edge ${on ? "is-on" : ""}`} d={`M${p.x + 200} ${p.y + 24} C${p.x + 220} ${p.y + 24} ${q.x - 20} ${q.y + 24} ${q.x} ${q.y + 24}`} />; })}
        {REPORT_NODES.map((r) => { const p = P(r.id); return <g key={r.id} transform={`translate(${p.x},${p.y})`} opacity={dim(r.native)} className={`ob-node cursor-pointer ${sel === r.id ? "is-on" : ""}`} role="button" tabIndex={0} aria-label={r.label} onClick={() => setSel(r.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSel(r.id); } }} data-testid={`report-node-${r.id}`}><rect className="box" width={200} height={48} rx={12} strokeDasharray={r.native ? undefined : "4 4"} /><text x={12} y={22}>{r.label}</text><text className="sub" x={12} y={38}>{r.native ? "native" : "custom"}</text></g>; })}
      </svg></div>
      <WhatJustHappened title={n.label}>{n.detail}{n.doc ? <> · <a className="underline" href={DOCS[n.doc].url} target="_blank" rel="noreferrer">{DOCS[n.doc].label}</a></> : null}</WhatJustHappened>
    </div>
  );
}

export function OutboundZendesk() {
  const st = useStepper(ZD_STEPS.length);
  const s = ZD_STEPS[st.idx];
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
      <div className="grid gap-3">
        <PlayBar idx={st.idx} len={ZD_STEPS.length} running={st.running} speed={st.speed} onAction={st.onAction} onSpeed={st.setSpeed} label="Zendesk workspace" testid="zendesk" />
        <OutboundWorkspace step={st.idx} onStep={st.jump} />
      </div>
      <div className="grid content-start gap-3">
        <div className="ob-card" aria-live="polite"><span className="ob-h">Step {st.idx + 1} of 9</span><b>{s.t}</b><p className="mt-2"><Tag k={s.k === "native" ? "native" : s.k === "custom" ? "custom" : "concept"}>{ZD_KIND[s.k]}</Tag></p></div>
        <WhatJustHappened title={s.t}>The workspace advances with the selected campaign step. Call controls, recorded outcomes and ticket association are conceptual, local-only illustrations.</WhatJustHappened>
        <p className="text-xs opacity-70">This workspace does not claim native campaign exposure inside Zendesk. Context and ticket updates depend on your integration configuration or custom apps; verify against Zendesk documentation.</p>
      </div>
    </div>
  );
}

export function OutboundIndustries({ onOpen }: { onOpen: (m: DialMode) => void }) {
  const [sel, setSel] = useState(INDUSTRIES[0].id);
  const [caseIndex, setCaseIndex] = useState(0);
  const ind = INDUSTRIES.find((x) => x.id === sel)!;
  const cases = INDUSTRY_CASES[sel];
  const useCase = cases[caseIndex];
  const st = useStepper(useCase.journey.length);
  const paused = useMotionPaused();
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Industries">{INDUSTRIES.map((x) => <button key={x.id} type="button" role="tab" aria-selected={sel === x.id} className={`room-pill ${sel === x.id ? "is-on" : ""}`} onClick={() => { setSel(x.id); setCaseIndex(0); st.jump(0); }} data-testid={`tab-industry-${x.id}`}>{x.name}</button>)}</div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label={`${ind.name} use cases`}>
        {cases.map((c, i) => <button key={c.name} type="button" role="tab" aria-selected={caseIndex === i} className={`ob-btn ${caseIndex === i ? "is-ink" : ""}`} onClick={() => { setCaseIndex(i); st.jump(0); }} data-testid={`button-use-case-${sel}-${i}`}>{c.name}</button>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="ob-card is-kale grid content-start gap-2">
          <span className="ob-h">{ind.name} · {useCase.name}</span><p className="text-lg font-semibold">{useCase.objective}</p>
          <p className="text-sm"><b>Recommended dialer:</b> {MODES.find((m) => m.id === useCase.mode)!.name} <button type="button" className="underline" onClick={() => onOpen(useCase.mode)} data-testid={`button-industry-open-${ind.id}`}>open simulator</button></p>
          <p className="text-sm"><b>Segment:</b> {useCase.segment}</p>
          <p className="text-sm"><b>Compliance:</b> {useCase.compliance}</p>
          <p className="text-sm"><b>Configuration:</b> {useCase.config.join(" · ")}</p>
          <p className="text-sm"><b>Potential outcome:</b> {useCase.outcome}</p>
        </div>
        <div className="grid content-start gap-3">
          <PlayBar idx={st.idx} len={useCase.journey.length} running={st.running} speed={st.speed} onAction={st.onAction} onSpeed={st.setSpeed} label={`${useCase.name} journey`} testid="industry" />
          <div className={`ob-stage ${paused ? "ob-still" : ""}`}><div className="relative ob-mini-j" data-testid="industry-journey">{useCase.journey.map((j, i) => <span key={j} className={i === st.idx ? "is-on" : i < st.idx ? "!bg-white/20" : "!bg-white/5 text-white/60"}>{j}</span>)}</div></div>
          <WhatJustHappened title={useCase.journey[st.idx]}>Illustrative {useCase.name.toLowerCase()} pattern. All outreach and outcomes are fictional; configuration and legal suitability must be validated for the deployment.</WhatJustHappened>
        </div>
      </div>
    </div>
  );
}
