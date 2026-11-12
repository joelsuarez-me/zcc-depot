import { useEffect, useState } from "react";
import { playbackFrame, playbackStatus, stageStart, type DemoStage } from "@/lib/demo-playback";
import type { NuggetId } from "@/data/demo-nuggets";

type Options = {
  id: NuggetId;
  stages: readonly DemoStage[];
  activeId: NuggetId | null;
  onActiveChange: (id: NuggetId | null) => void;
};

/** One active demo per page; time is retained when paused or another demo starts. */
export function useDemoPlayback({ id, stages, activeId, onActiveChange }: Options) {
  const [elapsed, setElapsed] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const frame = playbackFrame(stages, elapsed);
  const playing = activeId === id && !frame.complete;
  const totalMs = frame.totalMs;

  useEffect(() => {
    if (!playing) return;
    let request = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      if (now - previous >= 80) {
        const delta = now - previous;
        previous = now;
        setElapsed(value => Math.min(totalMs, value + delta));
      }
      request = requestAnimationFrame(tick);
    };
    const visibility = () => { if (document.hidden) onActiveChange(null); };
    request = requestAnimationFrame(tick);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      cancelAnimationFrame(request);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [playing, totalMs, onActiveChange]);

  useEffect(() => {
    if (frame.complete && activeId === id) onActiveChange(null);
  }, [frame.complete, activeId, id, onActiveChange]);

  const play = () => {
    setHasInteracted(true);
    if (frame.complete) setElapsed(0);
    onActiveChange(id);
  };
  const pause = () => { if (activeId === id) onActiveChange(null); };
  const replay = () => { setHasInteracted(true); setElapsed(0); onActiveChange(id); };
  const reset = () => { setHasInteracted(false); setElapsed(0); if (activeId === id) onActiveChange(null); };
  const seekStep = (index: number) => { setHasInteracted(true); setElapsed(stageStart(stages, index)); };
  const status = playbackStatus(frame.complete, playing, hasInteracted);

  return { ...frame, playing, status, play, pause, replay, reset, seekStep };
}

export type DemoPlayback = ReturnType<typeof useDemoPlayback>;
