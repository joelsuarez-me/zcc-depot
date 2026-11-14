import { useEffect, useState, type ReactNode } from "react";
import { Maximize2, Minimize2, Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import type { AgentSnap, DialCounters, PlaybackAction, Tone } from "@/lib/outbound-dialer";
import { DOCS, type DocKey } from "@/data/outbound-content";

export type TagKind = "native" | "custom" | "org" | "legal" | "concept" | "demo";
const TAG_TEXT: Record<TagKind, string> = { native: "Native AWS", custom: "Custom integration", org: "Org policy", legal: "Counsel review", concept: "Conceptual", demo: "Demo only" };
export function Tag({ k, children }: { k: TagKind; children?: ReactNode }) { return <span className={`ob-tag ${k}`}>{children ?? TAG_TEXT[k]}</span>; }

export function Field({ label, children, error, id }: { label: string; children: ReactNode; error?: string; id?: string }) {
  return <label className="ob-field" htmlFor={id}><span>{label}</span>{children}{error && <em className="ob-err not-italic" role="alert">{error}</em>}</label>;
}
export function Slider({ label, value, min, max, step = 1, unit = "", onChange, id }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void; id: string }) {
  return (
    <label className="ob-field" htmlFor={id}>
      <span className="flex justify-between"><span>{label}</span><b className="mono text-[0.72rem]">{value.toLocaleString()}{unit}</b></span>
      <input id={id} type="range" className="ob-range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} data-testid={`slider-${id}`} />
    </label>
  );
}

/** True when the OS asks for reduced motion OR the global hero-motion pause is on. */
export function useMotionPaused(): boolean {
  const read = () => (typeof window !== "undefined" && (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.heroMotion === "paused")) || false;
  const [p, setP] = useState(read);
  useEffect(() => {
    const mo = new MutationObserver(() => setP(read())); mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-hero-motion"] });
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)"); const on = () => setP(read()); mq?.addEventListener?.("change", on);
    return () => { mo.disconnect(); mq?.removeEventListener?.("change", on); };
  }, []);
  return p;
}

export function PlayBar({ idx, len, running, speed, onAction, onSpeed, label, testid }: { idx: number; len: number; running: boolean; speed: number; onAction: (a: PlaybackAction) => void; onSpeed: (s: number) => void; label: string; testid: string }) {
  return (
    <div className="ob-bar on-dark" role="toolbar" aria-label={`${label} playback`}>
      <span className="mono mr-1 text-[0.7rem] text-[#F5F5F2]/60" data-testid={`text-${testid}-step`}>Step {idx + 1} / {len}</span>
      <button type="button" onClick={() => onAction("reset")} aria-label="Restart" data-testid={`button-${testid}-reset`}><RotateCcw className="h-3.5 w-3.5" aria-hidden /></button>
      <button type="button" onClick={() => onAction("prev")} disabled={idx === 0} aria-label="Previous step" data-testid={`button-${testid}-prev`}><SkipBack className="h-3.5 w-3.5" aria-hidden /></button>
      <button type="button" className="is-on" onClick={() => onAction(running ? "pause" : "play")} data-testid={`button-${testid}-play`}>{running ? <Pause className="h-3.5 w-3.5" aria-hidden /> : <Play className="h-3.5 w-3.5" aria-hidden />}{running ? "Pause" : idx >= len - 1 ? "Replay" : "Play"}</button>
      <button type="button" onClick={() => onAction("next")} disabled={idx >= len - 1} aria-label="Next step" data-testid={`button-${testid}-next`}><SkipForward className="h-3.5 w-3.5" aria-hidden /></button>
      <button type="button" onClick={() => onAction("end")} disabled={idx >= len - 1} data-testid={`button-${testid}-end`}>End</button>
      <span className="ml-auto flex gap-0.5">{[0.5, 1, 2].map((s) => <button key={s} type="button" className={speed === s ? "is-on" : ""} aria-pressed={speed === s} onClick={() => onSpeed(s)} data-testid={`button-${testid}-speed-${s}`}>{s}x</button>)}</span>
    </div>
  );
}

