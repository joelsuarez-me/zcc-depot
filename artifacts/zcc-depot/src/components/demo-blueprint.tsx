import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, Check, Pencil, RotateCcw, Save, X } from "lucide-react";
import { Ext, Note, Section, SectionHead } from "@/components/kit";
import {
  BLUEPRINT_DESCRIPTION, BLUEPRINT_DISCLAIMER, BLUEPRINT_STAGES, BLUEPRINT_TIMING_NOTE, DEFAULT_SESSION_LENGTH,
  SESSION_LENGTHS, buildBlueprintTimeline, formatBlueprintTime, type BlueprintStage, type SessionLength,
} from "@/data/demo-blueprint";
import "./demo-blueprint.css";

const range = (a: number, b: number) => `${formatBlueprintTime(a)}–${formatBlueprintTime(b)}`;
const mins = (s: number) => { const m = s / 60; return `${Number.isInteger(m) ? m : m.toFixed(1)} min`; };
const STORAGE_KEY = "zcc-depot:demo-blueprint:v1";
const cloneStages = () => BLUEPRINT_STAGES.map(stage => ({ ...stage, minutes: { ...stage.minutes } }));
function loadStages(): BlueprintStage[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (Array.isArray(parsed) && parsed.length === BLUEPRINT_STAGES.length && parsed.every((stage, i) => stage?.id === BLUEPRINT_STAGES[i]?.id)) return parsed;
  } catch { /* use the defaults */ }
  return cloneStages();
}

