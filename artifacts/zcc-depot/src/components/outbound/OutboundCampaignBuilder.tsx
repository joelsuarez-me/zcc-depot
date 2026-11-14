import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Pause, Play, Rocket, RotateCcw, ShieldCheck } from "lucide-react";
import { DEFAULT_DRAFT, DEMO_LIFE, STEPS, editableWhile, lifeNext, modeSettings, needsAgents, validateAll, validateStep, type CampaignDraft, type DemoLife, type LifeAction, type WMode } from "@/lib/outbound-campaign";
import { generateProfiles, runSegment, DEFAULT_FILTERS, type Filter } from "@/lib/outbound-segment";
import { useSuppression } from "@/lib/outbound-suppression";
import { Field, Tag, WhatJustHappened } from "./OutboundShared";

export const SEGMENTS: { id: string; label: string; filters: Filter[] }[] = [
  { id: "renewal-120", label: "Renewal eligible · 120 days", filters: DEFAULT_FILTERS.map((f) => ({ ...f })) },
  { id: "platinum", label: "Platinum & active", filters: [{ id: "active", on: true }, { id: "tier", on: true, value: "Platinum" }, { id: "consent", on: true, value: "voice" }, { id: "suppression", on: true }] },
  { id: "spanish", label: "Spanish preference · renewal", filters: [{ id: "active", on: true }, { id: "language", on: true, value: "Spanish" }, { id: "renewal", on: true, value: 90 }, { id: "consent", on: true, value: "voice" }, { id: "suppression", on: true }] },
  { id: "at-risk", label: "At-risk lifecycle stage", filters: [{ id: "stage", on: true, value: "At risk" }, { id: "consent", on: true, value: "voice" }, { id: "suppression", on: true }] },
];

