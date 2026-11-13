import { ChevronLeft, ChevronRight, Pause, Play, PhoneIncoming, RotateCcw, Repeat, Eye, EyeOff, Clock, Info, ExternalLink } from "lucide-react";
import type { RoutingConfig, RoutingResult } from "@/lib/routing-engine";
import { CONTROLS, METHODS, type Method } from "@/data/routing-scenarios";
import { agentView } from "./RoutingDiagram";

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export function RoutingMethodGallery({ current, onPick }: { current: string; onPick: (id: string) => void }) {
  return (
    <div className="grid gap-6">
      {(["Foundational", "Intelligent", "Advanced"] as const).map((cat) => (
        <div key={cat}>
          <div className="eyebrow mb-2 text-[#11110D]/55">{cat} routing</div>
          <div className="rt-gallery">{METHODS.filter((m) => m.category === cat).map((m) => <RoutingMethodCard key={m.id} m={m} on={current === m.id} onPick={onPick} />)}</div>
        </div>
      ))}
    </div>
  );
}
export function RoutingMethodCard({ m, on, onPick }: { m: Method; on: boolean; onPick: (id: string) => void }) {
  return (
    <button type="button" className={`rt-card ${on ? "is-on" : ""}`} aria-pressed={on} onClick={() => onPick(m.id)} data-testid={`card-method-${m.id}`}>
      <span className="mono text-[0.7rem] opacity-60">{String(m.n).padStart(2, "0")} · {m.guide.native}</span>
      <span className="mt-1 block font-semibold">{m.title}</span>
      <span className="mt-1 block text-sm opacity-70">{m.tagline}</span>
    </button>
  );
}

export function RoutingControls({ idx, len, running, speed, presenter, still, onAction, onSpeed, onPresenter, onStill }: { idx: number; len: number; running: boolean; speed: number; presenter: boolean; still: boolean; onAction: (a: "start" | "pause" | "resume" | "next" | "previous" | "reset" | "replay") => void; onSpeed: (s: number) => void; onPresenter: () => void; onStill: () => void }) {
  const done = idx >= len - 1;
  return (
    <div className="rt-bar" role="toolbar" aria-label="Simulation controls">
      <button type="button" className="rt-btn is-primary" onClick={() => onAction("start")} data-testid="button-start-call"><PhoneIncoming className="h-4 w-4" aria-hidden />Start call</button>
      {running ? <button type="button" className="rt-btn" onClick={() => onAction("pause")} data-testid="button-pause"><Pause className="h-4 w-4" aria-hidden />Pause</button>
        : <button type="button" className="rt-btn" disabled={done} onClick={() => onAction("resume")} data-testid="button-resume"><Play className="h-4 w-4" aria-hidden />Resume</button>}
      <button type="button" className="rt-btn" disabled={idx === 0} onClick={() => onAction("previous")} data-testid="button-previous"><ChevronLeft className="h-4 w-4" aria-hidden />Previous</button>
      <button type="button" className="rt-btn" disabled={done} onClick={() => onAction("next")} data-testid="button-next"><ChevronRight className="h-4 w-4" aria-hidden />Next step</button>
      <button type="button" className="rt-btn" onClick={() => onAction("reset")} data-testid="button-reset"><RotateCcw className="h-4 w-4" aria-hidden />Reset</button>
      <button type="button" className="rt-btn" onClick={() => onAction("replay")} data-testid="button-replay"><Repeat className="h-4 w-4" aria-hidden />Replay</button>
      <div className="rt-seg" role="group" aria-label="Simulation speed">
        {[0.5, 1, 2].map((s) => <button key={s} type="button" aria-pressed={speed === s} onClick={() => onSpeed(s)} data-testid={`button-speed-${s}`}>{s}x</button>)}
      </div>
      <button type="button" className="rt-btn" aria-pressed={still} onClick={onStill} data-testid="button-visual-motion">{still ? <Play className="h-4 w-4" aria-hidden /> : <Pause className="h-4 w-4" aria-hidden />}{still ? "Animate visuals" : "Still visuals"}</button>
      <button type="button" className={`rt-btn ${presenter ? "is-primary" : ""}`} aria-pressed={presenter} onClick={onPresenter} data-testid="button-presenter-toggle">{presenter ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}Presenter explanation</button>
      <span className="rt-step mono" data-testid="text-step-count">Step {idx + 1} / {len}</span>
    </div>
  );
}

