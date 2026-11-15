import { useEffect, useState } from "react";

/** Deterministic timed playback over a fixed number of steps. */
export function usePlayback(count: number, intervalMs = 2600) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    if (index >= count - 1) { setPlaying(false); return; }
    const t = setTimeout(() => setIndex((i) => Math.min(i + 1, count - 1)), intervalMs);
    return () => clearTimeout(t);
  }, [playing, index, count, intervalMs]);
  return {
    index, playing,
    play: () => { if (index >= count - 1) setIndex(0); setPlaying(true); },
    pause: () => setPlaying(false),
    next: () => { setPlaying(false); setIndex((i) => Math.min(i + 1, count - 1)); },
    prev: () => { setPlaying(false); setIndex((i) => Math.max(i - 1, 0)); },
    reset: () => { setPlaying(false); setIndex(0); },
  };
}
