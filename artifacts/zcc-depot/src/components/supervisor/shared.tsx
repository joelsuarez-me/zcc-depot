import { useEffect, useRef, useState } from "react";
import { animate as fmAnimate } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { useDepot } from "@/lib/depot-mode";
import { usePresenterContent } from "@/hooks/use-presenter-content";
import { PresenterGate } from "@/components/presenter";
import { SUPERVISOR_SOURCES, SUPERVISOR_REVIEW_DATE } from "@/data/supervisor-reference";
import { BASE_TIME, type Agent, type AgentState, type Snapshot } from "@/lib/supervisor-types";
import { useSupervisor } from "./supervisor-session";

export const DASH = "\u2014";
export const pct = (n: number | null | undefined, d = 1) => (n == null || !Number.isFinite(n) ? DASH : `${n.toFixed(d)}%`);
export const secs = (n: number | null | undefined) => {
  if (n == null || !Number.isFinite(n)) return DASH;
  const v = Math.max(0, Math.round(n)); const m = Math.floor(v / 60); const s = v % 60;
  return m >= 60 ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m` : `${m}:${String(s).padStart(2, "0")}`;
};
export const clockLabel = (t: number) => new Date(BASE_TIME + t * 1000).toISOString().slice(11, 19) + " UTC";
export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
export const agentName = (s: Snapshot, id?: string) => (id ? s.agents.find((a) => a.id === id)?.name ?? id : DASH);
export const STATE_CLASS: Record<AgentState, string> = {
  Available: "is-avail", "On Contact": "is-call", "After Contact Work": "is-acw", Break: "is-break", Lunch: "is-lunch", Offline: "is-off", "Custom Status": "is-custom",
};
export const STATE_COLOR: Record<AgentState, string> = {
  Available: "#3f8f5b", "On Contact": "#1F4E79", "After Contact Work": "#b7791f", Break: "#8a6bbf", Lunch: "#9b5f45", Offline: "#8b8b84", "Custom Status": "#c2477f",
};
export const isIdle = (a: Agent) => a.state === "Available";

/** Smoothly animated numeric counter; honors the global animation toggle. */
export function Counter({ value, format }: { value: number | null; format: (n: number | null) => string }) {
  const { animate } = useSupervisor();
  const [shown, setShown] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    if (value == null || prev.current == null || !animate) { setShown(value); prev.current = value; return; }
    const c = fmAnimate(prev.current, value, { duration: 0.6, ease: "easeOut", onUpdate: (v) => setShown(v) });
    prev.current = value;
    return () => c.stop();
  }, [value, animate]);
  return <>{format(shown)}</>;
}

export function Gauge({ value, target, label, size = 120, testId }: { value: number | null; target?: number; label: string; size?: number; testId: string }) {
  const r = 44; const c = Math.PI * r; const v = value == null ? 0 : Math.max(0, Math.min(100, value));
  const tone = value == null ? "#8b8b84" : target == null ? "#1F4E79" : value >= target ? "#3f8f5b" : value >= target - 10 ? "#b7791f" : "#b5412b";
  const ta = target != null ? Math.PI * (1 - target / 100) : 0;
  return (
    <figure className="sc-gauge" style={{ width: size }} data-testid={testId} aria-label={`${label}: ${pct(value)}${target != null ? `, target ${target}%` : ""}`}>
      <svg viewBox="0 0 110 64" role="img" aria-hidden>
        <path d="M11 58 A44 44 0 0 1 99 58" fill="none" stroke="rgba(17,17,13,.12)" strokeWidth="10" strokeLinecap="round" />
        <path d="M11 58 A44 44 0 0 1 99 58" fill="none" stroke={tone} strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} className="sc-gauge-arc" />
        {target != null && <line x1={55 + 36 * Math.cos(ta)} y1={58 - 36 * Math.sin(ta)} x2={55 + 52 * Math.cos(ta)} y2={58 - 52 * Math.sin(ta)} stroke="#11110D" strokeWidth="2" />}
      </svg>
      <figcaption><b className="mono">{pct(value)}</b><span>{label}</span></figcaption>
    </figure>
  );
}

export function Sources({ keys, note }: { keys: string[]; note?: string }) {
  const list = SUPERVISOR_SOURCES.filter((s) => keys.includes(s.id));
  return (
    <div className="sc-sources" data-testid={`sources-${keys.join("-")}`}>
      <span className="eyebrow">Sources · verified {SUPERVISOR_REVIEW_DATE}</span>
      <div className="flex flex-wrap gap-1.5">{list.map((s) => <a key={s.id} href={s.url} target="_blank" rel="noreferrer" className="room-tag is-link" data-testid={`link-source-${s.id}`}>{s.title}<ExternalLink className="h-3 w-3" aria-hidden /></a>)}</div>
      {note && <p className="text-xs opacity-75">{note}</p>}
    </div>
  );
}

export function Badge({ kind }: { kind: "native" | "custom" | "simulated" | "conceptual" | "config" }) {
  const t = { native: "Native Amazon Connect", custom: "Custom integration", simulated: "Simulated", conceptual: "Conceptual demo", config: "Configuration dependent" }[kind];
  return <span className={`sc-badge is-${kind}`}>{t}</span>;
}

function Notes({ roomId }: { roomId: string }) {
  const { data, isLoading, isError, refetch } = usePresenterContent();
  if (isLoading) return <div className="sc-note" data-testid="presenter-loading">Loading presenter notes...</div>;
  if (isError) return <div className="sc-note">Presenter notes could not be loaded. <button type="button" className="underline" onClick={() => refetch()} data-testid={`button-presenter-retry-${roomId}`}>Retry</button></div>;
  const room = data?.rooms.find((r) => r.id === roomId);
  if (!room) return <div className="sc-note">No presenter notes are published for this section yet.</div>;
  const L = ({ h, xs }: { h: string; xs: string[] }) => xs.length ? <><h4>{h}</h4><ul className="list-disc pl-5">{xs.map((x) => <li key={x}>{x}</li>)}</ul></> : null;
  return (
    <div className="sc-note" data-testid={`presenter-notes-${roomId}`}>
      <span className="eyebrow">Presenter · {room.title}</span>
      <L h="Suggested narration" xs={room.speakerNotes} />
      <L h="Technical points" xs={room.technicalPoints} />
      <L h="Discovery questions" xs={room.discoveryQuestions} />
      {room.objections.length > 0 && <><h4>Customer objections</h4>{room.objections.map((o) => <p key={o.question} className="mb-1"><b>{o.question}</b> {o.answer}</p>)}</>}
      <L h="Recommended sequence" xs={room.progression} />
    </div>
  );
}

/** Private talk tracks: rendered only from the protected presenter API. */
export function SupervisorPresenterNotes({ roomId, title }: { roomId: string; title: string }) {
  const { isPresenter } = useDepot();
  if (!isPresenter) return null;
  return <div className="mt-5"><PresenterGate title={title} detail="Presenter notes for this lab are only served to signed-in portal users."><Notes roomId={roomId} /></PresenterGate></div>;
}

/** Public, non-private explanation of the latest engine event. Shown in Presenter mode. */
export function WhatJustHappened() {
  const { isPresenter } = useDepot();
  const { snap, label } = useSupervisor();
  if (!isPresenter) return null;
  const imp = snap.impacts[snap.impacts.length - 1];
  const logs = snap.log.slice(-3).reverse();
  return (
    <aside className="sc-wjh" data-testid="panel-what-just-happened" aria-live="polite">
      <span className="eyebrow">What just happened?</span>
      <p className="font-semibold">{label}</p>
      {logs.map((l, i) => <p key={i} className="text-sm"><span className="mono opacity-60">{clockLabel(l.at)}</span> {l.text}</p>)}
      {imp && <p className="text-sm opacity-80">Latest intervention: {imp.label}. {imp.explanation}</p>}
    </aside>
  );
}