export function RoutingConfigurationPanel({ method, config, onChange }: { method: Method; config: RoutingConfig; onChange: (k: keyof RoutingConfig, v: string | number | boolean) => void }) {
  return (
    <div className="rt-panel" data-testid="panel-config">
      <div className="rt-h">Scenario configuration</div>
      <p className="text-xs text-[#11110D]/55">Changing any value rebuilds the deterministic run and resets playback.</p>
      <div className="mt-3 grid gap-3">
        {method.controls.map((k) => {
          const d = method.id==="external" && k==="timeout" ? {...CONTROLS[k], label:"Synchronous Lambda timeout",min:1,max:8,step:1,hint:"AWS synchronous invocation limit: 8 seconds"} : CONTROLS[k]; const v = config[k]; const id = `rt-${k}`;
          return (
            <div key={k} className="rt-field">
              <label htmlFor={id} className="flex justify-between text-sm font-semibold"><span>{d.label}</span>{d.kind === "range" && <span className="mono text-xs">{String(v)}{d.unit ?? ""}</span>}</label>
              {d.kind === "select" && <select id={id} value={String(v)} onChange={(e) => onChange(k, e.target.value)} data-testid={`input-${k}`}>{d.options!.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select>}
              {d.kind === "range" && <input id={id} type="range" min={d.min} max={d.max} step={d.step} value={Number(v)} onChange={(e) => onChange(k, Number(e.target.value))} data-testid={`input-${k}`} />}
              {d.kind === "toggle" && <button id={id} type="button" role="switch" aria-checked={!!v} className={`rt-switch ${v ? "is-on" : ""}`} onClick={() => onChange(k, !v)} data-testid={`input-${k}`}><span />{v ? "Enabled" : "Disabled"}</button>}
              {d.hint && <span className="text-[0.7rem] text-[#11110D]/50">{d.hint}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AgentEligibilityPanel({ result, idx, config }: { result: RoutingResult; idx: number; config: RoutingConfig }) {
  return (
    <div className="rt-panel" data-testid="panel-agents">
      <div className="rt-h">Agent eligibility</div>
      <div className="grid gap-2">
        {result.agents.map((a) => {
          const v = agentView(result, idx, a.id);
          const busy = Object.values(a.active).some((n) => n > 0);
          return (
            <div key={a.id} className={`rt-agent s-${v.s}`} data-testid={`card-agent-${a.id}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2"><span className="rt-av">{a.name.split(" ").map((x) => x[0]).join("")}</span><div><div className="font-semibold">{a.name}</div><div className="text-xs opacity-60">{a.profile}</div></div></div>
                <span className="rt-pill" data-testid={`status-agent-${a.id}`}>{v.s === "pending" ? (a.available ? "Available" : "Offline") : v.s}</span>
              </div>
              <div className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
                <div><span className="opacity-55">Status </span>{a.available ? `Available ${fmt(a.idle)}` : "Offline"}{busy && a.available ? " · busy" : ""}</div>
                <div><span className="opacity-55">Queues </span>{a.queues.join(", ")}</div>
                <div><span className="opacity-55">Skills </span>{Object.entries(a.skills).map(([k, n]) => `${k} ${n}`).join(" · ")}</div>
                <div><span className="opacity-55">Certs </span>{a.certifications.join(", ")} · {a.products.join(", ")}</div>
                <div className="sm:col-span-2"><span className="opacity-55">Active / capacity </span>{(["Voice", "Chat", "Email", "Task"] as const).map((ch) => <span key={ch} className={`rt-cap ${ch === config.channel ? "is-ch" : ""}`}>{ch} {a.active[ch]}/{a.capacity[ch]}</span>)}</div>
              </div>
              <div className="mt-2 text-xs font-medium" data-testid={`text-agent-reason-${a.id}`}>{v.reason}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RoutingExecutionTimeline({ result, idx, onJump }: { result: RoutingResult; idx: number; onJump: (i: number) => void }) {
  return (
    <div className="rt-panel" data-testid="panel-timeline">
      <div className="rt-h">Execution timeline <span className="text-[0.7rem] font-normal opacity-55">illustrative seconds</span></div>
      <ol className="rt-tl">
        {result.events.slice(0, idx + 1).map((e, i) => (
          <li key={i} className={`${i === idx ? "is-cur" : ""} st-${e.state.toLowerCase()}`} data-testid={i === idx ? "text-active-event" : `event-${i}`}>
            <button type="button" onClick={() => onJump(i)}><span className="mono">{fmt(e.at)}</span><span className="rt-state">{e.state}</span><span className="font-semibold">{e.label}</span></button>
            {i === idx && <p className="text-xs opacity-70">{e.detail}</p>}
          </li>
        ))}
      </ol>
      {idx < result.events.length - 1 && <p className="mt-2 text-xs opacity-50">{result.events.length - idx - 1} more steps hidden until reached.</p>}
    </div>
  );
}

export function RoutingOutcomePanel({ result, done }: { result: RoutingResult; done: boolean }) {
  const ag = result.agents.find((a) => a.id === result.selectedAgent);
  if (!done) return <div className="rt-outcome is-wait" data-testid="panel-outcome-pending"><Clock className="h-5 w-5" aria-hidden />The routing outcome appears when playback reaches Completed.</div>;
  const rows: [string, string][] = [["Final destination", result.destination], ["Selected agent or alternate", ag ? ag.name : result.destination], ["Decision criteria", result.criteria], ["Eligibility", ag ? ag.reason : "No agent connected"], ["Simulated routing time", `${result.time}s`], ["Simulated queue wait", `${result.wait}s`], ["Fallback behavior", result.fallback], ["Final outcome", result.outcome]];
  return (
    <div className="rt-outcome" data-testid="panel-outcome">
      <div className="rt-h text-[#D1F470]">Routing outcome</div>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{rows.map(([k, v]) => <div key={k}><dt className="text-[0.7rem] uppercase tracking-wider opacity-55">{k}</dt><dd className="mt-0.5 text-sm font-semibold" data-testid={`text-outcome-${k.toLowerCase().replace(/\s+/g, "-")}`}>{v}</dd></div>)}</dl>
      <p className="mt-3 flex items-center gap-1.5 text-xs opacity-60"><Info className="h-3.5 w-3.5" aria-hidden />Timing and metrics are illustrative from a deterministic teaching model, not measurements from a live Amazon Connect instance.</p>
    </div>
  );
}

export function RoutingPresenterNotes({ method, result }: { method: Method; result: RoutingResult }) {
  const p = method.presenter;
  return (
    <div className="rt-notes" data-testid="panel-presenter-notes">
      <div className="rt-h">Presenter explanation · approved public teaching content</div>
      <div className="grid gap-4 md:grid-cols-2">
        <div><h4>Scenario overview</h4><p>{p.overview}</p><h4>Suggested talk track</h4><ol className="list-decimal pl-5">{p.talk.map((t) => <li key={t}>{t}</li>)}</ol><h4>Technical explanation of this run</h4><p data-testid="text-presenter-explanation">{result.criteria}</p></div>
        <div><h4>Key technical concepts</h4><div>{p.concepts.map((c) => <span key={c} className="rt-cap">{c}</span>)}</div><h4>Business value</h4><p>{p.value}</p><h4>Required configuration</h4><p>{p.config}</p><h4>Expected outcome</h4><p>{p.outcome}</p><h4>Common customer questions</h4>{p.faq.map((f) => <p key={f.q}><strong>{f.q}</strong> {f.a}</p>)}</div>
      </div>
    </div>
  );
}

export function RoutingConfigGuide({ method, ns = "" }: { method: Method; ns?: string }) {
  const g = method.guide;
  const rows: [string, string][] = [["1. Required AWS resources", g.resources], ["2. Contact flow blocks", g.blocks], ["3. Queue configuration", g.queues], ["4. Routing profile configuration", g.profile], ["5. Agent configuration", g.agents], ["6. Routing criteria", g.criteria], ["7. Lambda or external integration", g.integration]];
  return (
    <details className="rt-guide" data-testid={`guide-${ns}${method.id}`}>
      <summary data-testid={`button-guide-${ns}${method.id}`}><span className="mono text-xs opacity-55">{String(method.n).padStart(2, "0")}</span> How to configure in Amazon Connect: {method.title} <span className="rt-pill">{g.native}</span></summary>
      <dl className="grid gap-2 md:grid-cols-2">{rows.map(([k, v]) => <div key={k}><dt className="text-sm font-semibold">{k}</dt><dd className="text-sm text-[#11110D]/70">{v}</dd></div>)}
        <div><dt className="text-sm font-semibold">8. Official AWS documentation</dt><dd>{g.docs.map((d) => <a key={d.url} href={d.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm underline">{d.label}<ExternalLink className="h-3 w-3" aria-hidden /></a>)}</dd></div>
      </dl>
    </details>
  );
}
