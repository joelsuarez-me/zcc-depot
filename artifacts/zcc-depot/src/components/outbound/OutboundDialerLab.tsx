import { useEffect, useMemo, useState } from "react";
import { PresentStage } from "@/components/presentation-stage";
import { DiagramFrame } from "@/components/diagram-view-controls";
import { Phone, PhoneOff, Eye, Trash2, ChevronRight, CheckCircle2, Timer } from "lucide-react";
import { DEFAULT_DIALER, MODE_DEFAULTS, simulateDialer, initialPreview, previewReduce, previewNode, type DialMode, type DialerConfig, type DialCounters, type PreviewState, type PreviewAction } from "@/lib/outbound-dialer";
import { generateProfiles, suppressedInList } from "@/lib/outbound-segment";
import { suppressionFor, useSuppression } from "@/lib/outbound-suppression";
import { MODES, PREVIEW_CONTACTS } from "@/data/outbound-content";
import { PredictiveDiagram, ProgressiveDiagram, PreviewDiagram, AgentlessDiagram } from "./OutboundDiagrams";
import { AgentBoard, Counters, ExecLog, Lifecycle, PlayBar, Slider, Tag, WhatJustHappened, usePlayback, useMotionPaused, FullscreenButton } from "./OutboundShared";
import { OutboundPresenterNotes } from "./OutboundPresenterNotes";

const LIFE: Record<Exclude<DialMode, "preview">, string[]> = {
  predictive: ["Ready", "Running", "Dialing", "Classifying", "Queued", "Connected", "Abandoned", "Completed"],
  progressive: ["Running", "Selected", "Dialing", "No answer", "Voicemail", "Connected", "ACW", "Waiting", "Abandoned", "Completed"],
  agentless: ["Ready", "Running", "Dialing", "Classifying", "Messaging", "Responded", "Transferred", "Retry", "Completed"],
};
const KEYS: Record<Exclude<DialMode, "preview">, (keyof DialCounters)[]> = {
  predictive: ["dialed", "answered", "human", "connected", "abandoned", "noAnswer", "voicemail", "completed"],
  progressive: ["dialed", "connected", "noAnswer", "voicemail", "abandoned", "collisions", "completed"],
  agentless: ["dialed", "human", "voicemail", "noAnswer", "completed", "transferred", "retries"],
};

export function OutboundDialerLab({ mode, onMode }: { mode: DialMode; onMode: (m: DialMode) => void }) {
  return (
    <div id="dialer-lab" className="ob-fs grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="ob-tabs flex-1" role="tablist" aria-label="Dialing modes">
          {MODES.map((m) => (
            <button key={m.id} type="button" role="tab" aria-selected={mode === m.id} className="ob-tab" style={{ ["--acc" as string]: m.accent }} onClick={() => onMode(m.id)} data-testid={`tab-mode-${m.id}`}>
              <b className="text-sm">{m.name}</b><span className="text-[0.7rem] opacity-70">{m.company}</span>
            </button>
          ))}
        </div>
        <FullscreenButton target="dialer-lab" testid="dialer" />
      </div>
      {mode === "preview" ? <PreviewLab /> : <AutoLab key={mode} mode={mode} />}
    </div>
  );
}

