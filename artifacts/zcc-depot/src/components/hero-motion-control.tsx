import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";

const KEY = "zcc-depot:hero-motion";

/** One session-wide control for every decorative hero orbit. */
export function HeroMotionControl() {
  const [paused, setPaused] = useState(() => {
    try { return sessionStorage.getItem(KEY) === "paused"; }
    catch { return false; }
  });
  useEffect(() => {
    const value = paused ? "paused" : "playing";
    document.documentElement.dataset.heroMotion = value;
    try { sessionStorage.setItem(KEY, value); } catch { /* Motion still works without storage. */ }
  }, [paused]);
  const label = paused ? "Resume hero animation" : "Pause hero animation";
  return (
    <button type="button" onClick={() => setPaused((p) => !p)}
      className="depot-icon-btn is-light" aria-label={label} title={label}
      aria-pressed={paused} data-testid="button-hero-motion">
      {paused ? <Play className="h-4 w-4" aria-hidden /> : <Pause className="h-4 w-4" aria-hidden />}
    </button>
  );
}
