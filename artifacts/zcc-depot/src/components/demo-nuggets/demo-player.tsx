import { useEffect, useImperativeHandle, type ReactNode, type Ref } from "react";
import { Loader2, Pause, Play, RotateCcw } from "lucide-react";
import type { DemoPlayback } from "@/hooks/use-demo-playback";
import { useNarratedDemo } from "@/hooks/use-narrated-demo";
import { useNarration } from "./narration-provider";
import type { DemoNugget, NuggetId } from "@/data/demo-nuggets";
import { useSceneText, SCENE_ROLE_LABELS } from "./scene-copy";
import "./demo-nuggets.css";
import { DemoAudioStatus } from "./demo-audio-status";
import { SimulationCaption } from "@/components/simulation-caption";

export type DemoPlayerControls = Pick<DemoPlayback, "play">;
type Props = {
  nugget: DemoNugget; activeId: NuggetId | null; onActiveChange: (id: NuggetId | null) => void;
  children: (pb: DemoPlayback) => ReactNode; dark?: boolean;
  controlsRef?: Ref<DemoPlayerControls>;
  onPendingChange?: (id: NuggetId, pending: boolean) => void;
  playlistNavigation?: { index: number; total: number; onPrevious: () => void; onNext: () => void; onStop: () => void };
};