function AutoLab({ mode }: { mode: Exclude<DialMode, "preview"> }) {
  const info = MODES.find((m) => m.id === mode)!;
  const [cfg, setCfg] = useState<DialerConfig>({ ...DEFAULT_DIALER, ...MODE_DEFAULTS[mode] });
  const sup = useSuppression();
  const profiles = useMemo(() => generateProfiles(), []);
  const suppressed = useMemo(() => suppressedInList(profiles, cfg.volume, sup), [profiles, cfg.volume, sup]);
  const res = useMemo(() => simulateDialer(mode, cfg, suppressed), [mode, cfg, suppressed]);
  const [speed, setSpeed] = useState(1);
  const [pb, setPb] = usePlayback(res.events.length, speed);
  const paused = useMotionPaused();
  useEffect(() => { setPb({ index: 0, running: false }); }, [res, setPb]);
  const idx = Math.min(pb.index, res.events.length - 1); const ev = res.events[idx];
  const visited = useMemo(() => new Set(res.events.slice(0, idx + 1).map((e) => e.node)), [res, idx]);
  const set = (p: Partial<DialerConfig>) => setCfg((c) => ({ ...c, ...p }));
  const act = (a: "play" | "pause" | "next" | "prev" | "reset" | "end" | "tick") => setPb((p) => {
    const last = res.events.length - 1;
    if (a === "play") return { index: p.index >= last ? 0 : p.index, running: true };
    if (a === "pause") return { ...p, running: false };
    if (a === "next") return { index: Math.min(last, p.index + 1), running: false };
    if (a === "prev") return { index: Math.max(0, p.index - 1), running: false };
    if (a === "end") return { index: last, running: false };
    return { index: 0, running: false };
  });
  const D = mode === "predictive" ? PredictiveDiagram : mode === "progressive" ? ProgressiveDiagram : AgentlessDiagram;
  return (
    <PresentStage testId={`outbound-${mode}`} label={`${info.company} · ${mode} dialing`} step={`Event ${idx + 1}/${res.events.length}`}
      onPrev={idx > 0 ? () => act("prev") : undefined} onNext={idx < res.events.length - 1 ? () => act("next") : undefined} onReset={() => act("reset")}>
    <div className="grid gap-4">
      <div className="grid gap-3 lg:grid-cols-[1fr_20rem]">
        <div className="ob-card is-kale"><span className="ob-h">{info.company} · scenario</span><p className="text-lg font-semibold leading-snug">{info.scenario}</p><p className="mt-2 text-sm opacity-80">{info.tech}</p></div>
        <div className="ob-card"><span className="ob-h">Business outcome</span><p className="text-sm">{info.outcome}</p>
          {mode === "predictive" && <p className="mt-2 text-xs opacity-70"><Tag k="demo" /> Pacing here is an illustrative ratio. The AWS predictive algorithm is service-managed and not reproduced in JavaScript.</p>}
          {mode === "agentless" && <p className="mt-2 text-xs opacity-70">No agent is needed for the automated interaction. Flows can optionally transfer to a staffed queue.</p>}
          {mode === "progressive" && <p className="mt-2 text-xs opacity-70">Unlike predictive, dials wait for a free agent, reducing over-dial risk at the cost of idle time. Allocation-to-lines math here is illustrative.</p>}
        </div>
      </div>
      <PlayBar idx={idx} len={res.events.length} running={pb.running} speed={speed} onAction={act} onSpeed={setSpeed} label={info.name} testid={mode} />
      <DiagramFrame testId={`outbound-${mode}`} text={(a) => <ol>{res.events.map((e, i) => <li key={i} aria-current={i === idx ? "step" : undefined} className={i === idx ? "font-semibold" : i > idx ? "opacity-60" : ""}>{e.label}{a === "technical" && <span className="block text-xs font-normal opacity-70">{e.detail}{e.custom ? " (custom pattern)" : ""}</span>}</li>)}</ol>}>
      <div className={`ob-stage ${paused ? "ob-still" : ""}`} tabIndex={0} aria-label={`${mode} diagram; use horizontal arrow keys to pan on narrow screens`} data-testid={`diagram-${mode}`}><D ev={ev} visited={visited} /></div>
      </DiagramFrame>
      <WhatJustHappened title={ev.label}>{ev.detail}</WhatJustHappened>
      <div className="grid gap-4 xl:grid-cols-[19rem_1fr]">
        <div className="ob-card grid content-start gap-3" aria-label="Configuration">
          <span className="ob-h">Configuration · simulated</span>
          {mode !== "agentless" && <Slider id={`${mode}-agents`} label="Number of agents" value={cfg.agents} min={1} max={5} onChange={(v) => set({ agents: v })} />}
          {mode !== "agentless" && <Slider id={`${mode}-availability`} label="Agent availability" value={cfg.availability} min={0} max={100} step={5} unit="%" onChange={(v) => set({ availability: v })} />}
          {mode !== "agentless" && <Slider id={`${mode}-aht`} label="Average handle time" value={cfg.aht} min={60} max={600} step={15} unit="s" onChange={(v) => set({ aht: v })} />}
          {mode !== "agentless" && <Slider id={`${mode}-acw`} label="After contact work" value={cfg.acw} min={0} max={180} step={5} unit="s" onChange={(v) => set({ acw: v })} />}
          {mode !== "progressive" && <Slider id={`${mode}-answer`} label="Expected answer rate" value={cfg.answerRate} min={5} max={90} unit="%" onChange={(v) => set({ answerRate: v })} />}
          <Slider id={`${mode}-capacity`} label="Dialing capacity allocation" value={cfg.capacity} min={1} max={100} unit="%" onChange={(v) => set({ capacity: v })} />
          {mode === "progressive" && <Slider id={`${mode}-allocation`} label="Agent allocation · relative weight (illustrative lines)" value={cfg.allocation} min={1} max={200} step={5} unit="%" onChange={(v) => set({ allocation: v })} />}
          <Slider id={`${mode}-volume`} label="Campaign contact volume" value={cfg.volume} min={100} max={mode === "agentless" ? 20000 : 5000} step={100} onChange={(v) => set({ volume: v })} />
          {mode === "progressive" && <Slider id={`${mode}-noanswer`} label="Simulate unanswered calls" value={cfg.noAnswerRate} min={0} max={90} step={5} unit="%" onChange={(v) => set({ noAnswerRate: v })} />}
          {mode !== "predictive" && <Slider id={`${mode}-voicemail`} label="Simulate voicemail" value={cfg.voicemailRate} min={0} max={80} step={5} unit="%" onChange={(v) => set({ voicemailRate: v })} />}
          {mode === "predictive" && <Slider id={`${mode}-voicemail`} label="Voicemail share of answers" value={cfg.voicemailRate} min={0} max={80} step={5} unit="%" onChange={(v) => set({ voicemailRate: v })} />}
          {mode === "progressive" && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={cfg.sharedCampaign} onChange={(e) => set({ sharedCampaign: e.target.checked })} data-testid="toggle-shared-campaign" />Second campaign shares this agent pool</label>}
          {mode === "agentless" && <>
            <Slider id="agentless-message" label="Message duration" value={cfg.messageSec} min={10} max={90} step={5} unit="s" onChange={(v) => set({ messageSec: v })} />
            <label className="ob-field" htmlFor="agentless-response"><span>Customer response</span>
              <select id="agentless-response" className="ob-input" value={cfg.response} onChange={(e) => set({ response: e.target.value as DialerConfig["response"] })} data-testid="select-agentless-response">
                <option value="confirm">Press 1 to confirm (IVR)</option><option value="reschedule">Reschedule via self-service (custom)</option><option value="agent">Press 0 for an agent (configured transfer)</option><option value="none">Notification only</option>
              </select></label>
            <Slider id="agentless-retries" label="Retry attempts" value={cfg.retries} min={0} max={3} onChange={(v) => set({ retries: v })} />
          </>}
          <p className="rounded-xl bg-[#11110D]/5 p-2 text-xs" data-testid={`text-${mode}-suppressed`}><b>{suppressed.toLocaleString()}</b> of {cfg.volume.toLocaleString()} list contacts are ineligible via the shared suppression store and never dialed.</p>
        </div>
        <div className="grid content-start gap-4">
          <AgentBoard agents={ev.agents} />
          <Lifecycle states={LIFE[mode]} current={ev.life} />
          <div className="grid gap-4 md:grid-cols-2">
            <ExecLog items={res.events} idx={idx} onJump={(i) => setPb({ index: i, running: false })} />
            <div className="ob-card"><span className="ob-h">Outcomes so far</span><Counters c={ev.c} keys={KEYS[mode]} />
              {mode === "predictive" && <WaitPanel c={ev.c} />}
              {idx === res.events.length - 1 && <p className="mt-3 text-sm font-semibold" data-testid={`text-${mode}-summary`}>{res.summary}</p>}
            </div>
          </div>
        </div>
      </div>
      <OutboundPresenterNotes roomId={info.room} title={`${info.name} dialing presenter notes`} />
    </div>
    </PresentStage>
  );
}

