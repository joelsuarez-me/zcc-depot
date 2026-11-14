import { useState } from "react";
import { RefreshCw, Trash2, Upload } from "lucide-react";
import { CHANNELS, SOURCE_META, supStore, useSuppression, type Channel, type SupSource } from "@/lib/outbound-suppression";
import { Field, Tag } from "./OutboundShared";

const PHONE = /^\+1 \(\d{3}\) 555-01\d{2}$/;
export function OutboundSuppression() {
  const s = useSuppression();
  const [phone, setPhone] = useState("+1 (415) 555-0138");
  const [source, setSource] = useState<SupSource>("internal-dnc");
  const [reason, setReason] = useState("Asked not to be called again");
  const [chs, setChs] = useState<Channel[]>(["voice"]);
  const [campaign, setCampaign] = useState("");
  const [err, setErr] = useState("");
  const add = () => {
    if (!PHONE.test(phone)) return setErr("Use the fictional format +1 (NNN) 555-01NN.");
    if (!reason.trim()) return setErr("A reason is required for the audit trail.");
    if (!chs.length) return setErr("Select at least one channel.");
    setErr(""); supStore.dispatch({ type: "add", phone, source, reason, channels: chs, campaign: source === "campaign" ? campaign || "Policy renewal" : undefined });
  };
  return (
    <div className="grid gap-4 xl:grid-cols-[22rem_1fr]">
      <div className="ob-card grid content-start gap-3">
        <span className="ob-h">Add suppression · shared store</span>
        <Field label="Phone (fictional)" id="sup-phone" error={err}><input id="sup-phone" className="ob-input" value={phone} onChange={(e) => setPhone(e.target.value)} data-testid="input-sup-phone" /></Field>
        <Field label="Source" id="sup-source"><select id="sup-source" className="ob-input" value={source} onChange={(e) => setSource(e.target.value as SupSource)} data-testid="select-sup-source">{(Object.keys(SOURCE_META) as SupSource[]).filter((k) => k !== "import").map((k) => <option key={k} value={k}>{SOURCE_META[k].label}</option>)}</select></Field>
        {source === "campaign" && <Field label="Campaign scope" id="sup-camp"><input id="sup-camp" className="ob-input" value={campaign} placeholder="Policy renewal" onChange={(e) => setCampaign(e.target.value)} data-testid="input-sup-campaign" /></Field>}
        <Field label="Reason" id="sup-reason"><input id="sup-reason" className="ob-input" value={reason} onChange={(e) => setReason(e.target.value)} data-testid="input-sup-reason" /></Field>
        <fieldset className="flex flex-wrap gap-2 text-xs"><legend className="mb-1 text-xs font-semibold opacity-75">Channels</legend>{CHANNELS.map((c) => <label key={c} className="flex items-center gap-1"><input type="checkbox" checked={chs.includes(c)} onChange={(e) => setChs((x) => (e.target.checked ? [...x, c] : x.filter((y) => y !== c)))} data-testid={`toggle-sup-channel-${c}`} />{c}</label>)}</fieldset>
        <p className="text-xs opacity-60">{SOURCE_META[source].system}. {source === "consent-revocation" || source === "cross-channel" ? "Applies to every channel." : ""}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="ob-btn is-ink" onClick={add} data-testid="button-sup-add">Add entry</button>
          <button type="button" className="ob-btn" onClick={() => supStore.dispatch({ type: "import", rows: [{ phone: "+1 (206) 555-0111", reason: "Bulk import" }, { phone: "+1 (702) 555-0147", reason: "Bulk import" }, { phone: "+1 (614) 555-0190", reason: "Bulk import" }] })} data-testid="button-sup-import"><Upload className="h-3.5 w-3.5" aria-hidden />Import sample file</button>
          <button type="button" className="ob-btn" onClick={() => supStore.dispatch({ type: "reevaluate" })} data-testid="button-sup-reevaluate"><RefreshCw className="h-3.5 w-3.5" aria-hidden />Re-evaluate</button>
          <button type="button" className="ob-btn" onClick={() => supStore.dispatch({ type: "reset" })} data-testid="button-sup-reset">Reset</button>
        </div>
      </div>
      <div className="grid content-start gap-4">
        <div className="ob-card">
          <div className="mb-2 flex items-center gap-2"><span className="ob-h m-0">{s.entries.length} active entries</span><span className="ml-auto text-xs opacity-60" data-testid="text-sup-evaluated">Evaluated {s.evaluations}x · last {s.lastEvaluation}</span></div>
          <div className="ob-scroll"><table className="ob-table"><thead><tr><th>Phone</th><th>Source</th><th>Channels</th><th>Scope</th><th>Effective</th><th /></tr></thead>
            <tbody>{s.entries.map((e) => <tr key={e.id} data-testid={`row-sup-${e.id}`}><td className="mono">{e.phone}</td><td>{SOURCE_META[e.source].label} <Tag k={SOURCE_META[e.source].native ? "native" : "custom"} /></td><td>{e.channels.join(", ")}</td><td>{e.campaign ?? "All campaigns"}</td><td className="mono">{e.effective}</td>
              <td><button type="button" className="ob-btn !px-2" aria-label={`Remove ${e.phone}`} onClick={() => supStore.dispatch({ type: "remove", id: e.id })} data-testid={`button-sup-remove-${e.id}`}><Trash2 className="h-3.5 w-3.5" /></button></td></tr>)}</tbody></table></div>
          <p className="mt-2 text-xs opacity-60">Registry, opt-out and revocation entries cannot be removed here; attempts are logged. Every change flows into the segment funnel, compliance gates and dialer eligibility.</p>
        </div>
        <div className="ob-card"><span className="ob-h">Audit trail</span>
          <ol className="ob-log max-h-56" aria-live="polite">{[...s.audit].reverse().map((a) => <li key={a.seq} className="flex gap-2 py-1 text-xs" data-testid={`audit-${a.seq}`}><span className="mono opacity-60">#{a.seq}</span><b className={a.action === "blocked-removal" ? "text-[#C2412A]" : ""}>{a.action}</b><span className="mono">{a.phone}</span><span className="opacity-70">{a.note}</span></li>)}</ol>
        </div>
      </div>
    </div>
  );
}