export function OutboundCampaignBuilder() {
  const [d, setD] = useState<CampaignDraft>(DEFAULT_DRAFT);
  const [step, setStep] = useState(0);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [life, setLife] = useState<DemoLife>("Draft");
  const [progress, setProgress] = useState(0);
  const sup = useSuppression();
  const profiles = useMemo(() => generateProfiles(), []);
  const seg = SEGMENTS.find((s) => s.id === d.segment);
  const audience = useMemo(() => (seg ? runSegment(profiles, seg.filters, sup).steps : []), [seg, profiles, sup]);
  const set = <K extends keyof CampaignDraft>(k: K, v: CampaignDraft[K]) => { setD((p) => ({ ...p, [k]: v })); setLife("Draft"); };
  const go = (n: number) => { if (n > step) { const e = validateStep(step, d); setErrs(e); if (Object.keys(e).length) return; } setErrs({}); setStep(n); };
  const all = validateAll(d); const valid = Object.keys(all).length === 0;
  const act = (a: LifeAction) => { setLife((s) => lifeNext(s, a, valid)); if (a === "reset") setProgress(0); if (a === "validate" && !valid) setErrs(all); };
  useEffect(() => { if (life !== "Running") return; if (progress >= 100) { setLife("Completed"); return; } const t = setTimeout(() => setProgress((p) => Math.min(100, p + 4)), 260); return () => clearTimeout(t); }, [life, progress]);
  const ms = modeSettings(d.mode, d.channel);
  const eligible = audience.length ? audience[audience.length - 1].count : 0;
  const E = (k: string) => errs[k];
  return (
    <div className="grid gap-4 lg:grid-cols-[15rem_1fr]">
      <ol className="flex gap-1.5 overflow-x-auto lg:flex-col" aria-label="Wizard steps">
        {STEPS.map((s, i) => <li key={s}><button type="button" className={`ob-step w-full ${i === step ? "is-on" : i < step ? "is-done" : ""}`} aria-current={i === step ? "step" : undefined} onClick={() => go(i)} data-testid={`button-wizard-step-${i}`}><i>{i < step ? <Check className="h-3 w-3" aria-hidden /> : i + 1}</i>{s}</button></li>)}
      </ol>
      <div className="ob-card grid gap-4 p-5">
        <div className="flex flex-wrap items-center gap-2"><span className="ob-h m-0">Step {step + 1} of 7</span><h3 className="text-xl font-semibold">{STEPS[step]}</h3><span className="ml-auto"><Tag k="demo">Simulation · no AWS resources created</Tag></span></div>
        {step === 0 && <div className="grid gap-3 md:grid-cols-2">
          <Field label="Campaign name" error={E("name")} id="cb-name"><input id="cb-name" className="ob-input" aria-invalid={!!E("name")} value={d.name} onChange={(e) => set("name", e.target.value)} data-testid="input-campaign-name" /></Field>
          <Field label="Business objective" error={E("objective")} id="cb-obj"><input id="cb-obj" className="ob-input" aria-invalid={!!E("objective")} value={d.objective} onChange={(e) => set("objective", e.target.value)} data-testid="input-campaign-objective" /></Field>
          <Field label="Description" id="cb-desc"><textarea id="cb-desc" className="ob-input" rows={2} value={d.description} onChange={(e) => set("description", e.target.value)} data-testid="input-campaign-description" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Channel" id="cb-ch"><select id="cb-ch" className="ob-input" value={d.channel} onChange={(e) => { const ch = e.target.value as CampaignDraft["channel"]; setD((p) => ({ ...p, channel: ch, type: ch === "voice" ? "agent-assisted" : "digital", mode: ch === "voice" ? p.mode ?? "progressive" : null })); }} data-testid="select-campaign-channel"><option value="voice">Voice</option><option value="sms">SMS</option><option value="email">Email</option><option value="whatsapp">WhatsApp</option></select></Field>
            <Field label="Campaign type" error={E("type")} id="cb-type"><select id="cb-type" className="ob-input" aria-invalid={!!E("type")} value={d.type} onChange={(e) => set("type", e.target.value as CampaignDraft["type"])} data-testid="select-campaign-type"><option value="agent-assisted">Agent-assisted voice</option><option value="automated">Automated voice</option><option value="digital">Digital</option></select></Field>
            <Field label="Start date" error={E("start")} id="cb-start"><input id="cb-start" type="date" className="ob-input" value={d.start} onChange={(e) => set("start", e.target.value)} data-testid="input-campaign-start" /></Field>
            <Field label="End date" error={E("end")} id="cb-end"><input id="cb-end" type="date" className="ob-input" aria-invalid={!!E("end")} value={d.end} onChange={(e) => set("end", e.target.value)} data-testid="input-campaign-end" /></Field>
          </div>
        </div>}
        {step === 1 && <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
          <div className="grid gap-2" role="radiogroup" aria-label="Customer segment">{SEGMENTS.map((s) => <button key={s.id} type="button" role="radio" aria-checked={d.segment === s.id} className={`ob-step justify-start ${d.segment === s.id ? "is-on" : ""}`} onClick={() => set("segment", s.id)} data-testid={`button-segment-${s.id}`}>{s.label}</button>)}{E("segment") && <span className="ob-err">{E("segment")}</span>}</div>
          <div className="grid gap-1.5">{audience.map((a) => <div key={a.label} className="ob-funnel-row !grid-cols-[1fr_4rem]"><span className="text-xs">{a.label}</span><b className="mono text-right text-xs">{a.count.toLocaleString()}</b><div className="ob-funnel-track col-span-2 !h-2"><div className="ob-funnel-fill" style={{ transform: `scaleX(${a.count / 10000})` }} /></div></div>)}</div>
        </div>}
        {step === 2 && (d.channel !== "voice" ? <p className="text-sm">Digital channels do not use a dialing mode. Delivery uses the channel's send configuration and communication limits.</p> : <div className="grid gap-4">
          <div className="grid gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Dialing mode">{(["predictive", "progressive", "preview", "agentless"] as WMode[]).map((m) => <button key={m} type="button" role="radio" aria-checked={d.mode === m} className={`ob-step justify-center capitalize ${d.mode === m ? "is-on" : ""}`} onClick={() => setD((p) => ({ ...p, mode: m, type: m === "agentless" ? "automated" : "agent-assisted", classification: m !== "preview" }))} data-testid={`button-mode-${m}`}>{m}</button>)}</div>
          {E("mode") && <span className="ob-err">{E("mode")}</span>}
          <div className="grid gap-3 md:grid-cols-3">
            {ms.includes("capacity") && <Field label="Capacity (1–100%)" error={E("capacity")} id="cb-cap"><input id="cb-cap" type="number" className="ob-input" value={d.capacity} onChange={(e) => set("capacity", Number(e.target.value))} data-testid="input-capacity" /></Field>}
            {ms.includes("allocation") && <Field label="Agent allocation (1–200%)" error={E("allocation")} id="cb-alloc"><input id="cb-alloc" type="number" className="ob-input" value={d.allocation} onChange={(e) => set("allocation", Number(e.target.value))} data-testid="input-allocation" /></Field>}
            {ms.includes("ringSec") && <Field label="Ring time (15–60s)" error={E("ringSec")} id="cb-ring"><input id="cb-ring" type="number" className="ob-input" value={d.ringSec} onChange={(e) => set("ringSec", Number(e.target.value))} data-testid="input-ring" /></Field>}
            {ms.includes("reviewSec") && <Field label="Preview review timeout (s)" id="cb-rev"><input id="cb-rev" type="number" className="ob-input" value={d.reviewSec} onChange={(e) => set("reviewSec", Number(e.target.value))} data-testid="input-review" /></Field>}
            {ms.includes("allowRemove") && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={d.allowRemove} onChange={(e) => set("allowRemove", e.target.checked)} data-testid="toggle-allow-remove" />Allow agents to remove contacts</label>}
            {ms.includes("classification") && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={d.classification} onChange={(e) => set("classification", e.target.checked)} data-testid="toggle-classification" />Call classification (Check call progress)</label>}
          </div>
          {d.mode === "preview" && <p className="text-xs opacity-70">Call classification is not offered for preview: AWS recommends disabling it and Check call progress is not supported.</p>}
        </div>)}
        {step === 3 && <div className="grid gap-3 md:grid-cols-3">
          {d.channel === "voice" ? <>
            {needsAgents(d) && <Field label="Campaign queue" error={E("queue")} id="cb-q"><input id="cb-q" className="ob-input" value={d.queue} onChange={(e) => set("queue", e.target.value)} data-testid="input-queue" /></Field>}
            {needsAgents(d) && <Field label="Routing profile" error={E("routingProfile")} id="cb-rp"><input id="cb-rp" className="ob-input" value={d.routingProfile} onChange={(e) => set("routingProfile", e.target.value)} data-testid="input-routing-profile" /></Field>}
            {needsAgents(d) && <Field label="Agent group" id="cb-ag"><input id="cb-ag" className="ob-input" value={d.agentGroup} onChange={(e) => set("agentGroup", e.target.value)} data-testid="input-agent-group" /></Field>}
            <Field label="Contact flow (published)" error={E("flow")} id="cb-flow"><input id="cb-flow" className="ob-input" value={d.flow} onChange={(e) => set("flow", e.target.value)} data-testid="input-flow" /></Field>
            <Field label="Caller ID (claimed or ported)" error={E("callerId")} id="cb-cid"><input id="cb-cid" className="ob-input" value={d.callerId} onChange={(e) => set("callerId", e.target.value)} data-testid="input-caller-id" /></Field>
            <div className="text-xs opacity-70 md:col-span-3">Dialing capacity: {d.mode === "progressive" ? `${d.allocation}% agent allocation` : `${d.capacity}% capacity`}. {d.mode === "agentless" ? "No queue or routing profile is required unless the flow transfers." : "A strict 1:1 needs an exclusive voice-only routing profile and queue."}</div>
          </> : <>
            <Field label={d.channel === "email" ? "Verified sender address" : "Originating identity"} error={E("senderId")} id="cb-sender"><input id="cb-sender" className="ob-input" value={d.senderId} placeholder={d.channel === "email" ? "renewals@meridian.example" : "+1 (617) 555-0100"} onChange={(e) => set("senderId", e.target.value)} data-testid="input-sender" /></Field>
            <Field label="Message template" error={E("template")} id="cb-tpl"><input id="cb-tpl" className="ob-input" value={d.template} placeholder="renewal_reminder_v3" onChange={(e) => set("template", e.target.value)} data-testid="input-template" /></Field>
          </>}
        </div>}
        {step === 4 && <div className="grid gap-3 md:grid-cols-3">
          <Field label="Window start (recipient local)" error={E("window")} id="cb-ws"><input id="cb-ws" type="time" className="ob-input" value={d.windowStart} onChange={(e) => set("windowStart", e.target.value)} data-testid="input-window-start" /></Field>
          <Field label="Window end" id="cb-we"><input id="cb-we" type="time" className="ob-input" value={d.windowEnd} onChange={(e) => set("windowEnd", e.target.value)} data-testid="input-window-end" /></Field>
          <Field label="Time-zone detection" id="cb-tz"><select id="cb-tz" className="ob-input" value={d.tzStrategy} onChange={(e) => set("tzStrategy", e.target.value as "primary" | "all")} data-testid="select-tz-strategy"><option value="all">All available phones and addresses</option><option value="primary">Primary only</option></select></Field>
          <Field label="Daily limit per recipient" error={E("dailyLimit")} id="cb-dl"><input id="cb-dl" type="number" className="ob-input" value={d.dailyLimit} onChange={(e) => set("dailyLimit", Number(e.target.value))} data-testid="input-daily-limit" /></Field>
          <Field label="Weekly limit" error={E("weeklyLimit")} id="cb-wl"><input id="cb-wl" type="number" className="ob-input" value={d.weeklyLimit} onChange={(e) => set("weeklyLimit", Number(e.target.value))} data-testid="input-weekly-limit" /></Field>
          <Field label="Consent eligibility" id="cb-cons"><select id="cb-cons" className="ob-input" value={d.consent} onChange={(e) => set("consent", e.target.value as CampaignDraft["consent"])} data-testid="select-consent"><option value="express">Express consent</option><option value="express-written">Express written consent</option></select></Field>
          <Field label="Retries" error={E("retries")} id="cb-rt"><input id="cb-rt" type="number" className="ob-input" value={d.retries} onChange={(e) => set("retries", Number(e.target.value))} data-testid="input-retries" /></Field>
          <Field label="Retry spacing (minutes)" id="cb-rs"><input id="cb-rs" type="number" className="ob-input" value={d.retryMinutes} onChange={(e) => set("retryMinutes", Number(e.target.value))} data-testid="input-retry-minutes" /></Field>
          <fieldset className="grid gap-1 text-sm"><legend className="text-xs font-semibold opacity-75">Suppression rules</legend>{[["internal-dnc", "Internal DNC"], ["registry", "National / state DNC scrub"], ["opt-out", "Opt-outs"], ["cross-channel", "Cross-channel"]].map(([k, l]) => <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={d.suppression.includes(k)} onChange={(e) => set("suppression", e.target.checked ? [...d.suppression, k] : d.suppression.filter((x) => x !== k))} data-testid={`toggle-sup-${k}`} />{l}</label>)}</fieldset>
          <p className="text-xs opacity-70 md:col-span-3">Communication limits apply at campaign and instance level and are eventually consistent; ignore-total-limits is a special opt-out, not a legal exemption.</p>
        </div>}
        {step === 5 && <div className="grid gap-3">
          <dl className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">{[["Name", d.name], ["Objective", d.objective], ["Channel", d.channel], ["Type", d.type], ["Dates", `${d.start} → ${d.end}`], ["Segment", seg?.label ?? "—"], ["Eligible audience", eligible.toLocaleString()], ["Mode", d.mode ?? "n/a (digital)"], ["Capacity", d.channel !== "voice" ? "n/a" : d.mode === "progressive" ? `${d.allocation}% allocation` : d.mode === "preview" ? `${d.reviewSec}s review` : `${d.capacity}%`], ["Queue / flow", d.channel === "voice" ? `${needsAgents(d) ? d.queue + " · " : ""}${d.flow}` : d.template], ["Caller / sender", d.channel === "voice" ? d.callerId : d.senderId], ["Window", `${d.windowStart}–${d.windowEnd} local · ${d.tzStrategy}`], ["Limits", `${d.dailyLimit}/day · ${d.weeklyLimit}/week`], ["Retries", `${d.retries} every ${d.retryMinutes} min`], ["Suppression", d.suppression.join(", ") || "none"]].map(([k, v]) => <div key={k} className="rounded-xl bg-[#11110D]/5 p-2"><dt className="text-[0.66rem] uppercase tracking-wider opacity-60">{k}</dt><dd className="font-semibold" data-testid={`text-review-${k.toLowerCase().replace(/\W+/g, "-")}`}>{v}</dd></div>)}</dl>
          {valid ? <p className="flex items-center gap-2 text-sm font-semibold text-[#3F8F5B]"><ShieldCheck className="h-4 w-4" aria-hidden />All steps pass simulated validation.</p> : <ul className="ob-err grid gap-0.5">{Object.values(all).map((e) => <li key={e}>{e}</li>)}</ul>}
        </div>}
        {step === 6 && <div className="grid gap-4">
          <div className="ob-stage"><div className="relative flex flex-wrap items-center gap-2">{DEMO_LIFE.map((s, i) => { const ci = DEMO_LIFE.indexOf(life); return <span key={s} className="flex items-center gap-2"><span className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-all ${i === ci ? "bg-[#D1F470] text-[#11110D]" : i < ci ? "bg-white/15" : "bg-white/5 text-white/50"}`} data-testid={`status-life-${s.toLowerCase()}`}>{s}</span>{i < DEMO_LIFE.length - 1 && <ArrowRight className="h-3.5 w-3.5 opacity-40" aria-hidden />}</span>; })}</div>
            <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-full origin-left rounded-full bg-[#D1F470] transition-transform" style={{ transform: `scaleX(${progress / 100})` }} /></div>
            <p className="relative mt-2 text-xs opacity-70">Simulated progress {progress}% of {eligible.toLocaleString()} eligible contacts. Demonstration states; AWS reports its own campaign states (for example Initialized).</p></div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="ob-btn" disabled={life !== "Draft"} onClick={() => act("validate")} data-testid="button-life-validate"><ShieldCheck className="h-3.5 w-3.5" aria-hidden />Validate</button>
            <button type="button" className="ob-btn" disabled={life !== "Validated"} onClick={() => act("ready")} data-testid="button-life-ready">Mark ready</button>
            <button type="button" className="ob-btn is-ink" disabled={life !== "Ready"} onClick={() => act("launch")} data-testid="button-life-launch"><Rocket className="h-3.5 w-3.5" aria-hidden />Simulate launch</button>
            <button type="button" className="ob-btn" disabled={life !== "Running"} onClick={() => act("pause")} data-testid="button-life-pause"><Pause className="h-3.5 w-3.5" aria-hidden />Pause</button>
            <button type="button" className="ob-btn" disabled={life !== "Paused"} onClick={() => act("resume")} data-testid="button-life-resume"><Play className="h-3.5 w-3.5" aria-hidden />Resume</button>
            <button type="button" className="ob-btn" disabled={life !== "Running" && life !== "Paused"} onClick={() => act("complete")} data-testid="button-life-complete">Complete</button>
            <button type="button" className="ob-btn" onClick={() => act("reset")} data-testid="button-life-reset"><RotateCcw className="h-3.5 w-3.5" aria-hidden />Reset</button>
          </div>
          <WhatJustHappened title={`Demo state: ${life}`}>{life === "Draft" && !valid ? "Validation found issues; fix them in earlier steps." : editableWhile(life)}</WhatJustHappened>
        </div>}
        <div className="flex justify-between border-t border-[#11110D]/10 pt-3">
          <button type="button" className="ob-btn" disabled={step === 0} onClick={() => go(step - 1)} data-testid="button-wizard-back"><ArrowLeft className="h-3.5 w-3.5" aria-hidden />Back</button>
          {step < 6 && <button type="button" className="ob-btn is-ink" onClick={() => go(step + 1)} data-testid="button-wizard-next">Continue<ArrowRight className="h-3.5 w-3.5" aria-hidden /></button>}
        </div>
      </div>
    </div>
  );
}
