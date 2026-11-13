import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Pause, Play, RotateCcw } from "lucide-react";

const HIGHLIGHTS = [
  "Architecture & technical insights.",
  "Demo experiences that deliver.",
  "Sales tools that drive adoption.",
  "Your technical edge. All in one place.",
];

export function LandingHeroIntro() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const finished = index === HIGHLIGHTS.length - 1;

  useEffect(() => {
    if (reduce || paused || finished) return;
    const timer = window.setTimeout(() => setIndex(value => value + 1), 2800);
    return () => window.clearTimeout(timer);
  }, [index, paused, finished, reduce]);

  return (
    <div className="landing-intro">
      <p className="landing-intro-credit">Built by ZCC Platform Architects.</p>
      <div className="landing-intro-highlight">
        <span className="sr-only">Architecture, technical insights, demo experiences, and sales enablement—all in one place.</span>
        <div className="landing-intro-slot" aria-hidden="true">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={reduce ? "static" : index}
              initial={reduce ? false : { opacity: 0, y: 8, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(3px)" }}
              transition={{ duration: reduce ? 0 : 0.25 }}
            >
              {HIGHLIGHTS[reduce ? HIGHLIGHTS.length - 1 : index]}
            </motion.span>
          </AnimatePresence>
        </div>
        {!reduce && (
          <button
            type="button"
            className="landing-intro-control"
            aria-label={finished ? "Replay intro animation" : paused ? "Resume intro animation" : "Pause intro animation"}
            onClick={() => {
              if (finished) { setIndex(0); setPaused(false); }
              else setPaused(value => !value);
            }}
          >
            {finished ? <RotateCcw size={14} aria-hidden /> : paused ? <Play size={14} aria-hidden /> : <Pause size={14} aria-hidden />}
          </button>
        )}
      </div>
      <details className="landing-intro-about">
        <summary>About this depot</summary>
        <p>
          Built by Zendesk Contact Center Platform Architects, this centralized resource brings together the architecture, technical insights, demo experiences, and sales enablement tools needed to confidently position, demonstrate, and accelerate the adoption of Zendesk Contact Center.
        </p>
      </details>
    </div>
  );
}
