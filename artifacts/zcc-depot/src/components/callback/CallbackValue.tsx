import { useState } from "react";
import { Clock, CalendarCheck, CalendarRange, UserCheck, FileText, Workflow, ServerCog, Activity } from "lucide-react";
import { valueCalc, type ValueIn } from "@/lib/callback-engine";
import { VALUE_CARDS } from "@/data/callback-scenarios";

const ICONS = [Clock, CalendarCheck, CalendarRange, UserCheck, FileText, Workflow, ServerCog, Activity];

export function CallbackValue() {
  const [open, setOpen] = useState<number | null>(0);
  const [v, setV] = useState<ValueIn>({ calls: 2400, overThreshold: 28, takeUp: 41, holdMin: 11, abandon: 17 });
  const r = valueCalc(v);
  const F: [keyof ValueIn, string, number, number, string][] = [["calls", "Inbound calls per day", 100, 20000, ""], ["overThreshold", "Calls over wait threshold", 0, 100, "%"], ["takeUp", "Callback acceptance", 0, 100, "%"], ["holdMin", "Average hold avoided", 1, 45, " min"], ["abandon", "Assumed abandon rate when holding", 0, 60, "%"]];
  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
      <div className="grid gap-2 sm:grid-cols-2">
        {VALUE_CARDS.map(([t, d], i) => { const I = ICONS[i]; return (
          <button key={t} type="button" className={`cb-val ${open === i ? "is-on" : ""}`} aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)} data-testid={`card-value-${i}`}>
            <span className="flex items-center gap-2 font-semibold"><I className="h-4 w-4" aria-hidden />{t}</span>
            {open === i && <span className="mt-1 block text-sm opacity-80">{d}</span>}
          </button>); })}
      </div>
      <div className="rt-panel" data-testid="value-calculator">
        <h3 className="rt-h">Illustrative value calculator</h3>
        <div className="grid gap-3">{F.map(([k, l, min, max, u]) => <label key={k} className="rt-field"><span className="flex justify-between text-xs font-semibold">{l}<span className="mono">{v[k]}{u}</span></span><input type="range" min={min} max={max} step={k === "calls" ? 100 : 1} value={v[k]} onChange={(e) => setV({ ...v, [k]: Number(e.target.value) })} data-testid={`range-value-${k}`} /></label>)}</div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="cb-tile"><span>Callbacks offered / day</span><b data-testid="text-value-offered">{r.offered}</b></div>
          <div className="cb-tile"><span>Callbacks accepted / day</span><b data-testid="text-value-accepted">{r.accepted}</b></div>
          <div className="cb-tile"><span>Hold hours avoided / day</span><b data-testid="text-value-hours">{r.holdHours}</b></div>
          <div className="cb-tile"><span>Abandons potentially avoided</span><b data-testid="text-value-abandon">up to {r.abandonsAvoidedUpTo}</b></div>
        </div>
        <p className="mt-3 text-xs opacity-65">Every figure is arithmetic on the assumptions above, not a measured or promised result. Your mileage depends on staffing, offer design and customer behavior.</p>
      </div>
    </div>
  );
}
