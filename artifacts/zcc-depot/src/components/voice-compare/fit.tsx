import { useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { FIT_SIGNALS, getFitGuidance, type FitSignalId } from "@/data/voice-comparison";

const groups = [
  { kind: "voice", label: "Straightforward signals" },
  { kind: "contact-center", label: "Orchestration signals" },
  { kind: "readiness", label: "Delivery readiness" },
] as const;

export function FitSelector() {
  const [sel, setSel] = useState<FitSignalId[]>([]);
  const g = getFitGuidance(sel);
  const toggle = (id: FitSignalId) => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const count = (k: string) => FIT_SIGNALS.filter(s => s.kind === k && sel.includes(s.id)).length;
  const v = count("voice"), c = count("contact-center"), total = Math.max(v + c, 1);
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_24rem]">
      <div className="space-y-5">
        {groups.map(gr => (
          <fieldset key={gr.kind}>
            <legend className="eyebrow mb-2 text-[#203524]">{gr.label}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {FIT_SIGNALS.filter(s => s.kind === gr.kind).map(s => {
                const on = sel.includes(s.id);
                return (
                  <button key={s.id} type="button" className="vc-toggle" aria-pressed={on} onClick={() => toggle(s.id)} data-testid={`toggle-fit-${s.id}`}>
                    <span className="vc-box" aria-hidden>{on && <Check className="h-3.5 w-3.5" />}</span>
                    <span><span className="block font-semibold leading-snug">{s.title}</span><span className="mt-0.5 block text-sm leading-snug text-[#11110D]/72">{s.detail}</span></span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className={`vc-result ${g.kind === "voice" ? "is-voice" : ""}`} aria-live="polite" aria-atomic="true" data-testid="status-fit-result">
          <div className="eyebrow text-[#D1F470]">{sel.length} of {FIT_SIGNALS.length} signals selected</div>
          <div className="vc-meter mt-3" aria-hidden>
            <span className="bg-[#F5F5F2]" style={{ width: "100%", transform: `scaleX(${v / total})` }} />
          </div>
          <div className="vc-meter mt-1.5" aria-hidden>
            <span className="bg-[#D1F470]" style={{ width: "100%", transform: `scaleX(${c / total})` }} />
          </div>
          <div className="mono mt-1.5 flex justify-between text-[0.66rem] uppercase tracking-wider text-[#F5F5F2]/70" aria-hidden><span>Straightforward {v}</span><span>Orchestration {c}</span></div>
          <h3 className="mt-4 text-2xl font-semibold leading-tight" data-testid="text-fit-title">{g.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-[#F5F5F2]/85" data-testid="text-fit-summary">{g.summary}</p>
          {g.reasons.length > 0 && (
            <ul className="mt-4 space-y-1.5 border-t border-[#F5F5F2]/15 pt-4 text-sm">
              {g.reasons.map(r => <li key={r} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D1F470]" aria-hidden />{r}</li>)}
            </ul>
          )}
          <button type="button" onClick={() => setSel([])} disabled={!sel.length} data-testid="button-fit-reset"
            className="depot-btn depot-btn-lime mt-5 min-h-11 disabled:cursor-not-allowed disabled:opacity-40">
            <RotateCcw className="h-4 w-4" aria-hidden /> Reset selections
          </button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-[#11110D]/65">A discussion aid, not a product eligibility test. Validate every recommendation in discovery.</p>
      </div>
    </div>
  );
}
