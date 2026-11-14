import { useMemo, useState } from "react";
import { Compass } from "lucide-react";
import { COMPARE, COMPARE_DIMS, MODES } from "@/data/outbound-content";
import { DEFAULT_DECISION, DIAL_MODES, recommendDialer, type DecisionInput, type DialMode } from "@/lib/outbound-dialer";
import { Tag } from "./OutboundShared";

const OPTS: { k: keyof DecisionInput; label: string; o: [string, string][] }[] = [
  { k: "objective", label: "Campaign objective", o: [["sales", "Sales / offers"], ["service", "Account servicing"], ["notification", "Notification"], ["collections", "Collections"], ["care", "Care / sensitive outreach"]] },
  { k: "size", label: "Campaign size", o: [["small", "Under 1,000"], ["medium", "1,000–20,000"], ["large", "Over 20,000"]] },
  { k: "staffing", label: "Agent staffing", o: [["none", "No agents"], ["limited", "Limited"], ["ample", "Ample"]] },
  { k: "personalization", label: "Personalization", o: [["low", "Low"], ["medium", "Medium"], ["high", "High"]] },
  { k: "sensitivity", label: "Customer sensitivity", o: [["low", "Low"], ["medium", "Medium"], ["high", "High"]] },
  { k: "automation", label: "Automation", o: [["none", "None"], ["partial", "Partial"], ["full", "Full self-service"]] },
];

export function OutboundComparison({ onOpen }: { onOpen: (m: DialMode) => void }) {
  const [dim, setDim] = useState<number | null>(null);
  const [inp, setInp] = useState<DecisionInput>(DEFAULT_DECISION);
  const rec = useMemo(() => recommendDialer(inp), [inp]);
  const max = Math.max(1, ...DIAL_MODES.map((m) => Math.abs(rec.scores[m])));
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Highlight a dimension">
        <button type="button" className={`room-pill ${dim === null ? "is-on" : ""}`} onClick={() => setDim(null)} data-testid="button-dim-all">All dimensions</button>
        {COMPARE_DIMS.map((d, i) => <button key={d} type="button" className={`room-pill ${dim === i ? "is-on" : ""}`} aria-pressed={dim === i} onClick={() => setDim(i)} data-testid={`button-dim-${i}`}>{d}</button>)}
      </div>
      <div className="ob-scroll">
        <table className="ob-table min-w-[52rem]">
          <thead><tr><th>Dimension</th>{MODES.map((m) => <th key={m.id} style={{ borderBottom: `3px solid ${m.accent}` }}><button type="button" className="underline-offset-2 hover:underline" onClick={() => onOpen(m.id)} data-testid={`button-compare-open-${m.id}`}>{m.name}</button></th>)}</tr></thead>
          <tbody>{COMPARE_DIMS.map((d, i) => (dim === null || dim === i) && (
            <tr key={d} className={rec.mode && dim === i ? "bg-[#D1F470]/30" : ""}><td className="font-semibold">{d}</td>{MODES.map((m) => <td key={m.id} className={rec.mode === m.id ? "bg-[#D1F470]/20" : ""}>{COMPARE[m.id][i]}</td>)}</tr>
          ))}</tbody>
        </table>
      </div>
      <div id="decision-assistant" className="grid gap-4 rounded-3xl bg-[#11110D] p-5 text-[#F5F5F2] lg:grid-cols-[1fr_22rem]">
        <div>
          <div className="mb-3 flex items-center gap-2"><Compass className="h-5 w-5 text-[#D1F470]" aria-hidden /><h3 className="text-xl font-semibold">Which dialer should I use?</h3></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {OPTS.map((o) => (
              <label key={o.k} className="ob-field" htmlFor={`decide-${o.k}`}><span>{o.label}</span>
                <select id={`decide-${o.k}`} className="ob-input" value={inp[o.k]} onChange={(e) => setInp((p) => ({ ...p, [o.k]: e.target.value }))} data-testid={`select-decide-${o.k}`}>{o.o.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
              </label>
            ))}
          </div>
          <div className="mt-4 grid gap-1.5">{DIAL_MODES.map((m) => (
            <div key={m} className="flex items-center gap-2 text-xs"><span className="w-20">{MODES.find((x) => x.id === m)!.name}</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full transition-transform duration-500" style={{ width: "100%", transformOrigin: "left", transform: `scaleX(${Math.max(0.02, (rec.scores[m] + max) / (2 * max))})`, background: m === rec.mode ? "#D1F470" : "#8EC5C9" }} /></div><span className="mono w-6 text-right">{rec.scores[m]}</span></div>
          ))}</div>
        </div>
        <div className="rounded-2xl bg-[#D1F470] p-4 text-[#11110D]" aria-live="polite">
          <span className="ob-h">Recommended · architectural guidance</span>
          <p className="text-3xl font-semibold tracking-tight" data-testid="text-recommended-mode">{MODES.find((m) => m.id === rec.mode)!.name}</p>
          <ul className="mt-2 grid gap-1 text-sm">{rec.reasons.map((r) => <li key={r}>· {r}</li>)}</ul>
          <p className="mt-3 text-xs"><Tag k="demo">Guidance, not an AWS service guarantee</Tag></p>
          <button type="button" className="ob-btn is-ink mt-3" onClick={() => onOpen(rec.mode)} data-testid="button-open-recommended">Open this simulator</button>
        </div>
      </div>
    </div>
  );
}
