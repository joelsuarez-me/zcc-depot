import { useEffect, useState } from "react";
import { Mic, MicOff, Pause, PhoneOff } from "lucide-react";
import { Tag } from "./OutboundShared";
import { ZD_STEPS } from "@/data/outbound-content";

export function OutboundWorkspace({ step, onStep }: { step: number; onStep: (step: number) => void }) {
  const [muted, setMuted] = useState(false);
  const [held, setHeld] = useState(false);
  const [disposition, setDisposition] = useState("Follow-up scheduled");
  const [followUp, setFollowUp] = useState(false);
  const connected = step === 5;
  useEffect(() => { if (step < 5) { setMuted(false); setHeld(false); setFollowUp(false); } }, [step]);
  return (
    <div className="ob-ws" data-testid="outbound-workspace">
      <div className="ob-ws-top flex-wrap"><b>Zendesk Agent Workspace · conceptual</b><span className="ml-auto text-xs">Fictional ticket #48213 · Clearwater Health</span></div>
      <div className="grid gap-4 p-4 xl:grid-cols-[1fr_17rem]">
        <div className="grid content-start gap-4">
          <section className="rounded-xl border border-[var(--line)] p-3">
            <span className="ob-h">Campaign brief</span>
            <b>Clearwater Care · Post-discharge follow-up</b>
            <p className="mt-1 text-sm">Objective: confirm that the patient understands the next care step.</p>
            <p className="mt-1 text-xs opacity-70">Reason: approved care-coordination task · Preview campaign, not ordinary click-to-dial.</p>
          </section>
          <ol className="grid gap-1.5">
            {ZD_STEPS.map((x, i) => <li key={x.t}><button type="button" onClick={() => onStep(i)} className={`ob-step w-full justify-start whitespace-normal text-left ${i === step ? "is-on" : i < step ? "is-done" : ""}`} data-testid={`button-zd-step-${i}`}><i>{i + 1}</i>{x.t}</button></li>)}
          </ol>
          <section className="rounded-xl bg-[#F0F2EC] p-3">
            <span className="ob-h">Simulated call controls</span>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="ob-btn" disabled={!connected} aria-pressed={muted} onClick={() => setMuted((m) => !m)} data-testid="button-workspace-mute">{muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}{muted ? "Unmute" : "Mute"}</button>
              <button type="button" className="ob-btn" disabled={!connected} aria-pressed={held} onClick={() => setHeld((h) => !h)} data-testid="button-workspace-hold"><Pause className="h-4 w-4" />{held ? "Resume call" : "Hold"}</button>
              <button type="button" className="ob-btn is-red" disabled={!connected} onClick={() => onStep(6)} data-testid="button-workspace-end"><PhoneOff className="h-4 w-4" />End call</button>
            </div>
            <p className="mt-2 text-xs" aria-live="polite" data-testid="text-workspace-call-status">{connected ? `${held ? "On hold" : "Connected"} · ${muted ? "microphone muted" : "microphone on"}` : step >= 6 ? "Call ended · after-contact work" : step === 4 ? "Dialing fictional customer" : "No active call"}</p>
          </section>
          <section className="rounded-xl border border-[var(--line)] p-3">
            <span className="ob-h">Customer conversation</span>
            {step < 5 ? <p className="text-sm opacity-60">The conversation appears after the customer answers.</p> : <div className="grid gap-2 text-sm">
              <p className="rounded-lg bg-[#03363D] p-3 text-white"><b>Agent:</b> “Hello Harriet. Is this a good time to review your follow-up plan?”</p>
              <p className="rounded-lg bg-[#E8F0DF] p-3"><b>Harriet:</b> “Yes. I would like to confirm my appointment and the next steps.”</p>
              {step >= 6 && <p className="text-xs opacity-70">Conversation completed. No real patient data, audio, or outreach was used.</p>}
            </div>}
          </section>
        </div>
        <aside className="grid content-start gap-3">
          <div className={`rounded-xl p-3 text-sm ${step >= 2 ? "bg-[#03363D] text-[#EAF2EC]" : "bg-[#11110D]/5"}`}>
            <span className="ob-h">Customer profile</span>
            {step >= 2 ? <>
              <b>Harriet Osei</b><p className="mt-1 text-xs opacity-80">Member CW-00482 · +1 (617) 555-0138</p>
              <dl className="mt-3 grid gap-2 text-xs"><div><dt className="opacity-60">Preference</dt><dd>Morning calls · English</dd></div><div><dt className="opacity-60">Contact attributes</dt><dd>America/New_York · care-follow-up · preview</dd></div><div><dt className="opacity-60">Consent</dt><dd>Approved purpose in this fictional scenario</dd></div></dl>
              <h4 className="mt-4 text-xs font-semibold">Previous interactions</h4>
              <ul className="mt-1 space-y-2 text-xs opacity-80"><li>Nov 9 · Discharge instructions sent</li><li>Nov 10 · Customer requested a coordinator call</li><li>Relevant note: confirm the appointment, then agree a next step</li></ul>
            </> : <p className="text-xs opacity-60">Waiting for the campaign to deliver a contact.</p>}
          </div>
          <div className="rounded-xl border border-[var(--line)] p-3">
            <label className="ob-field" htmlFor="workspace-disposition"><span>Call disposition</span><select id="workspace-disposition" className="ob-input" disabled={step < 6 || step >= 7} value={disposition} onChange={(e) => setDisposition(e.target.value)} data-testid="select-workspace-disposition"><option>Follow-up scheduled</option><option>Question resolved</option><option>Needs coordinator review</option></select></label>
            <button type="button" className="ob-btn is-ink mt-3" disabled={step !== 6} onClick={() => onStep(7)} data-testid="button-workspace-record">Record outcome</button>
            {step >= 7 && <p className="mt-2 text-xs font-semibold text-[#2E6844]" data-testid="text-workspace-disposition">Recorded: {disposition}</p>}
          </div>
          <div className="rounded-xl border border-dashed border-[var(--line)] p-3 text-xs">
            <Tag k="custom">Custom association</Tag>
            <p className="mt-2">Ticket #48213 · Care follow-up. This writeback is an illustrative app/API pattern, not a claimed native campaign feature.</p>
            <label className="mt-3 flex items-center gap-2"><input type="checkbox" checked={followUp} disabled={step < 7} onChange={(e) => setFollowUp(e.target.checked)} data-testid="toggle-workspace-followup" />Add a fictional coordinator follow-up</label>
            <button type="button" className="ob-btn mt-3" disabled={step !== 7} onClick={() => onStep(8)} data-testid="button-workspace-associate">Associate outcome</button>
            {step >= 8 && <p className="mt-2 font-semibold" role="status">Simulated ticket note added{followUp ? " and follow-up task prepared" : ""}. Nothing was written to Zendesk.</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
