import { useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { DEFAULT_JOURNEY, DEFAULT_JSCENARIO, FALLBACK_TYPES, JMETA, moveNode, runJourney, validateJourney, type JNode, type JScenario, type JType } from "@/lib/outbound-journey";
import { SERVICES } from "@/data/outbound-content";
import { PlayBar, Tag, WhatJustHappened, useStepper } from "./OutboundShared";

const ADDABLE: JType[] = ["send-sms", "send-email", "send-whatsapp", "send-voice", "wait", "branch-delivery", "check-window", "custom-consent"];
const SC_LABEL: Record<keyof JScenario, string> = { smsDelivered: "SMS delivers", emailEligible: "Email eligible", responded: "Customer responds", consentVoice: "Voice consent on record", inWindow: "Inside calling window", whatsappOptIn: "WhatsApp opt-in" };

export function OutboundJourney() {
  const [ns, setNs] = useState<JNode[]>(DEFAULT_JOURNEY);
  const [sc, setSc] = useState<JScenario>(DEFAULT_JSCENARIO);
  const [drag, setDrag] = useState<number | null>(null); const [over, setOver] = useState<number | null>(null);
  const [addType, setAddType] = useState<JType>("send-whatsapp");
  const nextNode = useRef(9);
  const errs = validateJourney(ns);
  const steps = useMemo(() => (errs.length ? [] : runJourney(ns, sc)), [ns, sc, errs.length]);
  const st = useStepper(steps.length);
  const cur = steps[st.idx];
  const mutate = (f: (n: JNode[]) => JNode[]) => { setNs(f); st.jump(0); };
  const move = (from: number, to: number) => mutate((n) => moveNode(n, from, to));
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
      <div className="grid content-start gap-2">
        <div className="flex flex-wrap items-center gap-2"><span className="ob-h m-0">Journey canvas · drag or use arrows</span>
          <select aria-label="Block to add" className="ob-input ml-auto !w-auto !py-1 text-xs" value={addType} onChange={(e) => setAddType(e.target.value as JType)} data-testid="select-journey-add">{ADDABLE.map((t) => <option key={t} value={t}>{JMETA[t].label}</option>)}</select>
          <button type="button" className="ob-btn" onClick={() => { const id = `n${nextNode.current++}`; mutate((n) => [...n.slice(0, -1), { id, type: addType, fallback: addType === "branch-delivery" ? "send-email" : undefined }, n[n.length - 1]]); }} data-testid="button-journey-add"><Plus className="h-3.5 w-3.5" aria-hidden />Add block</button>
          <button type="button" className="ob-btn" onClick={() => mutate(() => DEFAULT_JOURNEY)} data-testid="button-journey-reset">Reset</button>
        </div>
        <ol className="grid gap-1.5">{ns.map((n, i) => { const fixed = n.type === "start" || n.type === "end"; const meta = JMETA[n.type]; return (
          <li key={n.id} draggable={!fixed} onDragStart={() => setDrag(i)} onDragOver={(e) => { e.preventDefault(); setOver(i); }} onDragEnd={() => { setDrag(null); setOver(null); }} onDrop={() => { if (drag !== null) move(drag, i); setDrag(null); setOver(null); }}
            className={`ob-jnode ${drag === i ? "is-drag" : ""} ${over === i && drag !== i ? "is-over" : ""} ${cur?.nodeId === n.id ? "is-run" : ""} ${meta.native ? "" : "is-custom"}`} data-testid={`journey-node-${i}`}>
            <GripVertical className="h-4 w-4 opacity-40" aria-hidden /><span className="mono text-xs opacity-60">{i + 1}</span>
            <div className="min-w-0 flex-1"><b className="block text-sm">{meta.label}</b><span className="block truncate text-xs opacity-70">{meta.note}</span></div>
            {n.type === "branch-delivery" && <select aria-label="Fallback channel" className="ob-input !w-32 !py-1 text-xs text-[#11110D]" value={n.fallback} onChange={(e) => mutate((x) => x.map((y) => (y.id === n.id ? { ...y, fallback: e.target.value } : y)))} data-testid={`select-fallback-${i}`}>{FALLBACK_TYPES.map((f) => <option key={f} value={f}>Fallback: {JMETA[f].label.replace("Send ", "")}</option>)}</select>}
            <Tag k={meta.native ? "native" : "custom"} />
            {!fixed && <span className="flex gap-0.5">
              <button type="button" aria-label={`Move ${meta.label} up`} disabled={i <= 1} onClick={() => move(i, i - 1)} data-testid={`button-journey-up-${i}`}><ArrowUp className="h-3.5 w-3.5" /></button>
              <button type="button" aria-label={`Move ${meta.label} down`} disabled={i >= ns.length - 2} onClick={() => move(i, i + 1)} data-testid={`button-journey-down-${i}`}><ArrowDown className="h-3.5 w-3.5" /></button>
              <button type="button" aria-label={`Delete ${meta.label}`} onClick={() => mutate((x) => x.filter((y) => y.id !== n.id))} data-testid={`button-journey-delete-${i}`}><Trash2 className="h-3.5 w-3.5" /></button>
            </span>}
          </li>); })}</ol>
        {errs.length > 0 && <ul className="ob-err" role="alert">{errs.map((e) => <li key={e}>{e}</li>)}</ul>}
        <p className="text-xs opacity-60">Moving a block never bypasses delivery guardrails: every voice send and fallback re-checks consent, the calling window and channel eligibility.</p>
      </div>
      <div className="grid content-start gap-3">
        <div className="ob-card grid gap-1.5"><span className="ob-h">Customer scenario</span>{(Object.keys(SC_LABEL) as (keyof JScenario)[]).map((k) => <label key={k} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sc[k]} onChange={(e) => { setSc((s) => ({ ...s, [k]: e.target.checked })); st.jump(0); }} data-testid={`toggle-js-${k}`} />{SC_LABEL[k]}</label>)}</div>
        {steps.length > 0 && <PlayBar idx={st.idx} len={steps.length} running={st.running} speed={st.speed} onAction={st.onAction} onSpeed={st.setSpeed} label="Journey" testid="journey" />}
        <ol className="ob-card grid gap-1 text-xs" aria-live="polite">{steps.slice(0, st.idx + 1).map((s, i) => <li key={i} className="flex gap-2"><span className={`ob-dot ${s.tone}`} aria-hidden /><b>{s.label}</b><span className="opacity-75">{s.outcome}</span></li>)}{!steps.length && <li className="opacity-60">Fix validation issues to run.</li>}</ol>
        {cur && <WhatJustHappened title={cur.label}>{cur.outcome}{cur.native ? "" : " (custom orchestration)"}</WhatJustHappened>}
      </div>
    </div>
  );
}

