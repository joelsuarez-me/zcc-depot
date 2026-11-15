import { useMemo, useState } from "react";
import type { FeatureArchitecture } from "@/data/feature-types";
import { DiagramViewControls, useDiagramView } from "@/components/diagram-view-controls";

const W = 1000;
const BOUNDARY_NOTE: Record<string, string> = { Customer: "Customer / caller", AWS: "AWS environment (ownership varies)", Zendesk: "Zendesk services", External: "External provider" };

export function FeatureArchitectureView({ arch, featureId }: { arch: FeatureArchitecture; featureId: string }) {
  const dv = useDiagramView();
  const [sel, setSel] = useState<string | null>(arch.nodes[0]?.id ?? null);
  const cols = Math.min(4, Math.max(1, arch.nodes.length));
  const rows = Math.ceil(arch.nodes.length / cols);
  const H = rows * 170;
  const pos = useMemo(() => {
    const m: Record<string, { x: number; y: number }> = {};
    arch.nodes.forEach((n, i) => {
      const r = Math.floor(i / cols); let c = i % cols; if (r % 2 === 1) c = cols - 1 - c; // snake layout keeps flow readable
      m[n.id] = { x: (W / cols) * (c + 0.5), y: 85 + r * 170 };
    });
    return m;
  }, [arch.nodes, cols]);
  const node = arch.nodes.find((n) => n.id === sel);
  if (arch.nodes.length === 0) return <div className="fx-empty text-sm">No architecture graph is published for this feature yet.</div>;
  const used = Array.from(new Set(arch.nodes.map((n) => n.boundary)));
  return (
    <div className={`space-y-3 ${dv.view.audience === "executive" ? "dv-exec" : ""} ${dv.motion ? "" : "dv-still"}`} data-testid={`arch-${featureId}`}>
      <DiagramViewControls view={dv.view} set={dv.set} testId={featureId} />
      {dv.view.text && (
        <div className="dv-text" data-testid={`text-arch-alt-${featureId}`}>
          <div className="fx-h">Readable path</div>
          <ol>{arch.edges.map((e, i) => { const a = arch.nodes.find((n) => n.id === e.from), b = arch.nodes.find((n) => n.id === e.to); return <li key={i}><strong>{a?.label}</strong>{dv.view.audience === "technical" && a ? ` (${a.boundary})` : ""} to <strong>{b?.label}</strong>{dv.view.audience === "technical" && b ? ` (${b.boundary})` : ""}{dv.view.audience === "technical" ? `: ${e.label}` : ""}{e.conditional ? " (conditional)" : ""}</li>; })}</ol>
        </div>
      )}
      <div className="flex flex-wrap gap-2 text-[0.7rem]">
        {used.map((b) => <span key={b} className={`b-${b} rounded-md border px-2 py-0.5 font-semibold`}>{BOUNDARY_NOTE[b]}</span>)}
        <span className="inline-flex items-center gap-1 text-[#11110D]/60"><svg width="22" height="6" aria-hidden><line x1="0" y1="3" x2="22" y2="3" stroke="#9a7a2a" strokeWidth="2" strokeDasharray="3 3" /></svg>Conditional path</span>
      </div>
      <div className={`fx-arch rounded-2xl border border-[#11110D]/10 bg-[#FBFBF8] ${dv.view.text ? "hidden" : "hidden md:block"}`} style={{ aspectRatio: `${W} / ${H}` }}>
        <svg viewBox={`0 0 ${W} ${H}`} aria-hidden>
          <defs><marker id={`fx-arrow-${featureId}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#203524" /></marker></defs>
          {arch.edges.map((e, i) => {
            const a = pos[e.from], b = pos[e.to]; if (!a || !b) return null;
            const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, s = 70 / len;
            const x1 = a.x + dx * s, y1 = a.y + dy * s * 0.6, x2 = b.x - dx * s, y2 = b.y - dy * s * 0.6;
            const dim = sel && e.from !== sel && e.to !== sel;
            return <g key={i}><path className={`fx-edge ${e.conditional ? "is-cond" : ""} ${dim ? "is-dim" : ""}`} d={`M${x1},${y1} L${x2},${y2}`} markerEnd={`url(#fx-arrow-${featureId})`} />
              <g className="fx-edge-label" transform={`translate(${(x1 + x2) / 2},${(y1 + y2) / 2})`} opacity={dim ? 0.4 : 1}>
                <circle r="11" fill="#FBFBF8" stroke="#203524" />
                <text textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="700" fill="#11110D">{i + 1}</text>
              </g></g>;
          })}
        </svg>
        {arch.nodes.map((n) => (
          <button key={n.id} type="button" className={`fx-node b-${n.boundary}`} aria-pressed={sel === n.id} title={n.detail} onClick={() => setSel(n.id)} data-testid={`button-arch-node-${n.id}`}
            style={{ left: `${(pos[n.id].x / W) * 100}%`, top: `${(pos[n.id].y / H) * 100}%` }}>
            <span className="mono block text-[0.6rem] font-normal opacity-60">{n.boundary}</span>{n.label}
          </button>
        ))}
      </div>
      <ol className={`space-y-1.5 md:hidden ${dv.view.text ? "hidden" : ""}`}>
        {arch.nodes.map((n, i) => (
          <li key={n.id}><button type="button" aria-pressed={sel === n.id} onClick={() => setSel(n.id)} className={`b-${n.boundary} w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold ${sel === n.id ? "outline outline-2 outline-[#11110D]" : ""}`}>
            <span className="mono mr-2 text-xs opacity-60">{i + 1}</span>{n.label}<span className="mono ml-2 text-[0.6rem] opacity-60">{n.boundary}</span></button></li>
        ))}
      </ol>
      {!dv.view.text && dv.view.audience === "technical" && <ol className="list-decimal space-y-1 pl-5 text-xs leading-relaxed text-[#11110D]/80" aria-label="Diagram connections" data-testid="architecture-edge-legend">
        {arch.edges.map((e, i) => <li key={i}><strong>{arch.nodes.find(n => n.id === e.from)?.label}</strong> to <strong>{arch.nodes.find(n => n.id === e.to)?.label}</strong>: {e.label}{e.conditional ? " (conditional)" : ""}</li>)}
      </ol>}
      {node && (
        <div key={node.id} className="fx-panel fx-enter" aria-live="polite" data-testid="text-arch-detail">
          <div className="fx-h">{BOUNDARY_NOTE[node.boundary]}</div>
          <h4 className="font-semibold">{node.label}</h4>
          <p className="mt-1 text-sm text-[#11110D]/72">{node.detail}</p>
          <ul className="mt-2 space-y-0.5 text-xs text-[#11110D]/65">
            {arch.edges.filter((e) => e.from === node.id || e.to === node.id).map((e, i) => (
              <li key={i}>{e.from === node.id ? "Sends to" : "Receives from"} {arch.nodes.find((x) => x.id === (e.from === node.id ? e.to : e.from))?.label}: {e.label}{e.conditional ? " (conditional)" : ""}</li>
            ))}
          </ul>
        </div>
      )}
      {arch.notes.length > 0 && <div className="fx-panel"><div className="fx-h">Architecture notes</div><ul className="list-disc space-y-1 pl-4 text-sm text-[#11110D]/72">{arch.notes.map((n) => <li key={n}>{n}</li>)}</ul></div>}
    </div>
  );
}