export function DemoPlayer({ nugget, activeId, onActiveChange, children, dark = false, controlsRef, onPendingChange, playlistNavigation }: Props) {
  const { pb, pending, error, caption, voiced } = useNarratedDemo({ nugget, activeId, onActiveChange });
  useImperativeHandle(controlsRef, () => ({ play: pb.play }), [pb.play]);
  useEffect(() => {
    onPendingChange?.(nugget.id, pending);
    return () => onPendingChange?.(nugget.id, false);
  }, [nugget.id, pending, onPendingChange]);
  const narration = useNarration();
  const { locale, t } = useSceneText();
  const id = nugget.id;
  const label = pending ? "Cancel" : pb.playing ? "Pause" : pb.status === "paused" ? "Resume" : pb.complete ? "Play again" : "Play";
  const toggle = () => (pb.playing || pending ? pb.pause() : pb.play());
  const statusText = pending ? "Preparing ElevenLabs audio…" : error ? "Audio unavailable — retry or use visual-only mode" : { idle: "Ready to play", playing: "Playing", paused: "Paused", complete: "Complete" }[pb.status];
  const ink = dark ? "text-[#F5F5F2]" : "text-[#11110D]";

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${pb.playing ? "" : "dn-paused"} ${pb.status === "idle" ? "dn-idle" : ""}`} data-testid={`demo-${id}`}>
      <div className="relative min-w-0 lg:col-span-8">
        <div className={`dn-stage ${dark ? "is-dark" : ""}`} data-testid={`stage-${id}`} data-step={pb.stage.id}>
          <div lang={locale} className="pointer-events-none absolute left-4 top-4 z-20 rounded-full bg-[#11110D]/80 px-3 py-1 text-[0.62rem] uppercase tracking-[.14em] text-[#D1F470] mono">{t("Simulation · sample data")}</div>
          {children(pb)}
          {pb.status === "idle" && (
            <button type="button" onClick={pb.play} data-testid={`button-overlay-play-${id}`} aria-label={`Play ${nugget.title} demo`}
              className="group absolute inset-0 z-30 grid place-items-center bg-[#11110D]/25 backdrop-blur-[1px] transition-colors hover:bg-[#11110D]/15">
              <span className="flex items-center gap-3 rounded-full bg-[#D1F470] py-3 pl-3 pr-6 text-base font-semibold text-[#11110D] shadow-[0_20px_40px_-15px_rgba(17,17,13,.6)] transition-transform group-hover:scale-105">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#203524] text-[#D1F470]"><Play className="h-5 w-5 translate-x-px" fill="currentColor" aria-hidden /></span>
                {voiced && narration.volume > 0 ? "Play with audio" : "Play without audio"}
              </span>
            </button>
          )}
        </div>
        <div className="mt-3"><SimulationCaption title={pb.stage.label} status={statusText} step={`Step ${pb.stepIndex + 1} of ${nugget.stages.length}`}>{pb.stage.description}</SimulationCaption></div>
        {caption && <div className={`mt-3 rounded-2xl border p-4 text-sm leading-relaxed ${dark ? "border-white/15 bg-white/5 text-[#F5F5F2]" : "border-[#203524]/15 bg-[#FBFBF8] text-[#11110D]"}`} data-testid={`caption-${id}`}>
          <span lang={locale} className={`mb-1 block text-xs font-semibold ${dark ? "text-[#D1F470]" : "text-[#203524]"}`}>{t(SCENE_ROLE_LABELS[caption.role])} · {t("AI-generated dialogue")}</span>
          <span lang={caption.locale}>{caption.text}</span>
        </div>}
      </div>

      <div className={`flex min-w-0 flex-col gap-4 lg:col-span-4 ${ink}`}>
        {playlistNavigation && <nav aria-label="Playlist transport" className="flex flex-wrap items-center gap-3 rounded-xl border border-current/20 p-3 text-xs">
          <span className="w-full font-semibold">Playlist · Demo {playlistNavigation.index + 1} of {playlistNavigation.total}</span>
          <button type="button" data-testid={`button-playlist-previous-${id}`} disabled={playlistNavigation.index === 0} onClick={playlistNavigation.onPrevious} className="min-h-11 font-semibold underline disabled:opacity-40">Previous demo</button>
          <button type="button" data-testid={`button-playlist-next-${id}`} disabled={playlistNavigation.index === playlistNavigation.total - 1} onClick={playlistNavigation.onNext} className="min-h-11 font-semibold underline disabled:opacity-40">Next demo</button>
          <a href="#playlist" onClick={playlistNavigation.onStop} data-testid={`link-playlist-edit-${id}`} className="inline-flex min-h-11 items-center underline">Edit / share playlist</a>
        </nav>}
        <div className="flex items-center gap-2">
          <button type="button" onClick={toggle} aria-pressed={pb.playing} aria-label={`${label} ${nugget.title} demo`} data-testid={`button-play-${id}`}
            className="inline-flex items-center gap-2 rounded-full bg-[#D1F470] px-5 py-2.5 text-sm font-semibold text-[#11110D] transition-transform hover:-translate-y-0.5">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : pb.playing ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}{label}
          </button>
          <button type="button" onClick={pb.replay} aria-label={`Restart ${nugget.title} demo from the beginning`} data-testid={`button-replay-${id}`}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors ${dark ? "border-[#F5F5F2]/20 hover:bg-[#F5F5F2]/10" : "border-[#11110D]/15 hover:bg-[#11110D]/5"}`}>
            <RotateCcw className="h-4 w-4" aria-hidden />Restart
          </button>
        </div>
        <DemoAudioStatus id={id} dark={dark} />
        {error && <div role="alert" className={`rounded-xl border p-3 text-sm ${dark ? "border-[#D1F470]/30 bg-white/10" : "border-[#9A4C2C]/25 bg-[#FFF7EF]"}`} data-testid={`error-narration-${id}`}>
          <p>{error}</p>
          <button type="button" onClick={pb.play} className="mr-4 mt-2 min-h-11 font-semibold underline">Retry narration</button>
          <button type="button" onClick={() => narration.setEnabled(false)} className="mt-2 min-h-11 font-semibold underline">Use visual-only playback</button>
        </div>}
        <div>
          <div className="mono mb-1.5 flex justify-between text-[0.68rem] uppercase tracking-[.14em] opacity-60">
            <span data-testid={`status-${id}`} role="status">{statusText}</span>
            <span>Step {pb.stepIndex + 1} / {nugget.stages.length}</span>
          </div>
          <div className={`h-1.5 overflow-hidden rounded-full ${dark ? "bg-[#F5F5F2]/10" : "bg-[#11110D]/10"}`} aria-hidden>
            <div className="h-full w-full origin-left rounded-full bg-[#7DA33A]" style={{ transform: `scaleX(${pb.progress})` }} />
          </div>
        </div>
        <ol lang={locale} className="space-y-1.5" aria-label={`${nugget.title} steps`}>
          {nugget.stages.map((s, i) => {
            const cur = i === pb.stepIndex && pb.status !== "idle";
            const done = i < pb.stepIndex || pb.complete;
            return (
              <li key={s.id}>
                <button type="button" onClick={() => pb.seekStep(i)} aria-current={cur ? "step" : undefined} data-testid={`button-step-${id}-${s.id}`}
                  className={`w-full rounded-2xl border p-3 text-left transition-colors ${cur ? "border-[#7DA33A] bg-[#D1F470]/25" : dark ? "border-[#F5F5F2]/10 hover:bg-[#F5F5F2]/5" : "border-[#11110D]/10 hover:bg-[#11110D]/[.04]"}`}>
                  <div className="flex items-center gap-2.5 text-sm font-semibold">
                    <span className={`mono grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.65rem] ${done || cur ? "bg-[#203524] text-[#D1F470]" : dark ? "bg-[#F5F5F2]/10" : "bg-[#11110D]/10"}`}>{String(i + 1).padStart(2, "0")}</span>
                    {s.label}
                  </div>
                  {cur && <p className="mt-1.5 pl-[2.1rem] text-xs leading-relaxed opacity-70">{s.description}</p>}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