export function OutboundServices() {
  const [sel, setSel] = useState("campaigns");
  const s = SERVICES.find((x) => x.id === sel)!;
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" role="listbox" aria-label="Messaging services">
        {SERVICES.map((x) => <button key={x.id} type="button" role="option" aria-selected={sel === x.id} onClick={() => setSel(x.id)} className={`ob-card text-left ${sel === x.id ? "is-kale" : ""} ${x.kind === "retired" ? "opacity-70 line-through decoration-[#C2412A]/60" : ""}`} data-testid={`button-service-${x.id}`}><span className="ob-h">{x.kind}</span><b>{x.name}</b></button>)}
      </div>
      <div className={`ob-card ${s.kind === "retired" ? "border-[#C2412A]" : ""}`} aria-live="polite"><span className="ob-h">{s.kind === "retired" ? "Retired" : "Role"}</span><b className="text-lg">{s.name}</b><p className="mt-1 text-sm">{s.role}</p></div>
      <div className="ob-warnbox lg:col-span-2" data-testid="text-pinpoint-nuance"><b>Amazon Pinpoint nuance.</b> Pinpoint engagement features (campaigns, journeys, segments, endpoints) reached end of support on October 30, 2026 and are not a recommended architecture for new outbound programs. SMS, voice, push, OTP and phone-number validation APIs continue under AWS End User Messaging. Legacy Pinpoint-based Amazon Connect campaigns are historical context only.</div>
    </div>
  );
}
