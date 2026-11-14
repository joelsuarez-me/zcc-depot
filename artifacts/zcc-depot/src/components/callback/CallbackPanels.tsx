import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Phone, PhoneOff, MessageSquare, Bot, Ticket, ChevronDown, CheckCircle2, CircleDashed, AlertTriangle, Server } from "lucide-react";
import { AGENTS, LIFE_MAIN, LIFE_SIDE, eligibility, fmtClock, isE164, maskPhone, type CbConfig, type CbResult, SYSTEMS } from "@/lib/callback-engine";
import type { Scenario } from "@/data/callback-scenarios";

type P = { sc: Scenario; config: CbConfig; result: CbResult; idx: number };
const initials = (n: string) => n.split(" ").map((p) => p[0]).join("").slice(0, 2);

/* A. Customer experience */
export function CallbackCustomerPanel({ sc, config, result, idx, onSubmit }: P & { onSubmit?: (patch: Partial<CbConfig>) => void }) {
  const ev = result.events[idx];
  const reduce = useReducedMotion();
  const reachedNodes = new Set(result.events.slice(0, idx + 1).map((e) => e.node));
  const ringing = ev?.life === "Dialing";
  return (
    <section className="rt-panel cb-six" data-testid="panel-customer">
      <h3 className="rt-h">A · Customer experience</h3>
      {sc.surface === "web" && <WebForm config={config} onSubmit={onSubmit} />}
      {(sc.surface === "chat" || sc.surface === "ai") && (
        <div className="cb-chat" aria-live="polite">
          <div className="cb-chat-head">{sc.surface === "ai" ? <Bot className="h-4 w-4" aria-hidden /> : <MessageSquare className="h-4 w-4" aria-hidden />}{sc.surface === "ai" ? "Northwind assistant (AI)" : "Northwind chat"}</div>
          <AnimatePresence initial={false}>
            {sc.script!.filter((m) => reachedNodes.has(m.node)).map((m, i) => <motion.p key={i} className={`cb-msg is-${m.who}`} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>{m.text}</motion.p>)}
          </AnimatePresence>
        </div>
      )}
      <div className={`cb-phone ${ringing ? "is-ringing" : ""}`} data-testid="text-customer-view">
        <div className="cb-phone-top"><span>{ev?.layer === "Customer" ? "Customer action" : "Customer sees / hears"}</span><span className="mono">{ev ? fmtClock(ev.t) : ""}</span></div>
        <div className="cb-phone-ic">{ev?.life === "Failed" || ev?.life === "Canceled" ? <PhoneOff className="h-6 w-6" aria-hidden /> : <Phone className="h-6 w-6" aria-hidden />}</div>
        <p className="cb-phone-say">{ev?.customer}</p>
        <p className="text-xs opacity-70">{config.name} · {maskPhone(config.phone)}</p>
      </div>
    </section>
  );
}

function WebForm({ config, onSubmit }: { config: CbConfig; onSubmit?: (p: Partial<CbConfig>) => void }) {
  const [f, setF] = useState({ name: config.name, phone: config.phone, reason: config.reason, dept: config.dept, webTiming: config.webTiming, consent: config.consent });
  const [err, setErr] = useState<string[]>([]);
  useEffect(() => {
    setF({ name: config.name, phone: config.phone, reason: config.reason, dept: config.dept, webTiming: config.webTiming, consent: config.consent });
  }, [config.name, config.phone, config.reason, config.dept, config.webTiming, config.consent]);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs = [!f.name.trim() && "Name is required", !isE164(f.phone) && "Phone must be E.164, for example +13125550147", !f.reason.trim() && "Reason is required", !f.consent && "Consent is required"].filter(Boolean) as string[];
    setErr(errs);
    if (!errs.length) onSubmit?.(f);
  };
  return (
    <form className="cb-form" onSubmit={submit} noValidate data-testid="form-web-callback">
      <label>Name<input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} data-testid="input-web-name" /></label>
      <label>Phone<input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} data-testid="input-web-phone" /></label>
      <label className="sm:col-span-2">Reason<input value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} data-testid="input-web-reason" /></label>
      <label>Department<select value={f.dept} onChange={(e) => setF({ ...f, dept: e.target.value })} data-testid="select-web-dept"><option>Billing</option><option>Support</option><option>Claims</option></select></label>
      <label>Preferred time<select value={f.webTiming} onChange={(e) => setF({ ...f, webTiming: e.target.value as CbConfig["webTiming"] })} data-testid="select-web-timing"><option value="immediate">As soon as possible</option><option value="scheduled">Pick a time in the calendar</option></select></label>
      <label className="cb-check sm:col-span-2"><input type="checkbox" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} data-testid="checkbox-web-consent" />I agree to receive a call about this request.</label>
      {err.length > 0 && <ul className="cb-errs sm:col-span-2" role="alert">{err.map((x) => <li key={x}>{x}</li>)}</ul>}
      <button type="submit" className="depot-btn depot-btn-ink sm:col-span-2" data-testid="button-web-submit">Request callback (simulated)</button>
    </form>
  );
}

