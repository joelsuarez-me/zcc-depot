import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { createSupervisor, stepSupervisor } from "@/lib/supervisor-engine";
import type { Scenario, Snapshot } from "@/lib/supervisor-types";

export type Speed = 0.5 | 1 | 2;
type Entry = { snap: Snapshot; label: string };
type Ctx = {
  snap: Snapshot; label: string; index: number; depth: number;
  playing: boolean; started: boolean; speed: Speed; animate: boolean; scenario: Scenario;
  start: (scenario?: Scenario) => void; pause: () => void; resume: () => void;
  next: () => void; prev: () => void; reset: () => void; replay: () => void;
  setSpeed: (s: Speed) => void; setAnimate: (v: boolean) => void; selectScenario: (s: Scenario) => void;
  apply: (fn: (s: Snapshot) => Snapshot, label: string) => boolean;
  error: string | null; clearError: () => void;
};
const C = createContext<Ctx | null>(null);
const MAX = 600;

/** One engine instance for the whole page. History powers Previous Step across ticks, actions and config edits. */
export function SupervisorProvider({ children }: { children: ReactNode }) {
  const [scenario, setScenario] = useState<Scenario>("normal");
  const [hist, setHist] = useState<{ list: Entry[]; i: number }>(() => ({ list: [{ snap: createSupervisor("normal"), label: "Warm baseline loaded" }], i: 0 }));
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const [animate, setAnimate] = useState(() => typeof window === "undefined" || !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  const [error, setError] = useState<string | null>(null);
  const histRef = useRef(hist); histRef.current = hist;

  const push = useCallback((fn: (s: Snapshot) => Snapshot, label: string) => {
    const h = histRef.current;
    const cur = h.list[h.i].snap;
    let nx: Snapshot;
    try { nx = fn(cur); } catch (e) { setError(`${label}: ${e instanceof Error ? e.message : "engine error"}`); return false; }
    if (nx === cur) { setError(`${label}: no change was applied. Check that the target is eligible.`); return false; }
    const list = [...h.list.slice(0, h.i + 1), { snap: nx, label }].slice(-MAX);
    const nh = { list, i: list.length - 1 };
    histRef.current = nh; setHist(nh); setError(null);
    return true;
  }, []);

  const next = useCallback(() => {
    const h = histRef.current;
    if (h.i < h.list.length - 1) { const nh = { ...h, i: h.i + 1 }; histRef.current = nh; setHist(nh); return; }
    const nx = stepSupervisor(h.list[h.i].snap);
    const list = [...h.list, { snap: nx, label: `Advanced 10 simulated seconds` }].slice(-MAX);
    const nh = { list, i: list.length - 1 }; histRef.current = nh; setHist(nh);
  }, []);
  const prev = useCallback(() => { setPlaying(false); const h = histRef.current; const nh = { ...h, i: Math.max(0, h.i - 1) }; histRef.current = nh; setHist(nh); }, []);
  const load = useCallback((sc: Scenario, label: string) => { const nh = { list: [{ snap: createSupervisor(sc), label }], i: 0 }; histRef.current = nh; setHist(nh); setError(null); }, []);

  const start = useCallback((sc?: Scenario) => { const s = sc ?? scenario; setScenario(s); load(s, `Scenario started: ${s}`); setStarted(true); setPlaying(true); }, [scenario, load]);
  const reset = useCallback(() => { setPlaying(false); setStarted(false); load(scenario, `Reset: ${scenario}`); }, [scenario, load]);
  const replay = useCallback(() => { load(scenario, `Replay: ${scenario}`); setStarted(true); setPlaying(true); }, [scenario, load]);
  const selectScenario = useCallback((s: Scenario) => { setScenario(s); setPlaying(false); setStarted(false); load(s, `Scenario selected: ${s}`); }, [load]);

  const nextRef = useRef(next); nextRef.current = next;
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => nextRef.current(), 1000 / speed);
    return () => window.clearInterval(id);
  }, [playing, speed]);

  const cur = hist.list[hist.i];
  const value = useMemo<Ctx>(() => ({
    snap: cur.snap, label: cur.label, index: hist.i, depth: hist.list.length,
    playing, started, speed, animate, scenario,
    start, pause: () => setPlaying(false), resume: () => { setStarted(true); setPlaying(true); }, next: () => { setPlaying(false); next(); }, prev, reset, replay,
    setSpeed, setAnimate, selectScenario, apply: push, error, clearError: () => setError(null),
  }), [cur, hist.i, hist.list.length, playing, started, speed, animate, scenario, start, next, prev, reset, replay, selectScenario, push, error]);
  return <C.Provider value={value}><MotionConfig reducedMotion={animate ? "user" : "always"}><div className={animate ? "sc-anim" : "sc-noanim"} data-testid="wrapper-supervisor-animation">{children}</div></MotionConfig></C.Provider>;
}

export function useSupervisor() {
  const c = useContext(C);
  if (!c) throw new Error("useSupervisor must be used inside SupervisorProvider");
  return c;
}