function WaitPanel({ c }: { c: DialCounters }) {
  const rate = c.human ? c.abandoned / c.human : 0;
  return (
    <div className="mt-3 rounded-xl bg-[#11110D] p-3 text-[#F5F5F2]">
      <span className="ob-h text-[#D1F470]">Post-answer wait and abandon risk</span>
      <div className="flex items-end gap-1" aria-hidden>{["Answer", "Classify", "Transfer", "Whisper", "Agent"].map((s, i) => <div key={s} className="flex-1"><div className="rounded-sm" style={{ height: `${10 + i * 7}px`, background: i < 2 ? "#8EC5C9" : i < 4 ? "#E8A33D" : "#D1F470" }} /><span className="block pt-1 text-[0.58rem] opacity-70">{s}</span></div>)}</div>
      <p className="mt-2 text-xs">Illustrative abandonment in this run: <b>{(rate * 100).toFixed(1)}%</b> of human answers. Every second between Check call progress and Transfer to queue raises it.</p>
    </div>
  );
}

function PreviewLab() {
  const info = MODES.find((m) => m.id === "preview")!;
  const sup = useSuppression();
  // Transport: every state is a snapshot so Prev/Next step through history; ticks only run after Start.
  const [tp, setTp] = useState<{ hist: PreviewState[]; pos: number; running: boolean }>(() => ({ hist: [initialPreview(30)], pos: 0, running: false }));
  const [speed, setSpeed] = useState(1);
  const s = tp.hist[tp.pos];
  const dispatch = (a: PreviewAction) => setTp((t) => { const cur = t.hist[t.pos]; const nx = previewReduce(cur, a); if (nx === cur) return t; return { ...t, hist: [...t.hist.slice(0, t.pos + 1), nx], pos: t.pos + 1 }; });
  const paused = useMotionPaused();
  const c = PREVIEW_CONTACTS[s.idx];
  const supNow = suppressionFor(sup, c.phone, "voice");
  const holdForSup = !!supNow && s.countdown <= 1;
  const atLive = tp.pos === tp.hist.length - 1;
  useEffect(() => {
    if (!tp.running) return;
    if (atLive && ((s.phase !== "reviewing" && s.phase !== "queued") || holdForSup)) { setTp((t) => ({ ...t, running: false })); return; }
    const id = setTimeout(() => { if (!atLive) setTp((t) => ({ ...t, pos: Math.min(t.hist.length - 1, t.pos + 1) })); else dispatch({ type: "tick" }); }, 1000 / speed);
    return () => clearTimeout(id);
  }, [tp, s, holdForSup, atLive, speed]);
  const transport = (a: "play" | "pause" | "next" | "prev" | "reset" | "end" | "tick") => setTp((t) => {
    const last = t.hist.length - 1;
    if (a === "play") return { ...t, running: true };
    if (a === "pause") return { ...t, running: false };
    if (a === "prev") return { ...t, pos: Math.max(0, t.pos - 1), running: false };
    if (a === "next") { if (t.pos < last) return { ...t, pos: t.pos + 1, running: false }; const cur = t.hist[t.pos]; const nx = previewReduce(cur, { type: "tick" }); return nx === cur ? t : { hist: [...t.hist, nx], pos: t.pos + 1, running: false }; }
    if (a === "end") return { ...t, pos: last, running: false };
    return { hist: [initialPreview(t.hist[t.pos].reviewSec)], pos: 0, running: false };
  });
  const replay = () => setTp((t) => ({ ...t, pos: 0, running: true }));
  const isSup = (i: number) => !!suppressionFor(sup, PREVIEW_CONTACTS[i].phone, "voice");
  const node = previewNode(s);
  const canReview = s.phase === "queued" || s.phase === "reviewing";
  const wjh: Record<string, [string, string]> = {
    queued: ["Contact delivered to preview", "The campaign selected a contact and reserved this agent before any dial."],
    reviewing: ["Agent reviewing", "The countdown runs while the agent reads context. On expiry this simulation dials automatically."],
    ringing: ["Outbound call placed", "Classification is disabled for preview; the agent hears the answer directly."],
    talk: ["Conversation in progress", "The agent is already on the line, so there is no post-answer wait."],
    done: ["Disposition recorded", "Outcome captured as a contact attribute; ticket updates need an integration."],
    removed: ["Contact removed", "Optional contact removal, where enabled, takes the profile out of this campaign run."],
    noanswer: ["No answer", "A dial outcome before media. Retry follows the campaign retry configuration."],
  };
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 lg:grid-cols-[1fr_20rem]">
        <div className="ob-card is-kale"><span className="ob-h">{info.company} · scenario</span><p className="text-lg font-semibold">{info.scenario}</p><p className="mt-2 text-sm opacity-80">{info.tech}</p></div>
        <div className="ob-card grid gap-2"><span className="ob-h">Configure review time</span>
          <Slider id="preview-review" label="Review timeout" value={s.reviewSec} min={5} max={120} step={5} unit="s" onChange={(v) => dispatch({ type: "setReview", sec: v })} />
          <p className="text-xs opacity-70">AWS recommends disabling call classification for preview dialing; Check call progress is not supported here.</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1"><PlayBar idx={tp.pos} len={tp.hist.length + (atLive && canReview && !holdForSup ? 1 : 0)} running={tp.running} speed={speed} onAction={transport} onSpeed={setSpeed} label="Preview" testid="preview" /></div>
        <button type="button" className="ob-btn" disabled={tp.hist.length < 2} onClick={replay} data-testid="button-preview-replay">Replay history</button>
      </div>
      <p className="text-xs opacity-70">Start runs the review countdown; Prev and Next step through recorded snapshots (Next at the live edge advances one second). Agent actions below branch from the current snapshot.</p>
      <div className={`ob-stage ${paused ? "ob-still" : ""}`} tabIndex={0} aria-label="Preview diagram; use horizontal arrow keys to pan on narrow screens" data-testid="diagram-preview"><PreviewDiagram s={s} node={node} contact={c.name} /></div>
      <WhatJustHappened title={wjh[s.phase][0]}>{wjh[s.phase][1]}</WhatJustHappened>
      <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
        <div className="ob-ws">
          <div className="ob-ws-top"><Eye className="h-4 w-4" aria-hidden /><b>Agent preview workspace</b><span className="ml-auto flex items-center gap-1 mono text-xs"><Timer className="h-3.5 w-3.5" aria-hidden />{canReview ? `${s.countdown}s` : "—"}</span></div>
          <div className={`grid gap-3 p-4 md:grid-cols-2 ${s.reviewed ? "" : "opacity-70"}`}>
            <div className={s.reviewed ? "ob-hl p-1" : "p-1"}><span className="ob-h">Customer profile</span><p className="text-lg font-semibold" data-testid="text-preview-name">{c.name}</p><p className="text-sm">{c.age} · {c.language} · {c.phone}</p><p className="text-sm">{c.plan}</p><p className="mt-1 text-xs opacity-70">{c.account}</p></div>
            <div><span className="ob-h">Campaign reason</span><p className="text-sm font-semibold">{c.reason}</p><span className="ob-h mt-3">Relevant notes</span><p className="text-sm">{c.notes}</p></div>
            <div><span className="ob-h">Contact history</span><ul className="text-sm">{c.history.map((h) => <li key={h}>· {h}</li>)}</ul></div>
            <div><span className="ob-h">Previous interactions</span><ul className="text-sm">{c.interactions.map((h) => <li key={h}>· {h}</li>)}</ul></div>
          </div>
          {supNow && <p className="mx-4 mb-3 rounded-lg bg-[#FBEDEA] p-2 text-xs font-semibold text-[#8a2a1a]" data-testid="text-preview-suppressed">Shared suppression match ({supNow.source}). Remove this contact; dialing is blocked in this simulation.</p>}
          <div className="flex flex-wrap gap-2 border-t border-[#11110D]/10 p-3">
            <button type="button" className="ob-btn" disabled={!canReview || s.reviewed} onClick={() => dispatch({ type: "review" })} data-testid="button-preview-review"><Eye className="h-3.5 w-3.5" aria-hidden />Review Customer</button>
            <button type="button" className="ob-btn is-ink" disabled={!canReview || !!supNow} onClick={() => dispatch({ type: "dial" })} data-testid="button-preview-dial"><Phone className="h-3.5 w-3.5" aria-hidden />Start Call</button>
            <button type="button" className="ob-btn is-red" disabled={!canReview} onClick={() => dispatch({ type: "remove" })} data-testid="button-preview-remove"><Trash2 className="h-3.5 w-3.5" aria-hidden />Remove Contact</button>
            <button type="button" className="ob-btn" disabled={s.phase !== "ringing"} onClick={() => dispatch({ type: "answer" })} data-testid="button-preview-answer">Customer answers</button>
            <button type="button" className="ob-btn" disabled={s.phase !== "ringing"} onClick={() => dispatch({ type: "noanswer" })} data-testid="button-preview-noanswer"><PhoneOff className="h-3.5 w-3.5" aria-hidden />Simulate No Answer</button>
            <button type="button" className="ob-btn is-lime" disabled={s.phase !== "talk"} onClick={() => dispatch({ type: "complete", disposition: "Follow-up scheduled" })} data-testid="button-preview-complete"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden />Complete Contact</button>
            <button type="button" className="ob-btn" disabled={s.phase === "ringing" || s.phase === "talk"} onClick={() => dispatch({ type: "next", total: PREVIEW_CONTACTS.length, isSuppressed: isSup })} data-testid="button-preview-next-contact">Advance to Next Contact<ChevronRight className="h-3.5 w-3.5" aria-hidden /></button>
          </div>
        </div>
        <div className="grid content-start gap-4">
          <Lifecycle states={["queued", "reviewing", "ringing", "talk", "done"]} current={s.phase === "removed" || s.phase === "noanswer" ? "done" : s.phase} label={`Contact lifecycle · ${s.phase}`} />
          <div className="ob-card"><span className="ob-h">Outcomes</span><div className="ob-stats">{Object.entries(s.tally).map(([k, v]) => <div key={k} className="ob-stat" data-testid={`stat-preview-${k}`}><b>{v}</b><small>{k}</small></div>)}</div></div>
          <ExecLog items={s.log.map((l) => ({ t: l.t, label: l.text, tone: l.tone }))} idx={s.log.length - 1} />
        </div>
      </div>
      <OutboundPresenterNotes roomId="outbound-preview" title="Preview dialing presenter notes" />
    </div>
  );
}
