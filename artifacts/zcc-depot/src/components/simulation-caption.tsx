import type { ReactNode } from "react";
import { Captions } from "lucide-react";
import "./simulation-caption.css";

/** Playback-owned text in normal document flow; never overlays the simulation. */
export function SimulationCaption({ title, children, status, step }: {
  title: string; children?: ReactNode; status?: string; step?: string;
}) {
  return (
    <aside className="simulation-caption" aria-label="Live simulation caption" data-testid="simulation-caption">
      <div className="simulation-caption-label"><Captions size={17} aria-hidden /><span>Live caption</span></div>
      <div className="simulation-caption-copy" role="status" aria-live="polite" aria-atomic="true">
        <div className="simulation-caption-meta">{status && <span>{status}</span>}{step && <span>{step}</span>}</div>
        <p><strong>{title}</strong>{children && <> — {children}</>}</p>
      </div>
    </aside>
  );
}