export function DemoBlueprint() {
  const [length, setLength] = useState<SessionLength>(DEFAULT_SESSION_LENGTH);
  const [index, setIndex] = useState(0);
  const [cues, setCues] = useState(true);
  const [blueprintStages, setBlueprintStages] = useState<BlueprintStage[]>(loadStages);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const stages = useMemo(() => buildBlueprintTimeline(length, blueprintStages), [length, blueprintStages]);
  const s = stages[index];
  const total = stages[stages.length - 1]?.endSeconds ?? length * 60;
  function updateStage<K extends "title" | "value" | "presenterCue" | "proof" | "transition">(key: K, value: BlueprintStage[K]) {
    setBlueprintStages(previous => previous.map((stage, i) => i === index ? { ...stage, [key]: value } : stage));
    setSaved(false);
  }
  function updateMinutes(sessionLength: SessionLength, value: number) {
    setBlueprintStages(previous => previous.map((stage, i) => i === index ? { ...stage, minutes: { ...stage.minutes, [sessionLength]: Math.max(1, value) } } : stage));
    setSaved(false);
  }
  function saveBlueprint() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(blueprintStages)); setSaved(true); setSaveError(""); setEditing(false); }
    catch { setSaved(false); setSaveError("Your browser could not save these changes. Check its storage settings and try again."); }
  }
  function resetBlueprint() {
    const defaults = cloneStages();
    setBlueprintStages(defaults);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* storage unavailable */ }
    setSaved(false); setSaveError(""); setEditing(false);
  }
  function discardEdits() {
    setBlueprintStages(loadStages());
    setSaved(false); setSaveError(""); setEditing(false);
  }

  return (
    <Section className="demo-blueprint-section">
      <SectionHead id="blueprint" eyebrow="DEMO METHODOLOGY" title="Demo Blueprint" lede={BLUEPRINT_DESCRIPTION} />

      <div className="bp-options flex flex-wrap items-center justify-between gap-2">
        <div role="group" aria-label="Session length" className="inline-flex rounded-full border border-[#11110D]/15 bg-[#FBFBF8] p-1">
          {SESSION_LENGTHS.map((l) => (
            <button key={l} type="button" onClick={() => setLength(l)} aria-pressed={l === length} data-testid={`session-${l}`}
              className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${l === length ? "bg-[#203524] text-[#D1F470]" : "text-[#11110D]/70 hover:bg-[#203524]/8"}`}>
              {l} min
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
            <input type="checkbox" checked={cues} onChange={(e) => setCues(e.target.checked)} data-testid="blueprint-cues"
              className="h-4 w-4 accent-[#203524]" />
            Show presenter cues
          </label>
          <button type="button" onClick={() => { setEditing(value => !value); setSaved(false); }}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#11110D]/15 px-4 py-2 text-sm font-semibold hover:bg-[#203524]/8" data-testid="blueprint-edit">
            {editing ? <X className="h-4 w-4" aria-hidden /> : <Pencil className="h-4 w-4" aria-hidden />}
            {editing ? "Close editor" : "Edit blueprint"}
          </button>
          {saved && <span role="status" className="inline-flex items-center gap-1 text-sm font-medium text-[#203524]"><Check className="h-4 w-4" aria-hidden /> Saved on this device</span>}
        </div>
      </div>
      {editing && (
        <div className="mt-4 rounded-2xl border border-[#203524]/20 bg-[#EAF2DB] p-5 md:p-6" data-testid="blueprint-editor">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><div className="eyebrow text-[#203524]">Edit stage {s.number}</div><p className="mt-1 text-sm text-[#203524]/75">Edits preview immediately. Save to keep them after reload; discard to return to the last saved version.</p></div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={discardEdits} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#203524]/25 px-4 py-2 text-sm font-semibold text-[#203524] hover:bg-white/60"><X className="h-4 w-4" aria-hidden />Discard edits</button>
              <button type="button" onClick={resetBlueprint} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#203524]/25 px-4 py-2 text-sm font-semibold text-[#203524] hover:bg-white/60"><RotateCcw className="h-4 w-4" aria-hidden />Reset defaults</button>
              <button type="button" onClick={saveBlueprint} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#203524] px-4 py-2 text-sm font-semibold text-[#D1F470] hover:bg-[#2b4630]" data-testid="blueprint-save"><Save className="h-4 w-4" aria-hidden />Save changes</button>
            </div>
          </div>
          {saveError && <p role="alert" className="mt-3 text-sm font-medium text-red-800">{saveError}</p>}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold">Stage title<input value={s.title} onChange={e => updateStage("title", e.target.value)} className="mt-1.5 block w-full rounded-xl border border-[#11110D]/15 bg-white px-3 py-2.5 font-normal" /></label>
            <label className="text-sm font-semibold">Customer or business value<textarea value={s.value} onChange={e => updateStage("value", e.target.value)} rows={3} className="mt-1.5 block w-full rounded-xl border border-[#11110D]/15 bg-white px-3 py-2.5 font-normal" /></label>
            <label className="text-sm font-semibold">Presenter cue<textarea value={s.presenterCue} onChange={e => updateStage("presenterCue", e.target.value)} rows={4} className="mt-1.5 block w-full rounded-xl border border-[#11110D]/15 bg-white px-3 py-2.5 font-normal" /></label>
            <label className="text-sm font-semibold">Proof to show<textarea value={s.proof} onChange={e => updateStage("proof", e.target.value)} rows={3} className="mt-1.5 block w-full rounded-xl border border-[#11110D]/15 bg-white px-3 py-2.5 font-normal" /></label>
            <label className="text-sm font-semibold md:col-span-2">Transition to the next stage<textarea value={s.transition} onChange={e => updateStage("transition", e.target.value)} rows={2} className="mt-1.5 block w-full rounded-xl border border-[#11110D]/15 bg-white px-3 py-2.5 font-normal" /></label>
          </div>
          <fieldset className="mt-4"><legend className="text-sm font-semibold">Time for this stage</legend><div className="mt-2 flex flex-wrap gap-3">{SESSION_LENGTHS.map(sessionLength => <label key={sessionLength} className="text-sm">{sessionLength}-minute session<input type="number" min={1} max={60} value={s.minutes[sessionLength]} onChange={e => updateMinutes(sessionLength, Number(e.target.value))} className="ml-2 w-20 rounded-lg border border-[#11110D]/15 bg-white px-2 py-1.5" /></label>)}</div></fieldset>
        </div>
      )}
      <p className="mt-2 text-xs text-[#11110D]/60">{BLUEPRINT_TIMING_NOTE}</p>
      <p className="mt-1 text-xs text-[#11110D]/65">Manual stage selection—not a session timer. Presenter cues control visibility, not access.</p>

      <div className="bp-bar mt-3" aria-hidden>
        {stages.map((x, i) => <span key={x.id} className={`bp-bar-seg ${i === index ? "is-on" : ""}`} style={{ flexGrow: x.durationSeconds / total, flexBasis: 0 }} />)}
      </div>
      <div className="mono mt-2 flex justify-between text-xs text-[#11110D]/55" aria-hidden><span>00:00</span><span>{formatBlueprintTime(total)}</span></div>

      <div className="bp-layout mt-3 grid items-start gap-4 lg:grid-cols-12">
        <ol className="bp-stages grid gap-1.5 lg:col-span-5" aria-label="Demo stages">
          {stages.map((x, i) => (
            <li key={x.id}>
              <button type="button" onClick={() => setIndex(i)} aria-pressed={i === index} aria-current={i === index ? "step" : undefined} aria-controls="blueprint-stage-detail"
                data-testid={`blueprint-stage-${x.id}`}
                className={`bp-stage flex min-h-11 w-full items-start gap-2.5 rounded-xl border px-3 py-2 text-left ${i === index ? "bg-[#203524]/8" : "border-[#11110D]/10 bg-[#FBFBF8] hover:bg-[#203524]/5"}`}>
                <span className={`mono grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs ${i === index ? "bg-[#203524] text-[#D1F470]" : "border border-[#11110D]/20"}`}>{x.number}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold leading-snug">{x.title}</span>
                  <span className="mono mt-0.5 flex flex-wrap gap-x-2 text-[0.65rem] text-[#11110D]/65">
                    <span>{range(x.startSeconds, x.endSeconds)}</span><span>{mins(x.durationSeconds)}</span>
                  </span>
                </span>
                {i === index && <span className="sr-only">(selected)</span>}
              </button>
            </li>
          ))}
        </ol>

        <div className="lg:col-span-7">
          <article id="blueprint-stage-detail" tabIndex={0} className="bp-detail rounded-2xl border border-[#11110D]/10 bg-[#FBFBF8] p-4 md:p-5" data-testid="blueprint-detail" aria-labelledby="blueprint-stage-title">
            <div key={`${s.id}-${length}`} className="bp-detail-enter">
            <div className="eyebrow text-[#203524]">Stage {s.number} · {range(s.startSeconds, s.endSeconds)} · {mins(s.durationSeconds)}</div>
            <h3 id="blueprint-stage-title" className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl" aria-live="polite" aria-atomic="true">{s.title}</h3>

            <dl className="mt-3 grid gap-3">
              <div><dt className="eyebrow text-[#11110D]/60">Customer or business value</dt><dd className="mt-1.5 text-lg leading-relaxed">{s.value}</dd></div>
              {cues && <div data-brief-exclude className="rounded-2xl border-l-2 border-[#203524] bg-[#203524]/5 p-4"><dt className="eyebrow text-[#203524]">Presenter cue</dt><dd className="mt-1.5 leading-relaxed text-[#11110D]/80">{s.presenterCue}</dd></div>}
              <div className="rounded-2xl bg-[#D1F470] p-4"><dt className="eyebrow text-[#203524]">Proof to show</dt><dd className="mt-1.5 font-medium">{s.proof}</dd></div>
            </dl>

            {s.timedBeats.length > 0 && (
              <div className="mt-6">
                <h4 className="eyebrow text-[#11110D]/60">Demonstration beats</h4>
                <ol className="mt-3 grid gap-2">
                  {s.timedBeats.map((b, bi) => (
                    <li key={b.label} data-testid={`blueprint-beat-${s.id}-${bi}`} className="rounded-xl border border-[#11110D]/10 p-3">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3"><span className="font-semibold">{b.label}</span><span className="mono text-xs text-[#11110D]/65">{range(b.startSeconds, b.endSeconds)}</span></div>
                      <p className="mt-1 text-sm text-[#11110D]/70">{b.description}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {s.productNotes && (
              <div className="mt-6 grid gap-2">
                <h4 className="eyebrow text-[#11110D]/60">Products demonstrated</h4>
                {s.productNotes.map((n) => (
                  <div key={n.label} className="rounded-xl border border-dashed border-[#203524]/30 p-3">
                    <div className="font-semibold">{n.label}</div><p className="mt-1 text-sm text-[#11110D]/70">{n.description}</p>
                  </div>
                ))}
              </div>
            )}

            {cues && <p className="mt-6 text-[#11110D]/75"><span className="eyebrow mr-2 text-[#203524]">Transition</span><span className="italic">“{s.transition}”</span></p>}

            {s.links.length > 0 && (
              <div className="mt-6">
                <h4 className="eyebrow text-[#11110D]/60">Supporting links</h4>
                <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
                  {s.links.map((l) => (
                    <li key={l.href + l.label}>
                      {l.href.startsWith("http")
                        ? <Ext href={l.href} className="underline underline-offset-4 hover:text-[#203524]">{l.label}</Ext>
                        : <Link href={l.href} className="inline-flex items-center gap-1 underline underline-offset-4 hover:text-[#203524]">{l.label}<ArrowRight className="h-3.5 w-3.5" aria-hidden /></Link>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            </div>

            <div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-[#11110D]/10 pt-3">
              <button type="button" onClick={() => setIndex((v) => Math.max(0, v - 1))} disabled={index === 0} data-testid="blueprint-prev"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#11110D]/15 px-4 py-2 text-sm font-semibold transition hover:bg-[#203524]/8 disabled:cursor-not-allowed disabled:opacity-40">
                <ArrowLeft className="h-4 w-4" aria-hidden /> Previous
              </button>
              <button type="button" onClick={() => setIndex((v) => Math.min(stages.length - 1, v + 1))} disabled={index === stages.length - 1} data-testid="blueprint-next"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#203524] px-4 py-2 text-sm font-semibold text-[#D1F470] transition hover:bg-[#2b4630] disabled:cursor-not-allowed disabled:opacity-40">
                Next <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </article>
        </div>
      </div>
      <Note>{BLUEPRINT_DISCLAIMER}</Note>
    </Section>
  );
}
