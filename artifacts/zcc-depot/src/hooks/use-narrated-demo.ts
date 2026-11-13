import { useEffect, useRef, useState } from "react";
import { useDemoPlayback, type DemoPlayback } from "@/hooks/use-demo-playback";
import { useNarration } from "@/components/demo-nuggets/narration-provider";
import { initialNarration, NarratedPlayback } from "@/lib/narrated-playback";
import { playbackFrame, playbackStatus, stageStart } from "@/lib/demo-playback";
import type { DemoNugget, NuggetId } from "@/data/demo-nuggets";

export function useNarratedDemo({ nugget, activeId, onActiveChange }: {
  nugget: DemoNugget; activeId: NuggetId | null; onActiveChange: (id: NuggetId | null) => void;
}) {
  const n = useNarration();
  const visual = useDemoPlayback({ id: nugget.id, stages: nugget.stages, activeId: n.enabled ? null : activeId, onActiveChange });
  const [snapshot, setSnapshot] = useState(initialNarration);
  const controller = useRef<NarratedPlayback | null>(null);
  const latest = useRef({ n, onActiveChange }); latest.current = { n, onActiveChange };

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    const clock = new NarratedPlayback({
      count: nugget.stages.length, audio,
      loadClip: (index, signal) => latest.current.n.getClip(nugget.id, nugget.stages[index].id, signal),
      createUrl: blob => URL.createObjectURL(blob), revokeUrl: url => URL.revokeObjectURL(url),
      onChange: setSnapshot, onFinish: () => latest.current.onActiveChange(null),
    });
    clock.setVolume(latest.current.n.volume);
    controller.current = clock;
    setSnapshot(initialNarration());
    const unregister = latest.current.n.register(nugget.id, () => clock.pause());
    return () => { unregister(); clock.dispose(); if (controller.current === clock) controller.current = null; };
  }, [nugget, n.settingsKey]);

  useEffect(() => { controller.current?.setVolume(n.volume); }, [n.volume]);
  useEffect(() => {
    if (activeId !== nugget.id || !n.enabled) controller.current?.pause();
  }, [activeId, nugget.id, n.enabled]);
  useEffect(() => {
    const hide = () => { if (document.hidden) { controller.current?.pause(); latest.current.onActiveChange(null); } };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, []);

  const activate = () => { n.claim(nugget.id); onActiveChange(nugget.id); };
  const total = nugget.stages.reduce((sum, stage) => sum + stage.durationMs, 0);
  const elapsed = snapshot.complete ? total : stageStart(nugget.stages, snapshot.stepIndex)
    + nugget.stages[snapshot.stepIndex].durationMs * snapshot.fraction;
  const narrated: DemoPlayback = {
    ...playbackFrame(nugget.stages, elapsed),
    playing: snapshot.playing,
    status: playbackStatus(snapshot.complete, snapshot.playing, snapshot.interacted),
    play: () => { activate(); void controller.current?.play(); },
    pause: () => { controller.current?.pause(); onActiveChange(null); },
    replay: () => { activate(); controller.current?.restart(); },
    reset: () => { controller.current?.reset(); onActiveChange(null); },
    seekStep: index => controller.current?.seek(index),
  };
  const visualWithClaim: DemoPlayback = {
    ...visual,
    play: () => { n.claim(nugget.id); visual.play(); },
    replay: () => { n.claim(nugget.id); visual.replay(); },
  };
  const pb = n.enabled ? narrated : visualWithClaim;
  const line = n.lines?.find(item => item.nuggetId === nugget.id && item.id === pb.stage.id);
  return {
    pb, pending: n.enabled && snapshot.pending, error: n.enabled ? snapshot.error : null,
    caption: n.enabled && n.captions && line && pb.status !== "idle" ? line : null,
    voiced: n.enabled,
  };
}
