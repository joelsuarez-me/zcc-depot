import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, Repeat, Presentation, PauseCircle } from "lucide-react";
import type { PlaybackAction, ScenarioId } from "@/lib/callback-engine";
import { SCENARIOS } from "@/data/callback-scenarios";
import { useDepot } from "@/lib/depot-mode";

export function CallbackControls({ idx, len, running, speed, still, scenario, onAction, onSpeed, onStill, onScenario }: { idx: number; len: number; running: boolean; speed: number; still: boolean; scenario: ScenarioId; onAction: (a: PlaybackAction) => void; onSpeed: (s: number) => void; onStill: () => void; onScenario: (id: ScenarioId) => void }) {
  const { isPresenter, setMode } = useDepot();
  const done = idx >= len - 1;
  const started = idx > 0 || running;
  return (
    <div className="rt-bar cb-bar" role="toolbar" aria-label="Simulation controls">
      {!started ? <button type="button" className="rt-btn is-primary" onClick={() => onAction("start")} data-testid="button-start"><Play className="h-3.5 w-3.5" aria-hidden />Start simulation</button>
        : running ? <button type="button" className="rt-btn is-primary" onClick={() => onAction("pause")} data-testid="button-pause"><Pause className="h-3.5 w-3.5" aria-hidden />Pause</button>
          : <button type="button" className="rt-btn is-primary" onClick={() => onAction("resume")} disabled={done} data-testid="button-resume"><Play className="h-3.5 w-3.5" aria-hidden />Resume</button>}
      <button type="button" className="rt-btn" onClick={() => onAction("previous")} disabled={idx === 0} data-testid="button-previous"><ChevronLeft className="h-3.5 w-3.5" aria-hidden />Previous</button>
      <button type="button" className="rt-btn" onClick={() => onAction("next")} disabled={done} data-testid="button-next">Next<ChevronRight className="h-3.5 w-3.5" aria-hidden /></button>
      <button type="button" className="rt-btn" onClick={() => onAction("replay")} data-testid="button-replay"><Repeat className="h-3.5 w-3.5" aria-hidden />Replay</button>
      <button type="button" className="rt-btn" onClick={() => onAction("reset")} data-testid="button-reset"><RotateCcw className="h-3.5 w-3.5" aria-hidden />Reset</button>
      <span className="rt-seg" role="group" aria-label="Speed">{[0.5, 1, 2].map((s) => <button key={s} type="button" aria-pressed={speed === s} onClick={() => onSpeed(s)} data-testid={`button-speed-${s}`}>{s}x</button>)}</span>
      <label className="cb-scn"><span className="sr-only">Change scenario</span>
        <select value={scenario} onChange={(e) => onScenario(e.target.value as ScenarioId)} data-testid="select-scenario">{SCENARIOS.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select>
      </label>
      <button type="button" className="rt-btn" aria-pressed={still} onClick={onStill} data-testid="button-still"><PauseCircle className="h-3.5 w-3.5" aria-hidden />{still ? "Motion off" : "Motion on"}</button>
      <button type="button" className={`rt-btn ${isPresenter ? "is-primary" : ""}`} aria-pressed={isPresenter} onClick={() => setMode(isPresenter ? "customer" : "presenter")} data-testid="button-presenter"><Presentation className="h-3.5 w-3.5" aria-hidden />Presenter Mode</button>
      <span className="rt-step mono" data-testid="text-step">Step {idx + 1} / {len}</span>
    </div>
  );
}
