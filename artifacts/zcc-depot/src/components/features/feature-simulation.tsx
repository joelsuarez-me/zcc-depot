import { useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowUpRight, ChevronLeft, ChevronRight, Expand, Info, Pause, Play, RotateCcw } from "lucide-react";
import type { EnterpriseFeature } from "@/data/feature-types";
import { simFor } from "./sims";
import { usePlayback } from "./use-playback";

export function FeatureSimulation({ feature }: { feature: EnterpriseFeature }) {
  const def = useMemo(() => simFor(feature), [feature]);
  const [scIdx, setScIdx] = useState(0);
  const sc = def.scenarios[Math.min(scIdx, def.scenarios.length - 1)];
  return <SimRun key={feature.id + sc.id} feature={feature} def={def} sc={sc} scIdx={scIdx} setScIdx={setScIdx} />;
}

function SimRun({ feature, def, sc, scIdx, setScIdx }: { feature: EnterpriseFeature; def: ReturnType<typeof simFor>; sc: ReturnType<typeof simFor>["scenarios"][number]; scIdx: number; setScIdx: (n: number) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const pb = usePlayback(sc.steps.length);
  const step = sc.steps[pb.index];
  const past = sc.steps.slice(0, pb.index + 1);
  const log = past.filter((s) => s.log).map((s) => s.log!);
  const says = past.filter((s) => s.say).map((s) => s.say!);
  const status = [...past].reverse().find((s) => s.status)?.status;
  const href = feature.demo.href;
  const full = () => { const el = box.current; if (!el) return; if (document.fullscreenElement) void document.exitFullscreen(); else void el.requestFullscreen?.().catch(() => undefined); };

  if (sc.steps.length === 0) return <div className="fx-empty text-sm">This walkthrough has no architecture steps yet.</div>;
  return (
    <div ref={box} className="fx-sim space-y-3" data-testid={`sim-${feature.id}`}>
      <p className="flex items-start gap-2 rounded-xl border border-[#c9a65a]/50 bg-[#F6EFDD] px-3 py-2 text-xs text-[#5a4410]" data-testid="text-sim-disclosure">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />Simulation only. All names, numbers, requests and results are fictional and illustrative; they are not promised outcomes and no real systems are contacted.
      </p>
      {(feature.demo.kind === "ivr" || feature.classifications.includes("Availability Requires Verification")) && (
        <p className="rounded-xl border border-[#a2361f]/30 bg-[#F7E0DA] px-3 py-2 text-xs text-[#7a2a18]" data-testid="text-sim-availability"><strong>Availability for this feature:</strong> {feature.availability} {feature.demo.kind === "ivr" && "This walkthrough uses a generic, AWS-configured Amazon Lex illustration and is not a live native Zendesk voice AI demonstration."}</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {def.scenarios.length > 1 && (
          <div role="group" aria-label={def.scenarioLabel} className="flex flex-wrap gap-1.5">
            {def.scenarios.map((s, i) => (
              <button key={s.id} type="button" aria-pressed={i === scIdx} onClick={() => setScIdx(i)} data-testid={`button-scenario-${s.id}`}
                className={`fx-btn ${i === scIdx ? "fx-btn-ink" : "fx-btn-ghost"}`}>{s.label}</button>
            ))}
          </div>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <button type="button" className="fx-btn fx-btn-ghost" onClick={pb.prev} disabled={pb.index === 0} aria-label="Previous step" data-testid="button-sim-prev"><ChevronLeft className="h-4 w-4" aria-hidden /></button>
          {pb.playing
            ? <button type="button" className="fx-btn fx-btn-ink" onClick={pb.pause} data-testid="button-sim-pause"><Pause className="h-4 w-4" aria-hidden />Pause</button>
            : <button type="button" className="fx-btn fx-btn-ink" onClick={pb.play} data-testid="button-sim-play"><Play className="h-4 w-4" aria-hidden />{pb.index === 0 ? "Play" : pb.index >= sc.steps.length - 1 ? "Replay" : "Resume"}</button>}
          <button type="button" className="fx-btn fx-btn-ghost" onClick={pb.next} disabled={pb.index >= sc.steps.length - 1} aria-label="Next step" data-testid="button-sim-next"><ChevronRight className="h-4 w-4" aria-hidden /></button>
          <button type="button" className="fx-btn fx-btn-ghost" onClick={() => { pb.reset(); setScIdx(0); }} data-testid="button-sim-reset"><RotateCcw className="h-4 w-4" aria-hidden />Reset</button>
          <button type="button" className="fx-btn fx-btn-ghost fx-desktop-only" onClick={full} aria-label="Toggle simulation fullscreen" data-testid="button-sim-fullscreen"><Expand className="h-4 w-4" aria-hidden /></button>
        </div>
      </div>
      <p className="text-xs text-[#11110D]/60">{sc.summary}</p>
      <ol className="fx-sim-stages" aria-label="Stages">
        {def.stages.map((s, i) => <li key={s + i} className={`fx-stage ${i === step.stage ? "is-on" : i < step.stage ? "is-past" : ""}`} aria-current={i === step.stage ? "step" : undefined}><span className="mono">{i + 1}</span>{s}</li>)}
      </ol>
      <div className="fx-progress" aria-hidden><span style={{ transform: `scaleX(${(pb.index + 1) / sc.steps.length})` }} /></div>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#11110D] px-3 py-2 text-sm text-[#F5F5F2]" aria-live="polite" data-testid="text-sim-caption">
        <span><span className="mono mr-2 text-xs text-[#D1F470]">Step {pb.index + 1}/{sc.steps.length}</span>{step.caption}</span>
        {status && <span className={`fx-status t-${status.tone}`} data-testid="status-sim">{status.label}</span>}
      </div>
      {step.actionLabel && <button type="button" className="fx-btn fx-btn-ink" onClick={pb.next} data-testid="button-sim-action">{step.actionLabel}<ChevronRight className="h-4 w-4" aria-hidden /></button>}
      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <div key={pb.index} className="fx-enter grid gap-3 sm:grid-cols-2">
          {step.panels.map((p) => (
            <section key={p.title} className="fx-panel">
              <h4 className="fx-h">{p.title}</h4>
              <dl>{p.rows.map(([k, v, t]) => <div key={k} className="fx-row"><dt>{k}</dt><dd className={t ? `fx-tone-${t}` : ""}>{v}</dd></div>)}</dl>
              {p.note && <p className="mt-2 text-[0.7rem] text-[#11110D]/55">{p.note}</p>}
            </section>
          ))}
        </div>
        <div className="space-y-3">
          {says.length > 0 && (
            <section className="fx-panel"><h4 className="fx-h">Transcript (sample)</h4>
              <div className="flex flex-col gap-1.5">{says.map((s, i) => <p key={i} className={`fx-say ${s.who === "Caller" ? "is-caller" : "is-other"}`}><span className="mono mr-1.5 text-[0.65rem] opacity-70">{s.who}</span>{s.text}</p>)}</div>
            </section>
          )}
          <section><h4 className="fx-h">Event log</h4><ol className="fx-log">{log.map((l, i) => <li key={i}>{l}</li>)}</ol></section>
        </div>
      </div>
      <div className="fx-panel">
        <h4 className="fx-h">Who owns what</h4>
        <ul className="list-disc space-y-1 pl-4 text-xs text-[#11110D]/70">{def.boundary.map((b) => <li key={b}>{b}</li>)}</ul>
      </div>
      {href && (
        <Link href={href} className="fx-btn fx-btn-ghost w-fit" data-testid="link-sim-full-lab">{feature.demo.label}<ArrowUpRight className="h-4 w-4" aria-hidden /></Link>
      )}
    </div>
  );
}
