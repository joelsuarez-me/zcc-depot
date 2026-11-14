import type { CbConfig, Now } from "@/lib/callback-engine";
import { CONTROLS, FAILURE_LABEL, type Scenario } from "@/data/callback-scenarios";
import { CallbackScheduler } from "./CallbackScheduler";

export const SCHED_NOW: Record<string, Now> = { web: { iso: "2026-11-24", min: 600 }, courtesy: { iso: "2026-11-24", min: 850 }, "after-hours": { iso: "2026-11-25", min: 1180 } };

export function CallbackConfigPanel({ sc, config, onChange }: { sc: Scenario; config: CbConfig; onChange: (patch: Partial<CbConfig>) => void }) {
  const now = SCHED_NOW[sc.id];
  return (
    <div className="rt-panel cb-config" data-testid="panel-config">
      <h3 className="rt-h">Scenario controls</h3>
      <label className="rt-field"><span className="text-xs font-semibold">Simulate outcome</span>
        <select value={config.failure} onChange={(e) => onChange({ failure: e.target.value as CbConfig["failure"] })} data-testid="select-failure">
          {sc.failures.map((f) => <option key={f} value={f}>{FAILURE_LABEL[f]}</option>)}
        </select>
      </label>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {sc.controls.filter((k) => k !== "date" && k !== "slot").map((k) => {
          const spec = CONTROLS[k]; if (!spec) return null;
          const v = config[k];
          if (spec.type === "toggle") return <button key={k} type="button" className={`rt-switch ${v ? "is-on" : ""}`} aria-pressed={!!v} onClick={() => onChange({ [k]: !v } as Partial<CbConfig>)} data-testid={`toggle-${k}`}><span />{spec.label}</button>;
          if (spec.type === "select") return <label key={k} className="rt-field"><span className="text-xs font-semibold">{spec.label}</span><select value={String(v)} onChange={(e) => onChange({ [k]: e.target.value } as Partial<CbConfig>)} data-testid={`select-${k}`}>{spec.options!.map(([val, l]) => <option key={val} value={val}>{l}</option>)}</select></label>;
          if (spec.type === "range") return <label key={k} className="rt-field"><span className="flex justify-between text-xs font-semibold">{spec.label}<span className="mono">{String(v)}{spec.unit ?? ""}</span></span><input type="range" min={spec.min} max={spec.max} step={spec.step} value={Number(v)} onChange={(e) => onChange({ [k]: Number(e.target.value) } as Partial<CbConfig>)} data-testid={`range-${k}`} /></label>;
          return <label key={k} className="rt-field"><span className="text-xs font-semibold">{spec.label}</span><input className="cb-input" value={String(v)} onChange={(e) => onChange({ [k]: e.target.value } as Partial<CbConfig>)} data-testid={`input-${k}`} /></label>;
        })}
      </div>
      {now && (sc.id !== "web" || config.webTiming === "scheduled") && <div className="mt-4"><h3 className="rt-h">Scheduling calendar</h3><CallbackScheduler now={now} date={config.date} slot={config.slot} tz={config.tz} onPick={(date, slot) => onChange({ date, slot })} /></div>}
    </div>
  );
}
