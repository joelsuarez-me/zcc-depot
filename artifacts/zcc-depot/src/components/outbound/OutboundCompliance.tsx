import { useMemo, useState } from "react";
import { ExternalLink, Scale } from "lucide-react";
import { COMPLIANCE_CONTACTS, DEFAULT_CPOLICY, DISCLAIMER, LAYER_LABEL, evaluateCompliance, regulatoryQualification, type CPolicy } from "@/lib/outbound-compliance";
import { supStore, useSuppression } from "@/lib/outbound-suppression";
import { Slider, Tag, WhatJustHappened } from "./OutboundShared";

export function OutboundCompliance() {
  const sup = useSuppression();
  const [p, setP] = useState<CPolicy>(DEFAULT_CPOLICY);
  const [sel, setSel] = useState("ca");
  const results = useMemo(() => COMPLIANCE_CONTACTS.map((c) => ({ c, r: evaluateCompliance(c, p, sup) })), [p, sup]);
  const cur = results.find((x) => x.c.id === sel)!;
  const reg = regulatoryQualification(cur.c);
  const set = (x: Partial<CPolicy>) => setP((o) => ({ ...o, ...x }));
  const revoked = sup.entries.some((e) => e.phone === cur.c.phone);
  return (
    <div className="grid gap-4">
      <div className="ob-warnbox flex gap-3" role="note" data-testid="text-compliance-disclaimer"><Scale className="h-5 w-5 shrink-0" aria-hidden /><p className="text-sm font-semibold">{DISCLAIMER}</p></div>
      <div className="grid gap-2 sm:grid-cols-5" role="radiogroup" aria-label="Test contacts">
        {results.map(({ c, r }) => (
          <button key={c.id} type="button" role="radio" aria-checked={sel === c.id} onClick={() => setSel(c.id)} className={`ob-card text-left transition-transform ${sel === c.id ? "is-kale" : ""}`} data-testid={`button-contact-${c.letter}`}>
            <span className="ob-h">Contact {c.letter}</span><b className="block">{c.name}</b><span className="block text-xs opacity-70">{c.note}</span>
            <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-bold ${r.tone === "go" ? "bg-[#5FB37A]" : r.tone === "warn" ? "bg-[#E8A33D]" : "bg-[#C2412A] text-white"}`} data-testid={`status-contact-${c.letter}`}>{r.final}</span>
          </button>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[19rem_1fr_22rem]">
        <div className="ob-card grid content-start gap-3"><span className="ob-h">Policy controls</span>
          <Slider id="cp-start" label="Window start (local hour)" value={p.windowStart} min={6} max={12} onChange={(v) => set({ windowStart: v })} />
          <Slider id="cp-end" label="Window end (local hour)" value={p.windowEnd} min={15} max={22} onChange={(v) => set({ windowEnd: v })} />
          <Slider id="cp-max" label="Max attempts in 7 days" value={p.maxAttempts7d} min={1} max={10} onChange={(v) => set({ maxAttempts7d: v })} />
          <Slider id="cp-cool" label="Cooling-off hours" value={p.coolingHours} min={0} max={72} step={4} unit="h" onChange={(v) => set({ coolingHours: v })} />
          {([["weekends", "Allow weekends"], ["holidayToday", "Today is a holiday"], ["stateRules", "Apply example state windows (org policy)"], ["requireWrittenForAutomated", "Require written consent for automated telemarketing"]] as const).map(([k, l]) => <label key={k} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p[k]} onChange={(e) => set({ [k]: e.target.checked })} data-testid={`toggle-cp-${k}`} />{l}</label>)}
          <label className="ob-field" htmlFor="cp-freq"><span>Frequency limit action</span><select id="cp-freq" className="ob-input" value={p.frequencyAction} onChange={(e) => set({ frequencyAction: e.target.value as CPolicy["frequencyAction"] })} data-testid="select-cp-frequency"><option value="defer">Defer</option><option value="exclude">Exclude</option></select></label>
          <button type="button" className="ob-btn" onClick={() => setP(DEFAULT_CPOLICY)} data-testid="button-cp-reset">Reset policy</button>
        </div>
        <div className="ob-stage grid content-start gap-2">
          <span className="ob-h relative text-[#D1F470]">Eligibility gates · {cur.c.name}</span>
          {cur.r.gates.map((g, i) => (
            <div key={g.id} className={`ob-gate relative ${g.status}`} style={{ transitionDelay: `${i * 60}ms` }} data-testid={`gate-${g.id}`}>
              <span className="mono w-5 text-xs opacity-60">{i + 1}</span>
              <div className="flex-1"><b className="block text-sm">{g.label}</b><span className="text-xs opacity-75">{g.status === "skip" ? "Not evaluated after an earlier stop" : g.reason}</span></div>
              <span className="text-[0.62rem] uppercase tracking-wider opacity-70">{LAYER_LABEL[g.layer]}</span>
            </div>
          ))}
          <div className={`ob-verdict relative mt-2 ${cur.r.tone}`} data-testid="text-compliance-verdict">{cur.r.final}</div>
          <div className="relative flex flex-wrap gap-2">
            <button type="button" className="ob-btn" disabled={revoked} onClick={() => supStore.dispatch({ type: "add", phone: cur.c.phone, source: "consent-revocation", reason: "Revoked during compliance lab", channels: ["voice"] })} data-testid="button-revoke-consent">Simulate consent revocation</button>
            <span className="self-center text-xs text-white/60">Writes to the shared store; segment and dialers update too.</span>
          </div>
        </div>
        <div className="grid content-start gap-3">
          {reg.map((r) => (
            <div key={r.body} className="ob-card" data-testid={`reg-${r.body.split(" ")[0].toLowerCase()}`}>
              <div className="flex items-center gap-2"><span className="ob-h m-0">{r.body}</span><Tag k="legal" /></div>
              <ul className="mt-1 grid gap-1 text-xs">{r.flags.map((f) => <li key={f}>· {f}</li>)}</ul>
              <a href={r.source} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs underline">Primary source<ExternalLink className="h-3 w-3" aria-hidden /></a>
            </div>
          ))}
          <p className="text-xs opacity-60">Each authority is qualified independently. These are review prompts, never a legal verdict.</p>
        </div>
      </div>
      <WhatJustHappened title={`${cur.c.name}: ${cur.r.final}`}>{cur.r.gates.find((g) => g.status === "block" || g.status === "defer")?.reason ?? "Every simulated gate passed. Counsel still validates the program."}</WhatJustHappened>
    </div>
  );
}
