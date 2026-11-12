import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Ext, Note, Section, SectionHead } from "@/components/kit";
import {
  BLUEPRINT_DESCRIPTION, BLUEPRINT_DISCLAIMER, BLUEPRINT_TIMING_NOTE, DEFAULT_SESSION_LENGTH,
  SESSION_LENGTHS, buildBlueprintTimeline, formatBlueprintTime, type SessionLength,
} from "@/data/demo-blueprint";
import "./demo-blueprint.css";

const range = (a: number, b: number) => `${formatBlueprintTime(a)}–${formatBlueprintTime(b)}`;
const mins = (s: number) => { const m = s / 60; return `${Number.isInteger(m) ? m : m.toFixed(1)} min`; };

export function DemoBlueprint() {
  const [length, setLength] = useState<SessionLength>(DEFAULT_SESSION_LENGTH);
  const [index, setIndex] = useState(0);
  const [cues, setCues] = useState(true);
  const stages = useMemo(() => buildBlueprintTimeline(length), [length]);
  const s = stages[index];
  const total = length * 60;

  return (
    <Section className="demo-blueprint-section">
      <SectionHead id="agenda" eyebrow="DEMO METHODOLOGY" title="Demo Blueprint" lede={BLUEPRINT_DESCRIPTION} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div role="group" aria-label="Session length" className="inline-flex rounded-full border border-[#11110D]/15 bg-[#FBFBF8] p-1">
          {SESSION_LENGTHS.map((l) => (
            <button key={l} type="button" onClick={() => setLength(l)} aria-pressed={l === length} data-testid={`session-${l}`}
              className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${l === length ? "bg-[#203524] text-[#D1F470]" : "text-[#11110D]/70 hover:bg-[#203524]/8"}`}>
              {l} min
            </button>
          ))}
        </div>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
          <input type="checkbox" checked={cues} onChange={(e) => setCues(e.target.checked)} data-testid="blueprint-cues"
            className="h-4 w-4 accent-[#203524]" />
          Show presenter cues
        </label>
      </div>
      <p className="mt-3 text-sm text-[#11110D]/60">{BLUEPRINT_TIMING_NOTE}</p>
      <p className="mt-1 text-xs text-[#11110D]/65">Manual stage selection—not a session timer. Presenter cues control visibility, not access.</p>

      <div className="bp-bar mt-6" aria-hidden>
        {stages.map((x, i) => <span key={x.id} className={`bp-bar-seg ${i === index ? "is-on" : ""}`} style={{ flexGrow: x.durationSeconds / total, flexBasis: 0 }} />)}
      </div>
      <div className="mono mt-2 flex justify-between text-xs text-[#11110D]/55" aria-hidden><span>00:00</span><span>{formatBlueprintTime(total)}</span></div>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <ol className="grid gap-2 lg:col-span-5" aria-label="Demo stages">
          {stages.map((x, i) => (
            <li key={x.id}>
              <button type="button" onClick={() => setIndex(i)} aria-pressed={i === index} aria-current={i === index ? "step" : undefined} aria-controls="blueprint-stage-detail"
                data-testid={`blueprint-stage-${x.id}`}
                className={`bp-stage flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left ${i === index ? "bg-[#203524]/8" : "border-[#11110D]/10 bg-[#FBFBF8] hover:bg-[#203524]/5"}`}>
                <span className={`mono grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs ${i === index ? "bg-[#203524] text-[#D1F470]" : "border border-[#11110D]/20"}`}>{x.number}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold leading-snug">{x.title}</span>
                  <span className="mono mt-1 flex flex-wrap gap-x-3 text-xs text-[#11110D]/65">
                    <span>{range(x.startSeconds, x.endSeconds)}</span><span>{mins(x.durationSeconds)}</span>
                  </span>
                </span>
                {i === index && <span className="sr-only">(selected)</span>}
              </button>
            </li>
          ))}
        </ol>

        <div className="lg:col-span-7">
          <article id="blueprint-stage-detail" className="rounded-[2rem] border border-[#11110D]/10 bg-[#FBFBF8] p-6 md:p-8" data-testid="blueprint-detail" aria-labelledby="blueprint-stage-title">
            <div key={`${s.id}-${length}`} className="bp-detail-enter">
            <div className="eyebrow text-[#203524]">Stage {s.number} · {range(s.startSeconds, s.endSeconds)} · {mins(s.durationSeconds)}</div>
            <h3 id="blueprint-stage-title" className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl" aria-live="polite" aria-atomic="true">{s.title}</h3>

            <dl className="mt-6 grid gap-5">
              <div><dt className="eyebrow text-[#11110D]/60">Customer or business value</dt><dd className="mt-1.5 text-lg leading-relaxed">{s.value}</dd></div>
              {cues && <div className="rounded-2xl border-l-2 border-[#203524] bg-[#203524]/5 p-4"><dt className="eyebrow text-[#203524]">Presenter cue</dt><dd className="mt-1.5 leading-relaxed text-[#11110D]/80">{s.presenterCue}</dd></div>}
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

            <div className="mt-8 flex flex-wrap justify-between gap-2 border-t border-[#11110D]/10 pt-5">
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
