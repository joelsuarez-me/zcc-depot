import { useMemo, useState } from "react";
import { AMD_OUTCOMES, evaluateCallProgress, type AmdOptions, type AmdOutcome } from "@/lib/outbound-dialer";
import { Node } from "./OutboundDiagrams";
import { PlayBar, Slider, Tag, WhatJustHappened, useMotionPaused, useStepper } from "./OutboundShared";

const POS: Record<string, [number, number]> = { dial: [20, 150], "dial-outcome": [220, 40], answered: [220, 210], ccp: [420, 210], direct: [420, 290], "Call answered": [640, 120], "Voicemail beep": [640, 180], "Voicemail no beep": [640, 240], "Not detected": [640, 300], Error: [800, 300] };
const LBL: Record<string, string> = { dial: "Campaign dials", "dial-outcome": "Dial outcome (pre-media)", answered: "Media established", ccp: "Check call progress", direct: "No classifier", "Call answered": "Call answered", "Voicemail beep": "Voicemail beep", "Voicemail no beep": "Voicemail no beep", "Not detected": "Not detected", Error: "Error" };

export function OutboundAmd() {
  const [o, setO] = useState<AmdOutcome>("human");
  const [opt, setOpt] = useState<AmdOptions>({ mode: "predictive", classification: true, agentWhisper: false, customerWhisper: false, queueFlowSec: 0, uncertainAs: "not-detected" });
  const r = useMemo(() => evaluateCallProgress(o, opt), [o, opt]);
  const st = useStepper(r.path.length);
  const paused = useMotionPaused();
  const shown = r.path.slice(0, st.idx + 1);
  const set = (p: Partial<AmdOptions>) => { setOpt((x) => ({ ...x, ...p })); st.jump(0); };
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Call outcome">{AMD_OUTCOMES.map((x) => <button key={x.id} type="button" role="radio" aria-checked={o === x.id} className={`room-pill ${o === x.id ? "is-on" : ""}`} onClick={() => { setO(x.id); st.jump(0); }} data-testid={`button-amd-${x.id}`}>{x.label}</button>)}</div>
      <PlayBar idx={st.idx} len={r.path.length} running={st.running} speed={st.speed} onAction={st.onAction} onSpeed={st.setSpeed} label="Answer detection" testid="amd" />
      <div className={`ob-stage ${paused ? "ob-still" : ""}`} data-testid="diagram-amd">
        <svg viewBox="0 0 960 360" role="img" aria-label={`Answer detection path: ${shown.map((p) => LBL[p]).join(" then ")}`}>
          <rect x={200} y={14} width={190} height={96} rx={14} fill="none" stroke="rgba(232,163,61,.5)" strokeDasharray="5 5" />
          <text x={210} y={30} fill="#E8A33D" fontSize={10} fontWeight={700}>BEFORE THE CLASSIFIER</text>
          <text x={210} y={104} fill="rgba(234,242,236,.5)" fontSize={9}>busy · no answer · failure</text>
          <rect x={620} y={98} width={330} height={250} rx={14} fill="none" stroke="rgba(209,244,112,.4)" strokeDasharray="5 5" />
          <text x={630} y={114} fill="#D1F470" fontSize={10} fontWeight={700}>CHECK CALL PROGRESS BRANCHES</text>
          {[["dial", "dial-outcome"], ["dial", "answered"], ["answered", "ccp"], ["answered", "direct"], ...["Call answered", "Voicemail beep", "Voicemail no beep", "Not detected", "Error"].map((b) => ["ccp", b])].map(([a, b]) => { const on = shown.includes(a) && shown.includes(b); const [x1, y1] = POS[a]; const [x2, y2] = POS[b]; return <path key={a + b} className={`ob-edge ${on ? "is-on" : ""}`} d={`M${x1 + 130} ${y1 + 22} C${x1 + 170} ${y1 + 22} ${x2 - 40} ${y2 + 22} ${x2} ${y2 + 22}`} />; })}
          {Object.keys(POS).map((k) => <Node key={k} x={POS[k][0]} y={POS[k][1]} w={k === "Error" ? 110 : 140} h={44} label={LBL[k]} s={{ on: shown[shown.length - 1] === k, past: shown.includes(k), stop: k === "dial-outcome" || k === "Error" }} />)}
        </svg>
      </div>
      <WhatJustHappened title={st.idx === r.path.length - 1 ? r.final : LBL[shown[shown.length - 1]]}>{r.notes.join(" ") || "Step through the path with the transport above."}</WhatJustHappened>
      <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
        <div className="ob-card grid content-start gap-3"><span className="ob-h">Flow options</span>
          <label className="ob-field" htmlFor="amd-mode"><span>Dialing mode</span><select id="amd-mode" className="ob-input" value={opt.mode} onChange={(e) => set({ mode: e.target.value as AmdOptions["mode"] })} data-testid="select-amd-mode"><option value="predictive">Predictive</option><option value="progressive">Progressive</option><option value="preview">Preview (unsupported)</option><option value="agentless">Agentless</option></select></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={opt.classification} onChange={(e) => set({ classification: e.target.checked })} data-testid="toggle-amd-classification" />Call classification enabled</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={opt.customerWhisper} onChange={(e) => set({ customerWhisper: e.target.checked })} data-testid="toggle-amd-cwhisper" />Customer whisper</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={opt.agentWhisper} onChange={(e) => set({ agentWhisper: e.target.checked })} data-testid="toggle-amd-awhisper" />Agent whisper</label>
          <Slider id="amd-queue" label="Customer queue flow" value={opt.queueFlowSec} min={0} max={10} unit="s" onChange={(v) => set({ queueFlowSec: v })} />
          <label className="ob-field" htmlFor="amd-unc"><span>Uncertain result routes to</span><select id="amd-unc" className="ob-input" value={opt.uncertainAs} onChange={(e) => set({ uncertainAs: e.target.value as AmdOptions["uncertainAs"] })} data-testid="select-amd-uncertain"><option value="not-detected">Not detected</option><option value="error">Error</option></select></label>
        </div>
        <div className="ob-card"><span className="ob-h">Post-answer latency · illustrative</span>
          {r.latency.length ? <div className="grid gap-1.5">{r.latency.map((l) => <div key={l.label} className="ob-funnel-row"><span>{l.label}</span><div className="ob-funnel-track"><div className="ob-funnel-fill" style={{ transform: `scaleX(${Math.min(1, l.ms / 8000)})` }} /></div><span className="mono text-right text-xs">{(l.ms / 1000).toFixed(1)}s</span></div>)}</div> : <p className="text-sm opacity-70">No post-answer path: the call never reached media.</p>}
          <p className="mt-2 text-sm font-semibold" data-testid="text-amd-total">Total {(r.totalMs / 1000).toFixed(1)}s · {r.phase}</p>
          <p className="mt-2 text-xs opacity-70"><Tag k="native" /> Branch names follow Check call progress. Accuracy is not guaranteed; timings are teaching values.</p>
        </div>
      </div>
    </div>
  );
}