/* D. Agent experience (Zendesk Agent Workspace inspired) */
export function CallbackAgentPanel({ sc, config, result, idx }: P) {
  const ev = result.events[idx];
  const dependency = result.events.slice(0, idx + 1).some(e => e.label === "Eligibility re-evaluated: proceed") ? "available" : config.ext;
  const connected = result.events.slice(0, idx + 1).some((e) => e.life === "Connected");
  const agent = result.outcome.agent !== "None" && connected ? result.outcome.agent : "Unassigned";
  return (
    <section className="rt-panel cb-six cb-agent" data-testid="panel-agent">
      <h3 className="rt-h">D · Agent workspace</h3>
      <div className="cb-ws">
        <div className="cb-ws-top"><span className="cb-av">{initials(config.name)}</span><div><strong>{config.name}</strong><div className="mono text-xs">{maskPhone(config.phone)}</div></div><span className="cb-status">{ev?.life}</span></div>
        <dl className="cb-dl">
          <dt>Reason</dt><dd>{config.reason}</dd>
          <dt>Agent</dt><dd data-testid="text-agent-name">{agent}</dd>
          <dt>Agent state</dt><dd data-testid="text-agent-state">{ev?.agent}</dd>
          <dt>History</dt><dd>2 prior contacts · last: invoice question, 12 Nov</dd>
          {sc.id === "external" && <><dt>Dependency</dt><dd>{SYSTEMS[config.system]}: {dependency}</dd></>}
          {sc.surface === "chat" && <><dt>Chat context</dt><dd>Charged twice for order NW-55120. Sentiment: frustrated.</dd></>}
          {sc.surface === "ai" && <><dt>AI summary</dt><dd>Billing dispute, duplicate charge $612.40 on NW-2211. Wants refund.</dd></>}
        </dl>
        <div className="cb-attrs">{Object.entries(result.attributes).map(([k, v]) => <span key={k} className="rt-cap"><b>{k}</b>&nbsp;{v}</span>)}</div>
        <div className={`cb-ticket ${config.zendesk ? "" : "is-off"}`} data-testid="text-ticket">
          <Ticket className="h-4 w-4" aria-hidden />
          {config.zendesk ? (connected ? "Interaction linked to ticket #48213 via the configured Zendesk integration." : "Ticket appears once the call connects (configured integration).") : "No ticket: the Zendesk integration toggle is off. Callbacks do not create tickets by themselves."}
        </div>
      </div>
      {sc.surface === "dashboard" && <AgentBoard config={config} idx={idx} result={result} />}
      {sc.surface === "crm" && <CrmCard config={config} />}
    </section>
  );
}

function AgentBoard({ config, result, idx }: { config: CbConfig; result: CbResult; idx: number }) {
  const freed = result.events.slice(0, idx + 1).some((e) => e.node === "dash");
  return (
    <div className="mt-3 grid gap-1.5" data-testid="agent-board">
      {eligibility(config).map((a) => {
        const status = a.id === config.freeAgent && freed ? "Available" : a.status;
        return <div key={a.id} className={`rt-agent cb-agent-row ${a.eligible ? "s-eligible" : "s-ineligible"} ${a.id === config.freeAgent && freed ? "s-selected" : ""}`} data-testid={`agent-${a.id}`}>
          <span className="rt-av">{a.initials}</span>
          <div className="min-w-0 flex-1"><strong className="text-sm">{a.name}</strong><div className="text-xs opacity-70">{status} · {a.profile}</div><div className="text-[0.7rem] opacity-60">{a.reason}</div></div>
          <span className="mono text-xs">{config.queue} {a.level || "-"}</span>
        </div>;
      })}
      <p className="text-[0.7rem] opacity-60">{AGENTS.length} agents. Availability alone never books a time or guarantees an instant callback.</p>
    </div>
  );
}

function CrmCard({ config }: { config: CbConfig }) {
  return (
    <div className="cb-crm mt-3" data-testid="card-crm">
      <div className="flex items-center justify-between"><strong>CRM profile · CUS-11873</strong><span className={`cb-tier t-${config.tier}`}>{config.tier}</span></div>
      <dl className="cb-dl mt-2"><dt>Account value</dt><dd>$1.84M</dd><dt>Open case</dt><dd>CS-70412 · {config.severity}</dd><dt>Team</dt><dd>{config.team}</dd><dt>Preferred agent</dt><dd>{AGENTS.find((a) => a.id === config.preferredAgent)?.name}</dd><dt>Priority</dt><dd>{config.priority}</dd></dl>
    </div>
  );
}

