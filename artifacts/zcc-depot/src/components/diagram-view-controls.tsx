import { useState, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import "./demo-readiness.css";

export type DiagramView = { audience: "executive" | "technical"; motion: boolean; text: boolean };

/** Shared view state for diagrams. Motion defaults off when the user prefers reduced motion. */
export function useDiagramView(initial: Partial<DiagramView> = {}) {
  const reduce = useReducedMotion();
  const [view, setView] = useState<DiagramView>({ audience: "technical", motion: !reduce, text: false, ...initial });
  return { view, set: (p: Partial<DiagramView>) => setView((v) => ({ ...v, ...p })), motion: view.motion && !reduce };
}

export function DiagramViewControls({ view, set, testId, showMotion = true }: { view: DiagramView; set: (p: Partial<DiagramView>) => void; testId: string; showMotion?: boolean }) {
  return (
    <div className="dv-bar" role="group" aria-label="Diagram view" data-testid={`diagram-controls-${testId}`}>
      <div className="dv-seg">
        {(["executive", "technical"] as const).map((a) => (
          <button key={a} type="button" aria-pressed={view.audience === a} onClick={() => set({ audience: a })} data-testid={`button-diagram-${a}-${testId}`}>{a === "executive" ? "Executive" : "Technical"}</button>
        ))}
      </div>
      {showMotion && <button type="button" className="dv-tog" aria-pressed={view.motion} onClick={() => set({ motion: !view.motion })} data-testid={`button-diagram-motion-${testId}`}>Motion {view.motion ? "on" : "off"}</button>}
      <button type="button" className="dv-tog" aria-pressed={view.text} onClick={() => set({ text: !view.text })} data-testid={`button-diagram-text-${testId}`}>Text view</button>
      <p className="basis-full text-xs leading-relaxed opacity-80">Responsibility key: Zendesk · Amazon Connect/AWS · Customer · External. Confirm component ownership, configuration and entitlement for the actual deployment.</p>
    </div>
  );
}

/** Static readable alternative for event-driven diagrams; highlights the current step. */
export function EventPathText({ events, idx, audience, testId }: { events: { label: string; detail: string; node: string }[]; idx: number; audience: DiagramView["audience"]; testId: string }) {
  return (
    <div className="dv-text" data-testid={`text-diagram-alt-${testId}`}>
      <ol>{events.map((e, i) => (
        <li key={i} aria-current={i === idx ? "step" : undefined} className={i === idx ? "font-semibold" : i > idx ? "opacity-60" : ""}>
          {e.label}{audience === "technical" && <span className="block text-xs font-normal opacity-70"><span className="mono">{e.node}</span> · {e.detail}</span>}
        </li>))}</ol>
    </div>
  );
}

/** Wraps an existing diagram without changing its art: audience classes drive label density, text view swaps in a readable list while the diagram stays mounted (state preserved). */
export function DiagramFrame({ testId, children, text, showMotion = true, dark = false }: { testId: string; children: ReactNode; text: (audience: DiagramView["audience"]) => ReactNode; showMotion?: boolean; dark?: boolean }) {
  const dv = useDiagramView();
  return (
    <div className={`dv-frame dv-${dv.view.audience} ${dv.motion ? "" : "dv-still"} ${dark ? "is-dark" : ""}`} data-testid={`diagram-frame-${testId}`} data-audience={dv.view.audience}>
      <div className="dv-frame-bar">
        <DiagramViewControls view={dv.view} set={dv.set} testId={testId} showMotion={showMotion} />
        <span className="dv-hint">{dv.view.audience === "executive" ? "Executive: headline components only" : "Technical: sub-labels, ownership and details shown"}</span>
      </div>
      {dv.view.text && <div className="dv-text" data-testid={`text-diagram-alt-${testId}`}>{text(dv.view.audience)}</div>}
      <div className={dv.view.text ? "dv-hidden" : ""} aria-hidden={dv.view.text || undefined}>{children}</div>
    </div>
  );
}

export function EdgeList({ items, audience }: { items: { from: string; to: string; label?: string; note?: string }[]; audience: DiagramView["audience"] }) {
  return <ol>{items.map((e, i) => <li key={i}><strong>{e.from}</strong> to <strong>{e.to}</strong>{audience === "technical" && e.label ? `: ${e.label}` : ""}{audience === "technical" && e.note ? ` (${e.note})` : ""}</li>)}</ol>;
}