const ST: Record<string, string> = { available: "Available", talk: "On call", acw: "After contact work", offline: "Offline", reserved: "Reserved by other campaign" };
export function AgentBoard({ agents }: { agents: AgentSnap[] }) {
  if (!agents.length) return <div className="ob-card text-sm"><span className="ob-h">Agents</span>No agent is required for the automated interaction. A staffed queue is needed only if the flow transfers.</div>;
  return (
    <div className="ob-card"><span className="ob-h">Agent availability</span>
      <div className="ob-agents">{agents.map((a) => (
        <div key={a.id} className={`ob-agent ${a.status}`} data-testid={`agent-${a.id}`}>
          <span className="ring">{a.name.split(" ").map((x) => x[0]).join("")}</span>
          <span className="min-w-0 text-xs leading-tight"><b className="block truncate">{a.name}</b>{ST[a.status]}{a.customer ? ` · ${a.customer}` : ""}<span className="block opacity-60">{a.handled} handled</span></span>
        </div>))}</div>
    </div>
  );
}
export function Lifecycle({ states, current, label = "Contact lifecycle" }: { states: string[]; current: string; label?: string }) {
  const ci = states.indexOf(current);
  return <div className="ob-card"><span className="ob-h">{label}</span><div className="ob-life">{states.map((s, i) => <span key={s} className={i === ci ? "is-on" : i < ci ? "is-past" : ""} aria-current={i === ci ? "step" : undefined}>{s}</span>)}</div></div>;
}
export function Counters({ c, keys }: { c: DialCounters; keys: (keyof DialCounters)[] }) {
  const L: Record<keyof DialCounters, string> = { dialed: "Dialed", answered: "Answered", human: "Human", connected: "Connected", abandoned: "Abandoned", noAnswer: "No answer", voicemail: "Voicemail", completed: "Completed", transferred: "Transferred", retries: "Retries", collisions: "Collisions" };
  return <div className="ob-stats">{keys.map((k) => <div key={k} className="ob-stat" data-testid={`stat-${k}`}><b>{c[k].toLocaleString()}</b><small>{L[k]}</small></div>)}</div>;
}
const fmtT = (t: number) => `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, "0")}`;
export function ExecLog({ items, idx, onJump }: { items: { t: number; label: string; tone: Tone; custom?: boolean }[]; idx: number; onJump?: (i: number) => void }) {
  return (
    <div className="ob-card"><span className="ob-h">Execution log · simulated clock</span>
      <div className="ob-log" aria-live="polite">{items.slice(0, idx + 1).map((e, i) => (
        <button key={i} type="button" className={i === idx ? "is-on" : ""} onClick={() => onJump?.(i)} data-testid={`log-${i}`}><time>{fmtT(e.t)}</time><span className={`ob-dot ${e.tone}`} aria-hidden /><span>{e.label}{e.custom && <> <Tag k="custom">custom</Tag></>}</span></button>
      )).reverse()}</div>
    </div>
  );
}
export function WhatJustHappened({ title, children }: { title: string; children: ReactNode }) {
  return <div className="ob-wjh" aria-live="polite" data-testid="text-what-just-happened"><strong>What just happened?</strong><span className="font-semibold">{title}</span><span className="opacity-80">{children}</span></div>;
}
export function FullscreenButton({ target, testid }: { target: string; testid: string }) {
  const [fs, setFs] = useState(false);
  useEffect(() => { const on = () => setFs(!!document.fullscreenElement); document.addEventListener("fullscreenchange", on); return () => document.removeEventListener("fullscreenchange", on); }, []);
  const toggle = () => {
    if (document.fullscreenElement) { void document.exitFullscreen?.(); return; }
    const el = document.getElementById(target); void el?.requestFullscreen?.().catch(() => undefined);
  };
  return <button type="button" className="ob-btn" onClick={toggle} aria-pressed={fs} data-testid={`button-fullscreen-${testid}`}>{fs ? <Minimize2 className="h-3.5 w-3.5" aria-hidden /> : <Maximize2 className="h-3.5 w-3.5" aria-hidden />}{fs ? "Exit full screen" : "Full screen"}</button>;
}
export function Sources({ keys, note }: { keys: DocKey[]; note?: string }) {
  return <p className="mt-4 border-l-2 border-[#11110D]/20 pl-3 text-xs leading-relaxed text-[#11110D]/60">{note ? `${note} ` : ""}Sources reviewed 2026-11-13: {keys.map((k, i) => <span key={k}>{i ? " · " : ""}<a className="underline" href={DOCS[k].url} target="_blank" rel="noreferrer">{DOCS[k].label}</a></span>)}.</p>;
}
export function usePlayback(len: number, speed: number) {
  const [pb, setPb] = useState({ index: 0, running: false });
  useEffect(() => { if (!pb.running) return; const t = setTimeout(() => setPb((p) => (p.index >= len - 1 ? { index: len - 1, running: false } : { index: p.index + 1, running: true })), 1200 / speed); return () => clearTimeout(t); }, [pb, speed, len]);
  return [pb, setPb] as const;
}

/** Functional step transport shared by every step-based experience (AMD, journey, Zendesk, industries). */
export function useStepper(len: number) {
  const [speed, setSpeed] = useState(1);
  const [pb, setPb] = usePlayback(len, speed);
  const idx = Math.min(pb.index, Math.max(0, len - 1));
  const onAction = (a: PlaybackAction) => setPb((p) => {
    const last = Math.max(0, len - 1);
    if (a === "play") return { index: p.index >= last ? 0 : p.index, running: true };
    if (a === "pause") return { ...p, running: false };
    if (a === "next") return { index: Math.min(last, p.index + 1), running: false };
    if (a === "prev") return { index: Math.max(0, p.index - 1), running: false };
    if (a === "end") return { index: last, running: false };
    return { index: 0, running: false };
  });
  const jump = (i: number) => setPb({ index: i, running: false });
  return { idx, running: pb.running, speed, setSpeed, onAction, jump };
}