/* C. Lifecycle timeline */
export function CallbackLifecycleTimeline({ result, idx }: { result: CbResult; idx: number }) {
  const seen = result.events.slice(0, idx + 1);
  const has = (l: string) => seen.some((e) => e.life === l);
  const cur = result.events[idx]?.life;
  const contacts = Array.from(new Set(seen.filter((e) => e.contact).map((e) => e.contact!)));
  return (
    <section className="rt-panel cb-six" data-testid="panel-lifecycle">
      <h3 className="rt-h">C · Callback lifecycle</h3>
      <ol className="cb-life">{LIFE_MAIN.map((l) => <li key={l} className={`${has(l) ? "is-on" : ""} ${cur === l ? "is-cur" : ""}`} data-testid={`life-${l}`}>{has(l) ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : <CircleDashed className="h-3.5 w-3.5" aria-hidden />}{l}</li>)}</ol>
      <div className="mt-2 flex flex-wrap gap-1.5">{LIFE_SIDE.map((l) => <span key={l} className={`cb-side ${has(l) ? "is-on" : ""} ${cur === l ? "is-cur" : ""}`} data-testid={`life-${l}`}>{l}</span>)}</div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div><h4 className="cb-mini">Application orchestration states</h4><p className="text-xs opacity-75">{seen.filter((e) => e.layer === "Orchestration").map((e) => e.life).filter((v, i, a) => a.indexOf(v) === i).join(" → ") || "None in this run"}</p></div>
        <div><h4 className="cb-mini">Amazon Connect contacts</h4><p className="text-xs opacity-75" data-testid="text-contacts">{contacts.join(" → ") || "No Connect contact yet"}</p></div>
      </div>
    </section>
  );
}

/* E. Execution log */
export function CallbackExecutionLog({ result, idx, onJump }: { result: CbResult; idx: number; onJump: (i: number) => void }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="rt-panel cb-six" data-testid="panel-log">
      <h3 className="rt-h">E · Technical execution log</h3>
      <ol className="rt-tl cb-log">
        {result.events.slice(0, idx + 1).map((e, i) => (
          <li key={i} className={`${i === idx ? "is-cur" : ""} ${e.life === "Failed" || e.life === "Expired" ? "st-fallback" : ""}`}>
            <button type="button" onClick={() => onJump(i)} data-testid={`log-${i}`}><span className="mono text-[0.7rem] opacity-70">{fmtClock(e.t)}</span><span className="rt-state">{e.layer}</span>{e.custom && <span className="cb-custom sm">Custom</span>}<span>{e.label}</span></button>
            {e.json != null && <button type="button" className="cb-json-t" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} data-testid={`button-json-${i}`}><ChevronDown className="h-3 w-3" aria-hidden />{open === i ? "Hide" : "Show"} simulated JSON</button>}
            {open === i && <pre className="cb-json">{JSON.stringify(e.json, null, 2)}</pre>}
          </li>
        ))}
      </ol>
    </section>
  );
}

/* F. Outcome */
export function CallbackOutcomePanel({ sc, config, result, done }: { sc: Scenario; config: CbConfig; result: CbResult; done: boolean }) {
  const o = result.outcome;
  if (!done) return <section className="rt-outcome is-wait cb-six" data-testid="panel-outcome"><Server className="h-4 w-4" aria-hidden />F · Outcome appears when the simulation reaches its final step.</section>;
  const good = o.final === "Completed" || o.final === "Served live";
  return (
    <section className={`rt-outcome cb-outcome ${good ? "" : "is-bad"}`} data-testid="panel-outcome">
      <div className="flex items-center gap-2"><span className="rt-h !mb-0">F · Outcome</span>{!good && <AlertTriangle className="h-4 w-4" aria-hidden />}</div>
      <p className="mt-1 text-xl font-semibold" data-testid="text-final">{o.final}</p>
      <p className="text-sm opacity-85">{o.summary}</p>
      <dl className="cb-dl is-dark mt-3">
        <dt>Callback type</dt><dd>{sc.title}</dd><dt>Customer</dt><dd>{config.name}</dd><dt>Requested</dt><dd>{o.requested}</dd><dt>Executed</dt><dd data-testid="text-executed">{o.executed}</dd>
        <dt>Queue</dt><dd>{o.queue}</dd><dt>Agent</dt><dd>{o.agent}</dd><dt>Attempts</dt><dd data-testid="text-attempts">{o.attempts}</dd><dt>Dependency</dt><dd>{o.dependency}</dd>
      </dl>
      {result.attempts.length > 0 && <ol className="mt-3 flex flex-wrap gap-1.5">{result.attempts.map((a) => <li key={a.n} className="cb-att">#{a.n} {a.result} · {fmtClock(a.at)}</li>)}</ol>}
      <p className="mt-3 text-sm"><b>Customer experience:</b> {o.experience}</p>
    </section>
  );
}

/* What just happened: public factual explanation of the current step. */
export function WhatJustHappened({ result, idx }: { result: CbResult; idx: number }) {
  const e = result.events[idx];
  return (
    <div className="cb-wjh" aria-live="polite" data-testid="text-what-happened">
      <span className="cb-mini">What just happened</span>
      <strong>{e?.label}</strong>
      <span>{e?.detail}</span>
      {e?.custom && <span className="cb-custom">Custom pattern, not native</span>}
    </div>
  );
}
